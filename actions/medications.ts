'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { MedicationSuggestionEmail } from '@/emails/MedicationSuggestionEmail';

export async function searchMedications(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema('medical_catalogs')
    .from('catalog_medications')
    .select('id, generic_name, commercial_name')
    .or(`generic_name.ilike.%${query}%,commercial_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPatientMedications(patientId: string, statusFilter: string, search: string, page: number) {
  const supabase = createClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  const { data: plans, error, count } = await supabase
    .schema('clinical_data')
    .from('patient_medication_plan')
    .select('id, patient_id, medication_id, dose_magnitude, unit, status, start_date, end_date, notes, prescribed_by', { count: 'exact' })
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  const medicationIds = [...new Set((plans ?? []).map((item) => item.medication_id))];
  const { data: medications } = medicationIds.length
    ? await supabase.schema('medical_catalogs').from('catalog_medications').select('id, generic_name, commercial_name').in('id', medicationIds)
    : { data: [] };

  const { data: scheduleHours } = plans?.length
    ? await supabase.schema('clinical_data').from('medication_schedule_hours').select('id, plan_id, target_time').in('plan_id', plans.map((item) => item.id))
    : { data: [] };

  const formatted = (plans ?? [])
    .map((plan) => {
      const medication = medications?.find((item) => item.id === plan.medication_id);
      const hours = (scheduleHours ?? [])
        .filter((item) => item.plan_id === plan.id)
        .map((item) => item.target_time.slice(0, 5));

      return {
        ...plan,
        medication_name: medication?.generic_name ?? 'Medicamento',
        commercial_name: medication?.commercial_name ?? null,
        schedule_hours: hours,
      };
    })
    .filter((item) => {
      const matchesStatus = statusFilter === 'ACTIVOS'
        ? item.status === 'ACTIVE' || item.status === 'PAUSED'
        : statusFilter === 'PAUSADOS'
          ? item.status === 'PAUSED'
          : true;
      const matchesSearch = search
        ? item.medication_name.toLowerCase().includes(search.toLowerCase()) || (item.commercial_name ?? '').toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });

  return { medications: formatted, total: count ?? formatted.length };
}

export async function suggestMedication(data: {
  medicationId: string;
  doseMagnitude: number;
  unit: string;
  scheduleHours: string[];
  notes?: string;
  patientId: string;
}) {
  const supabase = createClient();
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('No autenticado');
  }

  const [{ data: patient }, { data: medication }, { data: doctorConsent }] = await Promise.all([
    supabase.schema('core_auth').from('user_profiles').select('legal_name').eq('id', data.patientId).maybeSingle(),
    supabase.schema('medical_catalogs').from('catalog_medications').select('generic_name').eq('id', data.medicationId).maybeSingle(),
    supabase.schema('clinical_data').from('patient_doctor_consent').select('doctor_id').eq('patient_id', data.patientId).eq('status', 'ACTIVE').maybeSingle(),
  ]);

  if (doctorConsent?.doctor_id && process.env.RESEND_API_KEY) {
    const { data: doctor } = await supabase.schema('core_auth').from('user_profiles').select('legal_name, email').eq('id', doctorConsent.doctor_id).maybeSingle();

    if (doctor?.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
        to: doctor.email,
        subject: 'Nueva sugerencia de medicamento',
        react: MedicationSuggestionEmail({
          patientName: patient?.legal_name ?? 'Paciente',
          medicationName: medication?.generic_name ?? 'Medicamento',
          dose: `${data.doseMagnitude} ${data.unit}`,
          schedule: data.scheduleHours.join(', '),
          notes: data.notes ?? '',
          patientId: data.patientId,
        }),
      });
    }
  }

  revalidatePath('/dashboard/medications');
}

export async function addMedication(planData: {
  patientId: string;
  medicationId: string;
  doseMagnitude: number;
  unit: string;
  scheduleHours: string[];
  notes?: string;
}) {
  const supabase = createServiceClient();
  const { data: plan, error: planError } = await supabase
    .schema('clinical_data')
    .from('patient_medication_plan')
    .insert({
      patient_id: planData.patientId,
      medication_id: planData.medicationId,
      dose_magnitude: planData.doseMagnitude,
      unit: planData.unit,
      notes: planData.notes ?? null,
      status: 'ACTIVE',
    })
    .select('id')
    .single();

  if (planError) {
    throw new Error(planError.message);
  }

  const hours = planData.scheduleHours.map((time) => ({
    plan_id: plan.id,
    target_time: time.length === 5 ? `${time}:00` : time,
  }));

  const { error: hoursError } = await supabase.schema('clinical_data').from('medication_schedule_hours').insert(hours);
  if (hoursError) {
    throw new Error(hoursError.message);
  }

  revalidatePath(`/doctor/patient/${planData.patientId}/botiquin`);
}

export async function editMedication(planId: string, doseMagnitude: number, unit: string, scheduleHours: string[]) {
  const supabase = createServiceClient();
  const { error } = await supabase.schema('clinical_data').from('patient_medication_plan').update({ dose_magnitude: doseMagnitude, unit }).eq('id', planId);
  if (error) {
    throw new Error(error.message);
  }

  const { error: deleteError } = await supabase.schema('clinical_data').from('medication_schedule_hours').delete().eq('plan_id', planId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const hours = scheduleHours.map((time) => ({
    plan_id: planId,
    target_time: time.length === 5 ? `${time}:00` : time,
  }));

  const { error: insertError } = await supabase.schema('clinical_data').from('medication_schedule_hours').insert(hours);
  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath('/doctor/patient/[id]/botiquin');
}

export async function toggleMedicationStatus(planId: string, newStatus: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.schema('clinical_data').from('patient_medication_plan').update({ status: newStatus }).eq('id', planId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/doctor/patient/[id]/botiquin');
}

export async function deleteMedication(planId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.schema('clinical_data').from('patient_medication_plan').delete().eq('id', planId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/doctor/patient/[id]/botiquin');
}
