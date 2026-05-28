'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { DoctorApprovalEmail, DoctorRejectionEmail } from '@/emails/DoctorApprovalEmail';

export async function getAdminStats() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_admin_stats');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? { pendingDoctors: 0, totalUsers: 0, activeDoctors: 0, activePatients: 0 }) as {
    pendingDoctors: number;
    totalUsers: number;
    activeDoctors: number;
    activePatients: number;
  };
}

export async function getPendingVerifications() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_pending_verifications');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{
    id: string;
    doctor_id: string;
    professional_license: string;
    colegiation_number: string | null;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    review_notes: string | null;
    doctor: { id: string; legal_name: string; email: string } | null;
  }>;
}

export async function reviewDoctor(verificationId: string, status: 'APPROVED' | 'REJECTED', reviewNotes: string, adminId: string) {
  const supabase = createClient();

  const { data: doctor, error } = await supabase.rpc('admin_review_doctor', {
    p_verification_id: verificationId,
    p_status: status,
    p_notes: reviewNotes,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (process.env.RESEND_API_KEY && doctor) {
    const doctorInfo = doctor as { legal_name: string; email: string };
    if (status === 'APPROVED') {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
        to: doctorInfo.email,
        subject: 'Verificación aprobada',
        react: DoctorApprovalEmail({ name: doctorInfo.legal_name }),
      });
    } else {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
        to: doctorInfo.email,
        subject: 'Verificación rechazada',
        react: DoctorRejectionEmail({ name: doctorInfo.legal_name, reason: reviewNotes || 'No se indicó motivo' }),
      });
    }
  }

  revalidatePath('/admin/dashboard');
}
