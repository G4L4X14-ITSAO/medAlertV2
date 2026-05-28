export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profileData } = await supabase.rpc('get_user_profile', { p_user_id: user.id });
  const profile = profileData as { id: string; legal_name: string; email: string; role: string } | null;

  let doctorName: string | null = null;
  if (profile?.role === 'PATIENT') {
    const { data: doctorProfileData } = await supabase.rpc('get_patient_doctor_name', { p_patient_id: user.id });
    doctorName = (doctorProfileData as string | null) ?? null;
  }

  let verificationStatus: string | null = null;
  if (profile?.role === 'PROFESSIONAL') {
    const { data: status } = await supabase.rpc('get_doctor_verification_status', { p_doctor_id: user.id });
    verificationStatus = (status as string | null) ?? null;
  }

  const dashboardLink = profile?.role === 'PATIENT' ? '/dashboard' : profile?.role === 'PROFESSIONAL' && verificationStatus === 'APPROVED' ? '/doctor/dashboard' : '/auth/profile-select';

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Perfil</p>
      <h1 className="text-3xl font-semibold text-slate-950">Datos de usuario</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Nombre</p>
          <p className="font-semibold text-slate-950">{profile?.legal_name ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Correo</p>
          <p className="font-semibold text-slate-950">{profile?.email ?? user.email ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Rol</p>
          <p className="font-semibold text-slate-950">{profile?.role ?? 'PENDIENTE'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Doctor asignado</p>
          <p className="font-semibold text-slate-950">{doctorName ?? 'Sin asignar'}</p>
        </div>
      </div>

      {verificationStatus === 'PENDING' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">Verificación en revisión</p>
          <p className="mt-1 text-sm text-amber-700">Tu cédula profesional está siendo revisada por el administrador. Recibirás un correo cuando sea aprobada.</p>
        </div>
      ) : verificationStatus === 'REJECTED' ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-800">Verificación rechazada</p>
          <p className="mt-1 text-sm text-rose-700">Tu solicitud fue rechazada. Puedes volver a enviar tu información.</p>
          <Link href="/auth/verify-professional" className="mt-3 inline-flex rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
            Reenviar verificación
          </Link>
        </div>
      ) : null}

      {verificationStatus !== 'PENDING' && verificationStatus !== 'REJECTED' ? (
        <Link href={dashboardLink} className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {profile?.role === 'PROFESSIONAL' ? 'Ir al panel médico' : profile?.role === 'PATIENT' ? 'Ir al panel' : 'Completar perfil'}
        </Link>
      ) : null}
    </div>
  );
}
