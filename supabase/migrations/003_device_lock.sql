-- One account = one PC. Run this once in the Supabase dashboard -> SQL editor.
--
-- The first PC that signs in to an account is bound to it (by a hashed hardware ID computed by the app).
-- Any other PC that signs in to the same account is refused by the app, which shows a "shared account" screen.
-- Users cannot read or write this table directly: the only way in is the claim_device() function below.

create table if not exists public.device_bindings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  hwid       text not null,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

alter table public.device_bindings enable row level security;
-- No policies on purpose: with RLS enabled and no policy, clients get no direct access.

create or replace function public.claim_device(p_hwid text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hwid text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_hwid is null or length(p_hwid) < 32 or length(p_hwid) > 128 then
    raise exception 'invalid device id';
  end if;

  -- First PC wins; the insert is race-safe thanks to the primary key.
  insert into public.device_bindings (user_id, hwid)
  values (auth.uid(), p_hwid)
  on conflict (user_id) do nothing;

  select hwid into current_hwid from public.device_bindings where user_id = auth.uid();

  if current_hwid = p_hwid then
    update public.device_bindings set last_seen = now() where user_id = auth.uid();
    return 'ok';
  end if;
  return 'mismatch';
end;
$$;

revoke all on function public.claim_device(text) from public, anon;
grant execute on function public.claim_device(text) to authenticated;

-- Let a customer move to a new PC (owner only, from the SQL editor):
-- delete from public.device_bindings
-- where user_id = (select id from auth.users where email = 'CUSTOMER@example.com');
