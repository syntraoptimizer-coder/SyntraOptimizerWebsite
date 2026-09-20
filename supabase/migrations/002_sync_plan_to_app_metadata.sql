-- Keeps the desktop app's view of the plan in step with the website's.
--
-- The website reads public.licenses.plan; the Velyro Optimizer desktop app reads the account's app_metadata.plan
-- (only the server can write app_metadata, so users cannot promote themselves). The Stripe webhook already writes
-- both, but this trigger guarantees they can never drift apart, e.g. when a license is edited by hand in the
-- dashboard. Apply it once in the Supabase SQL editor, after 001_licenses.sql.

create or replace function public.sync_license_to_app_metadata() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 update auth.users
 set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('plan', new.plan)
 where id = new.user_id;
 return new;
end;
$$;
revoke all on function public.sync_license_to_app_metadata() from public, anon, authenticated;

drop trigger if exists on_license_plan_changed on public.licenses;
create trigger on_license_plan_changed after insert or update of plan on public.licenses
for each row execute function public.sync_license_to_app_metadata();

-- One-off catch-up for licenses that are already Premium (never downgrades anybody).
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || '{"plan":"premium"}'::jsonb
from public.licenses l
where l.user_id = u.id and l.plan = 'premium';
