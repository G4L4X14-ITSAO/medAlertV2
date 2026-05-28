export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, getTriageColor, getStatusColor } from '@/utils/helpers';

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
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

  const { data: consent } = await supabase.schema('clinical_data').from('patient_doctor_consent').select('id').eq('patient_id', params.id).eq('doctor_id', user.id).eq('status', 'ACTIVE').maybeSingle();
  if (!consent) {
    redirect('/unauthorized');
  }

  const [{ data: patient }, { data: signs }, { data: medications }, { data: adherence }] = await Promise.all([
    supabase.schema('core_auth').from('user_profiles').select('id, legal_name, email, curp, created_at').eq('id', params.id).maybeSingle(),
    supabase.schema('clinical_data').from('clinical_documents').select('id, created_at, document_type').eq('patient_id', params.id).order('created_at', { ascending: false }).limit(10),
    supabase.schema('clinical_data').from('patient_medication_plan').select('id, medication_id, dose_magnitude, unit, status, start_date, end_date, notes').eq('patient_id', params.id),
    supabase.schema('clinical_data').from('medication_adherence_log').select('id, compliance_date, state, registered_at').eq('patient_id', params.id).order('compliance_date', { ascending: false }).limit(30),
  ]);

  const medicationIds = (medications ?? []).map((item) => item.medication_id);
  const { data: catalog } = medicationIds.length
    ? await supabase.schema('medical_catalogs').from('catalog_medications').select('id, generic_name, commercial_name').in('id', medicationIds)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Expediente</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{patient?.legal_name ?? 'Paciente'}</h1>
        <p className="mt-2 text-slate-600">{patient?.email}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/doctor/patient/${params.id}/botiquin`} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Botiquín</Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Signos recientes</h2>
          <div className="mt-4 space-y-3">
            {(signs ?? []).map((sign) => (
              <div key={sign.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-950">{formatDate(sign.created_at)}</p>
                  <p className="text-sm text-slate-500">Documento clínico</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTriageColor(sign.document_type)}`}>{sign.document_type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Medicamentos activos</h2>
          <div className="mt-4 space-y-3">
            {(medications ?? []).map((medication) => {
              const catalogItem = catalog?.find((item) => item.id === medication.medication_id);
              return (
                <div key={medication.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-950">{catalogItem?.generic_name ?? 'Medicamento'}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(medication.status)}`}>{medication.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{medication.dose_magnitude} {medication.unit}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Adherencia reciente</h2>
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(adherence ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4">{row.compliance_date}</td>
                  <td className="px-6 py-4">{row.state}</td>
                  <td className="px-6 py-4">{row.registered_at ? formatDate(row.registered_at) : 'Pendiente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
