-- Which second factor an account has turned on. Run once in the Supabase dashboard -> SQL editor.
--
-- TOTP lives in Supabase's own MFA tables and needs nothing here: an enrolled factor is visible through
-- mfa.listFactors() and raises the session to aal2. Email codes are not a Supabase factor type
-- (auth-js supports totp, phone, webauthn and recovery_code only), so the fact that an account wants one
-- has to be recorded somewhere we control. That is all this table is: a flag.
--
-- The code itself is never stored here. It is Supabase's own email OTP, sent through the project's SMTP
-- (Resend) using the Magic Link template, and verified by GoTrue. Verification leaves an `otp` entry in
-- the session's `amr` claim, which is what the app and the edge function check — the same mechanism
-- 004_device_reset.sql already relies on.

create table if not exists public.security_prefs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email_2fa  boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.security_prefs enable row level security;
revoke all on public.security_prefs from anon, authenticated;
grant select on public.security_prefs to authenticated;
grant all on public.security_prefs to service_role;

-- Readable by its owner so the sign-in screen knows whether to ask for a code.
drop policy if exists "Read own security prefs" on public.security_prefs;
create policy "Read own security prefs" on public.security_prefs
  for select to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policy on purpose: writes go through set_email_2fa() below, so that turning
-- the protection OFF can demand more than simply being signed in.

/**
 * Turns the email second factor on or off for the calling account.
 *
 * Turning it ON needs nothing beyond a session — you are adding a lock, not removing one.
 *
 * Turning it OFF demands a recent email confirmation, because otherwise the protection is worthless:
 * someone who got hold of a password could sign in and switch the second factor off before it was ever
 * used against them. Proving inbox access to remove an inbox-based factor is the whole point.
 */
create or replace function public.set_email_2fa(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_enabled is false then
    -- Same shape as device_reset.sql: an otp / magiclink entry in amr, newer than 15 minutes.
    select exists (
      select 1
      from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as a
      where a ->> 'method' in ('otp', 'magiclink')
        and (a ->> 'timestamp')::bigint > extract(epoch from now())::bigint - 900
    ) into confirmed;
    if not confirmed then
      raise exception 'email confirmation required';
    end if;
  end if;

  insert into public.security_prefs (user_id, email_2fa, updated_at)
  values (auth.uid(), p_enabled, now())
  on conflict (user_id) do update
    set email_2fa = excluded.email_2fa,
        updated_at = now();

  return p_enabled;
end;
$$;

revoke all on function public.set_email_2fa(boolean) from public, anon;
grant execute on function public.set_email_2fa(boolean) to authenticated;

/**
 * What the sign-in screen asks before it lets a password through, and what the authorize edge function
 * checks before it signs a token. Returns the flag for one account, readable without a session because
 * the caller has only just typed a password and may not hold one yet.
 *
 * It reveals one boolean about an address someone already had to type. That is the same exposure as any
 * "this account exists" signal on a login form, and far less than letting the client decide for itself
 * whether a second factor was required.
 */
create or replace function public.email_2fa_required(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted boolean;
begin
  select coalesce(p.email_2fa, false) into wanted
  from auth.users u
  left join public.security_prefs p on p.user_id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  return coalesce(wanted, false);
end;
$$;

revoke all on function public.email_2fa_required(text) from public;
grant execute on function public.email_2fa_required(text) to anon, authenticated;

-- Who has what (owner only, from the SQL editor):
-- select u.email, p.email_2fa, p.updated_at
-- from auth.users u
-- left join public.security_prefs p on p.user_id = u.id
-- order by p.updated_at desc nulls last;
