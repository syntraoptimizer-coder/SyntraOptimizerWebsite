-- Device (HWID) reset with e-mail confirmation. Run once in Supabase -> SQL editor, AFTER device-lock.sql.
--
-- Flow: on the website the customer asks for a reset -> Supabase e-mails them a sign-in link -> clicking it gives
-- a session whose JWT carries an "otp" authentication method with a fresh timestamp -> only then does
-- reset_device() agree to unbind the PC. The e-mail check is enforced here, in the database, so it can't be
-- skipped by calling the function directly with an ordinary (already signed-in) session.
-- Limit: 2 resets per 30 days, so the reset can't be used to rotate an account between many PCs.

create table if not exists public.device_reset_log (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  at      timestamptz not null default now()
);
alter table public.device_reset_log enable row level security; -- no policies: not readable by clients

-- What the website shows: is a PC linked, since when, how many resets are left.
create or replace function public.device_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.device_bindings;
  used int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from public.device_bindings where user_id = auth.uid();
  select count(*) into used from public.device_reset_log
    where user_id = auth.uid() and at > now() - interval '30 days';
  return jsonb_build_object(
    'bound', b.user_id is not null,
    'linked_at', b.created_at,
    'last_seen', b.last_seen,
    'resets_left', greatest(0, 2 - used)
  );
end;
$$;

create or replace function public.reset_device()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed boolean;
  used int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as a
    where a ->> 'method' in ('otp', 'magiclink')
      and (a ->> 'timestamp')::bigint > extract(epoch from now())::bigint - 900
  ) into confirmed;
  if not confirmed then raise exception 'email confirmation required'; end if;

  select count(*) into used from public.device_reset_log
    where user_id = auth.uid() and at > now() - interval '30 days';
  if used >= 2 then raise exception 'reset limit reached'; end if;

  delete from public.device_bindings where user_id = auth.uid();
  insert into public.device_reset_log (user_id) values (auth.uid());
  return true;
end;
$$;

revoke all on function public.device_status() from public, anon;
revoke all on function public.reset_device() from public, anon;
grant execute on function public.device_status() to authenticated;
grant execute on function public.reset_device() to authenticated;
