'use server';

import { createClient } from '@/lib/supabase/server';
import type { DashboardSummary } from '@/types';

function formatTimeValue(value: string) {
  return value.slice(0, 5);
}

export async function getPatientDashboardData(patientId: string): Promise<DashboardSummary> {
  const supabase = createClient();

  const [{ data: profile }, { data: consent }, { data: activePlans }, { data: adherenceLogs }, { data: documents }] = await Promise.all([
    supabase.schema('core_auth').from('user_profiles').select('legal_name').eq('id', patientId).maybeSingle(),
    supabase.schema('clinical_data').from('patient_doctor_consent').select('doctor_id').eq('patient_id', patientId).eq('status', 'ACTIVE').maybeSingle(),
    supabase.schema('clinical_data').from('patient_medication_plan').select('id, medication_id, dose_magnitude, unit, status').eq('patient_id', patientId).in('status', ['ACTIVE', 'PAUSED']),
    supabase.schema('clinical_data').from('medication_adherence_log').select('schedule_hour_id, state').eq('patient_id', patientId).eq('compliance_date', new Date().toISOString().split('T')[0]),
    supabase.schema('clinical_data').from('clinical_documents').select('document_type, created_at').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1),
  ]);

  const { data: doctor } = consent?.doctor_id
    ? await supabase.schema('core_auth').from('user_profiles').select('legal_name').eq('id', consent.doctor_id).maybeSingle()
    : { data: null };

  const { data: medications } = activePlans?.length
    ? await supabase.schema('medical_catalogs').from('catalog_medications').select('id, generic_name').in('id', activePlans.map((item) => item.medication_id))
    : { data: [] };

  const { data: scheduleHours } = activePlans?.length
    ? await supabase.schema('clinical_data').from('medication_schedule_hours').select('id, plan_id, target_time').in('plan_id', activePlans.map((item) => item.id))
    : { data: [] };

  const totalMeds = activePlans?.length ?? 0;
  const taken = adherenceLogs?.filter((item) => item.state === 'TOMADO_A_TIEMPO').length ?? 0;
  const currentHour = new Date().getHours();
  const windowStart = currentHour - 1;
  const windowEnd = currentHour + 1;

  const currentMeds = (activePlans ?? []).flatMap((plan) => {
    const medication = medications?.find((item) => item.id === plan.medication_id);
    const hours = (scheduleHours ?? []).filter((item) => item.plan_id === plan.id);

    return hours
      .filter((hour) => {
        const hourNumber = Number(formatTimeValue(hour.target_time).slice(0, 2));
        return hourNumber >= windowStart && hourNumber <= windowEnd;
      })
      .map((hour) => ({
        scheduleHourId: hour.id,
        medicationName: medication?.generic_name ?? 'Medicamento',
        time: formatTimeValue(hour.target_time),
        dose: Number(plan.dose_magnitude),
        unit: plan.unit,
        checked: (adherenceLogs ?? []).some((log) => log.schedule_hour_id === hour.id),
      }));
  });

  return {
    name: profile?.legal_name ?? 'Paciente',
    doctorName: doctor?.legal_name ?? null,
    adherencePercent: totalMeds > 0 ? (taken / totalMeds) * 100 : 0,
    activeMeds: totalMeds,
    triage: (documents?.[0]?.document_type ?? 'VERDE') as DashboardSummary['triage'],
    currentMeds,
    patientId,
  };
}
