'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { InvitationEmail } from '@/emails/InvitationEmail';
import type { DocumentType } from '@/types';

export async function searchClues(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('search_clues', { query });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{ id: string; code: string; name: string; state: string; municipality: string }>;
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

  return (data ?? { total: 0, ROJO: 0, AMARILLO: 0, VERDE: 0, pending: 0 }) as {
    total: number;
    ROJO: number;
    AMARILLO: number;
    VERDE: number;
    pending: number;
  };
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

  const patients = (data ?? []) as Array<{
    id: string;
    legal_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    triage: DocumentType;
  }>;

  return { data: patients, total: patients.length };
}

export async function invitePatient(email: string, cluesId?: string) {
  const supabase = createClient();

  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) {
    throw new Error('No autenticado');
  }

  const { data: doctorData, error: doctorError } = await supabase.rpc('get_user_profile', {
    p_user_id: authUser.user.id,
  });

  if (doctorError) {
    throw new Error(doctorError.message);
  }

  const doctor = doctorData as { id: string; legal_name: string; email: string; role: string } | null;

  const { data: patientId, error: patientError } = await supabase.rpc('find_patient_by_email', {
    p_email: email,
  });

  if (patientError) {
    throw new Error(patientError.message);
  }

  if (patientId) {
    const { error: consentError } = await supabase.rpc('create_patient_consent', {
      p_patient_id: patientId,
      p_doctor_id: authUser.user.id,
      p_clues_id: cluesId ?? null,
    });

    if (consentError && !consentError.message.includes('duplicate')) {
      throw new Error(consentError.message);
    }
  }

  if (!process.env.RESEND_API_KEY) {
    revalidatePath('/doctor/patients');
    return { emailSent: false };
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
    to: email,
    subject: 'Invitación a MedAlert',
    react: InvitationEmail({ doctorName: doctor?.legal_name ?? 'tu médico', token: 'INVITACION-MVP', expiresInDays: 7 }),
  });

  revalidatePath('/doctor/patients');
  return { emailSent: true };
}
