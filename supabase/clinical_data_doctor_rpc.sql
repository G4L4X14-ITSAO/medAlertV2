-- Public RPC helpers for doctor dashboard flows.
-- Execute in Supabase SQL Editor after the base schema.

create or replace function public.get_doctor_dashboard_stats(doctor_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public, clinical_data, core_auth
as $$
  with active_patients as (
    select distinct patient_id
    from clinical_data.patient_doctor_consent
    where doctor_id = doctor_user_id
      and status = 'ACTIVE'
  ),
  latest_documents as (
    select distinct on (cd.patient_id)
      cd.patient_id,
      cd.document_type
    from clinical_data.clinical_documents cd
    join active_patients ap on ap.patient_id = cd.patient_id
    order by cd.patient_id, cd.created_at desc
  ),
  counts as (
    select
      count(*)::int as total,
      count(*) filter (where document_type = 'ROJO')::int as rojo,
      count(*) filter (where document_type = 'AMARILLO')::int as amarillo,
      count(*) filter (where document_type = 'VERDE')::int as verde
    from latest_documents
  )
  select jsonb_build_object(
    'total', coalesce((select total from counts), 0),
    'ROJO', coalesce((select rojo from counts), 0),
    'AMARILLO', coalesce((select amarillo from counts), 0),
    'VERDE', coalesce((select verde from counts), 0),
    'pending', 0
  );
$$;

create or replace function public.get_doctor_patients(
  doctor_user_id uuid,
  search_text text default '',
  triage_filter text default '',
  page_number int default 1,
  page_limit int default 8
)
returns table (
  id uuid,
  legal_name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz,
  triage text
)
language sql
security definer
set search_path = public, clinical_data, core_auth
as $$
  with active_patients as (
    select distinct patient_id
    from clinical_data.patient_doctor_consent
    where doctor_id = doctor_user_id
      and status = 'ACTIVE'
  ),
  latest_documents as (
    select distinct on (cd.patient_id)
      cd.patient_id,
      cd.document_type
    from clinical_data.clinical_documents cd
    join active_patients ap on ap.patient_id = cd.patient_id
    order by cd.patient_id, cd.created_at desc
  ),
  merged as (
    select
      up.id,
      up.legal_name,
      up.email,
      up.role::text,
      up.is_active,
      up.created_at,
      coalesce(ld.document_type::text, 'VERDE') as triage
    from core_auth.user_profiles up
    join active_patients ap on ap.patient_id = up.id
    left join latest_documents ld on ld.patient_id = up.id
    where (
      search_text = ''
      or up.legal_name ilike '%' || search_text || '%'
      or up.email ilike '%' || search_text || '%'
    )
    and (
      triage_filter = ''
      or coalesce(ld.document_type::text, 'VERDE') = triage_filter
    )
  )
  select *
  from merged
  order by case triage when 'ROJO' then 0 when 'AMARILLO' then 1 else 2 end, legal_name
  offset greatest(page_number - 1, 0) * page_limit
  limit page_limit;
$$;

create or replace function public.submit_doctor_verification(
  doctor_user_id uuid,
  professional_license text,
  colegiation_number text default null,
  clues_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, clinical_data
as $$
declare
  verification_id uuid;
begin
  if auth.uid() is distinct from doctor_user_id then
    raise exception 'forbidden';
  end if;

  insert into clinical_data.doctor_verification (
    doctor_id,
    professional_license,
    colegiation_number,
    clues_id,
    status
  )
  values (
    doctor_user_id,
    professional_license,
    colegiation_number,
    clues_id,
    'PENDING'
  )
  returning id into verification_id;

  return verification_id;
end;
$$;

revoke all on function public.get_doctor_dashboard_stats(uuid) from public;
grant execute on function public.get_doctor_dashboard_stats(uuid) to authenticated;

revoke all on function public.get_doctor_patients(uuid, text, text, int, int) from public;
grant execute on function public.get_doctor_patients(uuid, text, text, int, int) to authenticated;

revoke all on function public.submit_doctor_verification(uuid, text, text, uuid) from public;
grant execute on function public.submit_doctor_verification(uuid, text, text, uuid) to authenticated;
