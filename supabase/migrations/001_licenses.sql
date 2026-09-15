-- Users may read only their own license. Premium is granted exclusively
-- by a trusted backend after payment verification, never by the browser.
create table public.licenses (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check (plan in ('free', 'premium')),
 created_at timestamptz not null default now()
);
alter table public.licenses enable row level security;
revoke all on public.licenses from anon, authenticated;
grant select on public.licenses to authenticated;
grant all on public.licenses to service_role;
create policy "Read own license" on public.licenses for select to authenticated
 using ((select auth.uid()) = user_id);
create function public.create_free_license() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.licenses(user_id,plan) values (new.id,'free');
 return new;
end;
$$;
revoke all on function public.create_free_license() from public, anon, authenticated;
create trigger on_syntra_user_created after insert on auth.users
for each row execute function public.create_free_license();
insert into public.licenses(user_id,plan)
select id,'free' from auth.users on conflict(user_id) do nothing;
