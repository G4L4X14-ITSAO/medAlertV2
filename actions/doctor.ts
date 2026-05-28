'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { InvitationEmail } from '@/emails/InvitationEmail';
import type { DocumentType, UserProfile } from '@/types';

export async function searchClues(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .schema('medical_catalogs')
    .from('catalog_clues')
    .select('id, code, name, state, municipality')
    .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function submitDoctorVerification(data: {
  doctorId: string;
  professionalLicense: string;
  colegiationNumber?: string;
  cluesId?: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.rpc('submit_doctor_verification', {
    doctor_user_id: data.doctorId,
    professional_license: data.professionalLicense,
    colegiation_number: data.colegiationNumber || null,
    clues_id: data.cluesId || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getDoctorDashboardStats(doctorId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_doctor_dashboard_stats', { doctor_user_id: doctorId });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? { total: 0, ROJO: 0, AMARILLO: 0, VERDE: 0, pending: 0 }) as { total: number; ROJO: number; AMARILLO: number; VERDE: number; pending: number };
}

export async function getDoctorPatients(search: string, triageFilter: string, page: number, limit: number) {
  const supabase = createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) {
    throw new Error('No autenticado');
  }

  const { data, error } = await supabase.rpc('get_doctor_patients', {
    doctor_user_id: authUser.user.id,
    search_text: search,
    triage_filter: triageFilter,
    page_number: page,
    page_limit: limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  const patients = (data ?? []) as Array<{ id: string; legal_name: string; email: string; role: string; is_active: boolean; created_at: string; triage: DocumentType }>;

  if (!patients.length) {
    return { data: [], total: 0 };
  }

  return {
    data: patients,
    total: patients.length,
  };
}

export async function invitePatient(email: string, cluesId?: string) {
  const supabase = createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) {
    throw new Error('No autenticado');
  }

  const { data: doctor, error: doctorError } = await supabase
    .schema('core_auth')
    .from('user_profiles')
    .select('legal_name, email')
    .eq('id', authUser.user.id)
    .maybeSingle();

  if (doctorError) {
    throw new Error(doctorError.message);
  }

  const { data: existingPatient } = await supabase
    .schema('core_auth')
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingPatient) {
    const { error } = await supabase.schema('clinical_data').from('patient_doctor_consent').insert({
      patient_id: existingPatient.id,
      doctor_id: authUser.user.id,
      status: 'ACTIVE',
      clues_id: cluesId || null,
      invited_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
      to: email,
      subject: 'Invitación a MedAlert',
      react: InvitationEmail({ doctorName: doctor?.legal_name ?? 'tu médico', token: 'INVITACION-MVP', expiresInDays: 7 }),
    });
  }

  revalidatePath('/doctor/patients');
}
