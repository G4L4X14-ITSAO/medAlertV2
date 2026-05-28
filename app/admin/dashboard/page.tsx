export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAdminStats, getPendingVerifications } from '@/actions/admin';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userId = user.id;

  const { data: profile } = await supabase.schema('core_auth').from('user_profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  const stats = await getAdminStats();
  const pending = await getPendingVerifications();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Pendientes', stats.pendingDoctors],
          ['Usuarios', stats.totalUsers],
          ['Médicos activos', stats.activeDoctors],
          ['Pacientes activos', stats.activePatients],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label as string}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-950">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" id="pending">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Solicitudes pendientes</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Verificaciones por revisar</h1>
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Médico</th>
                <th className="px-6 py-4 font-medium">Cédula</th>
                <th className="px-6 py-4 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-semibold text-slate-950">{item.doctor?.legal_name ?? 'Sin nombre'}</td>
                  <td className="px-6 py-4 text-slate-600">{item.professional_license}</td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/doctors/${item.id}/review`} className="font-semibold text-rose-600">Revisar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
