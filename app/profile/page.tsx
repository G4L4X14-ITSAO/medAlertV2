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

  const { data: profile } = await supabase.schema('core_auth').from('user_profiles').select('id, legal_name, email, role, curp, created_at').eq('id', user.id).maybeSingle();

  let doctorName: string | null = null;
  if (profile?.role === 'PATIENT') {
    const { data: consent } = await supabase.schema('clinical_data').from('patient_doctor_consent').select('doctor_id').eq('patient_id', user.id).eq('status', 'ACTIVE').maybeSingle();
    if (consent?.doctor_id) {
      const { data: doctor } = await supabase.schema('core_auth').from('user_profiles').select('legal_name').eq('id', consent.doctor_id).maybeSingle();
      doctorName = doctor?.legal_name ?? null;
    }
  }

  const dashboardLink = profile?.role === 'PATIENT' ? '/dashboard' : profile?.role === 'PROFESSIONAL' ? '/doctor/dashboard' : '/auth/profile-select';

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
      <Link href={dashboardLink} className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
        {profile?.role === 'PROFESSIONAL' ? 'Ir al panel médico' : profile?.role === 'PATIENT' ? 'Ir al panel' : 'Completar perfil'}
      </Link>
    </div>
  );
}
