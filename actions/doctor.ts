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
  const supabase = createServiceClient();
  const { error } = await supabase.schema('clinical_data').from('doctor_verification').insert({
    doctor_id: data.doctorId,
    professional_license: data.professionalLicense,
    colegiation_number: data.colegiationNumber || null,
    clues_id: data.cluesId || null,
    status: 'PENDING',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getDoctorDashboardStats(doctorId: string) {
  const supabase = createClient();
  const { data: consents, error: consentError } = await supabase
    .schema('clinical_data')
    .from('patient_doctor_consent')
    .select('patient_id')
    .eq('doctor_id', doctorId)
    .eq('status', 'ACTIVE');

  if (consentError) {
    throw new Error(consentError.message);
  }

  const patientIds = (consents ?? []).map((item) => item.patient_id);
  if (!patientIds.length) {
    return { total: 0, ROJO: 0, AMARILLO: 0, VERDE: 0, pending: 0 };
  }

  const { data: documents, error: docError } = await supabase
    .schema('clinical_data')
    .from('clinical_documents')
    .select('patient_id, document_type, created_at')
    .in('patient_id', patientIds)
    .order('created_at', { ascending: false });

  if (docError) {
    throw new Error(docError.message);
  }

  const latestByPatient = new Map<string, DocumentType>();
  (documents ?? []).forEach((document) => {
    if (!latestByPatient.has(document.patient_id)) {
      latestByPatient.set(document.patient_id, document.document_type as DocumentType);
    }
  });

  const counts: Record<DocumentType, number> = { ROJO: 0, AMARILLO: 0, VERDE: 0 };
  latestByPatient.forEach((triage) => {
    counts[triage] += 1;
  });

  return {
    total: patientIds.length,
    ...counts,
    pending: 0,
  };
}

export async function getDoctorPatients(search: string, triageFilter: string, page: number, limit: number) {
  const supabase = createClient();
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) {
    throw new Error('No autenticado');
  }

  const { data: consents, error: consentError } = await supabase
    .schema('clinical_data')
    .from('patient_doctor_consent')
    .select('patient_id, status, clues_id, invited_at')
    .eq('doctor_id', authUser.user.id)
    .eq('status', 'ACTIVE');

  if (consentError) {
    throw new Error(consentError.message);
  }

  const patientIds = (consents ?? []).map((item) => item.patient_id);
  if (!patientIds.length) {
    return { data: [], total: 0 };
  }

  const [profilesResult, documentsResult] = await Promise.all([
    supabase.schema('core_auth').from('user_profiles').select('id, legal_name, email, role, is_active, created_at').in('id', patientIds),
    supabase.schema('clinical_data').from('clinical_documents').select('patient_id, document_type, created_at').in('patient_id', patientIds).order('created_at', { ascending: false }),
  ]);

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message);
  }

  const latestByPatient = new Map<string, DocumentType>();
  (documentsResult.data ?? []).forEach((document) => {
    if (!latestByPatient.has(document.patient_id)) {
      latestByPatient.set(document.patient_id, document.document_type as DocumentType);
    }
  });

  const merged = (profilesResult.data ?? [])
    .map((profile: { id: string; legal_name: string; email: string; role: string; is_active: boolean; created_at: string }) => {
      const triage = latestByPatient.get(profile.id) ?? 'VERDE';
      return {
        ...profile,
        triage,
      };
    })
    .filter((patient) => {
      const matchesSearch = search
        ? patient.legal_name.toLowerCase().includes(search.toLowerCase()) || patient.email.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesTriage = triageFilter ? patient.triage === triageFilter : true;
      return matchesSearch && matchesTriage;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { ROJO: 0, AMARILLO: 1, VERDE: 2 };
      return order[a.triage] - order[b.triage];
    });

  const start = (page - 1) * limit;
  return {
    data: merged.slice(start, start + limit),
    total: merged.length,
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
