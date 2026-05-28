export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDoctorDashboardStats, getDoctorPatients } from '@/actions/doctor';
import { getTriageColor } from '@/utils/helpers';

export default async function DoctorDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase.schema('core_auth').from('user_profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'PROFESSIONAL' && profile?.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  const stats = await getDoctorDashboardStats(user.id);
  const patientsResult = await getDoctorPatients('', '', 1, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Pacientes', stats.total],
          ['Rojo', stats.ROJO],
          ['Amarillo', stats.AMARILLO],
          ['Verde', stats.VERDE],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label as string}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Pacientes</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Ordenados por triage</h1>
          </div>
          <Link href="/doctor/patients" className="text-sm font-semibold text-teal-700">Ver todos</Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientsResult.data.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 font-semibold text-slate-950">{patient.legal_name}</td>
                  <td className="px-6 py-4 text-slate-600">{patient.email}</td>
                  <td className="px-6 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTriageColor(patient.triage)}`}>{patient.triage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
