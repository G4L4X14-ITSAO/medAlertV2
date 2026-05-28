-- Public RPC helpers for MedAlert
-- Execute this in Supabase SQL Editor after creating the schemas and tables.

create or replace function public.get_user_role(user_id uuid)
returns text
language sql
security definer
set search_path = public, core_auth
as $$
  select role::text
  from core_auth.user_profiles
  where id = user_id
$$;

create or replace function public.upsert_user_role(user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public, core_auth
as $$
begin
  if auth.uid() is distinct from user_id then
    raise exception 'forbidden';
  end if;

  insert into core_auth.user_profiles (id, role, email, legal_name, is_active)
  values (
    user_id,
    new_role::core_auth.user_role,
    coalesce((select email from auth.users where id = user_id), ''),
    coalesce((select raw_user_meta_data->>'legal_name' from auth.users where id = user_id), ''),
    true
  )
  on conflict (id) do update
    set role = excluded.role,
        updated_at = now();
end;
$$;

revoke all on function public.get_user_role(uuid) from public;
grant execute on function public.get_user_role(uuid) to authenticated;

revoke all on function public.upsert_user_role(uuid, text) from public;
grant execute on function public.upsert_user_role(uuid, text) to authenticated;
