'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { DoctorApprovalEmail, DoctorRejectionEmail } from '@/emails/DoctorApprovalEmail';

export async function getAdminStats() {
  const supabase = createServiceClient();
  const [pendingDoctors, totalUsers, activeDoctors, activePatients] = await Promise.all([
    supabase.schema('clinical_data').from('doctor_verification').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.schema('core_auth').from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.schema('core_auth').from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'PROFESSIONAL').eq('is_active', true),
    supabase.schema('core_auth').from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'PATIENT').eq('is_active', true),
  ]);

  return {
    pendingDoctors: pendingDoctors.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    activeDoctors: activeDoctors.count ?? 0,
    activePatients: activePatients.count ?? 0,
  };
}

export async function getPendingVerifications() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .schema('clinical_data')
    .from('doctor_verification')
    .select('id, doctor_id, professional_license, colegiation_number, status, submitted_at, reviewed_at, review_notes')
    .eq('status', 'PENDING')
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return [];
  }

  const { data: doctors } = await supabase.schema('core_auth').from('user_profiles').select('id, legal_name, email').in('id', data.map((item) => item.doctor_id));

  return (data ?? []).map((item) => ({
    ...item,
    doctor: doctors?.find((doctor) => doctor.id === item.doctor_id) ?? null,
  }));
}

export async function reviewDoctor(verificationId: string, status: 'APPROVED' | 'REJECTED', reviewNotes: string, adminId: string) {
  const supabase = createServiceClient();
  const { data: verification, error: fetchError } = await supabase
    .schema('clinical_data')
    .from('doctor_verification')
    .select('doctor_id, professional_license, colegiation_number, status')
    .eq('id', verificationId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data: doctor, error: doctorError } = await supabase
    .schema('core_auth')
    .from('user_profiles')
    .select('legal_name, email')
    .eq('id', verification.doctor_id)
    .single();

  if (doctorError) {
    throw new Error(doctorError.message);
  }

  const { error: updateError } = await supabase
    .schema('clinical_data')
    .from('doctor_verification')
    .update({
      status,
      reviewed_by: adminId,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', verificationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (status === 'APPROVED') {
    await supabase.schema('core_auth').from('user_profiles').update({ role: 'PROFESSIONAL' }).eq('id', verification.doctor_id);

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
        to: doctor.email,
        subject: 'Verificación aprobada',
        react: DoctorApprovalEmail({ name: doctor.legal_name }),
      });
    }
  } else if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
      to: doctor.email,
      subject: 'Verificación rechazada',
      react: DoctorRejectionEmail({ name: doctor.legal_name, reason: reviewNotes || 'No se indicó motivo' }),
    });
  }

  revalidatePath('/admin/dashboard');
}
