'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { searchClues, submitDoctorVerification } from '@/actions/doctor';
import { Button } from '@/components/ui/Button';
import { updateUserRole } from '@/actions/auth';

export default function VerifyProfessionalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [license, setLicense] = useState('');
  const [collegeNumber, setCollegeNumber] = useState('');
  const [cluesId, setCluesId] = useState<string | null>(null);
  const [cluesLabel, setCluesLabel] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setUserId(data.user.id);
    };

    loadUser();
  }, [router, supabase]);

  const loadCluesOptions = async (inputValue: string) => {
    const clues = await searchClues(inputValue);
    return clues.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      await submitDoctorVerification({
        doctorId: userId,
        professionalLicense: license,
        colegiationNumber: collegeNumber || undefined,
        cluesId: cluesId || undefined,
      });
      await updateUserRole(userId, 'PROFESSIONAL');
      toast.success('Verificación enviada');
      router.push('/doctor/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la verificación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Verificación profesional</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Confirma tu cédula y centro de trabajo</h1>
        <div className="mt-8 grid gap-4">
          <input
            required
            value={license}
            onChange={(event) => setLicense(event.target.value)}
            placeholder="Cédula profesional"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
          />
          <input
            value={collegeNumber}
            onChange={(event) => setCollegeNumber(event.target.value)}
            placeholder="Número de colegiación"
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500"
          />
          <div className="rounded-2xl border border-slate-200 px-3 py-2">
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadCluesOptions}
              placeholder="Buscar unidad médica CLUES"
              onChange={(option) => {
                setCluesId(option ? option.value : null);
                setCluesLabel(option ? option.label : '');
              }}
            />
          </div>
          {cluesLabel ? <p className="text-sm text-slate-500">Seleccionado: {cluesLabel}</p> : null}
          <Button type="submit" isLoading={loading}>Enviar solicitud</Button>
        </div>
      </form>
    </div>
  );
}
