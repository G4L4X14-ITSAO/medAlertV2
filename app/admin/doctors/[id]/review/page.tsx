'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { reviewDoctor } from '@/actions/admin';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ReviewDoctorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [doctor, setDoctor] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }
      setAdminId(authData.user.id);

      const { data: verificationData } = await supabase
        .from('doctor_verification')
        .select('id, doctor_id, professional_license, colegiation_number, clues_id, status, submitted_at')
        .eq('id', id)
        .single();

      setVerification(verificationData);
      if (verificationData?.doctor_id) {
        const { data: doctorData } = await supabase.schema('core_auth').from('user_profiles').select('id, legal_name, email').eq('id', verificationData.doctor_id).single();
        setDoctor(doctorData);
      }
    };

    fetchData();
  }, [id, router, supabase]);

  const handleSubmit = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      await reviewDoctor(id, decision, notes, adminId);
      toast.success('Solicitud procesada');
      router.push('/admin/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo revisar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!doctor || !verification) return <div className="p-6">Cargando...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Revisión médica</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{doctor.legal_name}</h1>
        <p className="text-slate-500">{doctor.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Cédula</p>
          <p className="font-semibold text-slate-950">{verification.professional_license}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Colegiación</p>
          <p className="font-semibold text-slate-950">{verification.colegiation_number ?? 'N/A'}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => setDecision('APPROVED')} className={`rounded-2xl border px-4 py-3 text-left ${decision === 'APPROVED' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
          Aprobar
        </button>
        <button type="button" onClick={() => setDecision('REJECTED')} className={`rounded-2xl border px-4 py-3 text-left ${decision === 'REJECTED' ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}>
          Rechazar
        </button>
      </div>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas de revisión" className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" />
      <div className="flex gap-3">
        <Button variant="secondary" className="w-full" onClick={() => router.back()}>Cancelar</Button>
        <Button className="w-full" onClick={handleSubmit} isLoading={loading}>Guardar decisión</Button>
      </div>
    </div>
  );
}
