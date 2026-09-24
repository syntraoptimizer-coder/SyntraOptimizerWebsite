-- Linked PC becomes read-only: customers can see which PC holds their license, but can no longer
-- unbind it themselves. Run once in Supabase -> SQL editor, AFTER 004_device_reset.sql.
--
-- Two changes:
--   1. device_status() also returns the hardware ID, so the account page can show *which* PC is linked.
--      Until now it only said "a PC is linked", which is not much help when you own several.
--   2. reset_device() is revoked from `authenticated`. Hiding the button on the website would not have
--      been enough: the RPC is reachable from any browser console with a valid session, so the only
--      place the capability can actually be removed is here. Support can still unbind a customer from
--      the Supabase dashboard, which runs as service_role and is unaffected by this revoke.
--
-- Nothing is dropped: reset_device() and device_reset_log are kept so the flow can be restored with a
-- single `grant execute` if the decision is reversed.

-- The hwid is a hash the desktop app computes; it is the value claim_device() compares against, so the
-- website reveals it only on demand (see components/DeviceCard.tsx) rather than printing it on load.
create or replace function public.device_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.device_bindings;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into b from public.device_bindings where user_id = auth.uid();
  return jsonb_build_object(
    'bound', b.user_id is not null,
    'hwid', b.hwid,
    'linked_at', b.created_at,
    'last_seen', b.last_seen
  );
end;
$$;

revoke all on function public.device_status() from public, anon;
grant execute on function public.device_status() to authenticated;

-- The reset capability itself. After this, calling reset_device() from a customer session fails with
-- "permission denied for function reset_device".
revoke execute on function public.reset_device() from authenticated;
