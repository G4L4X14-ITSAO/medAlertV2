'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { searchMedications, suggestMedication } from '@/actions/medications';
import { Button } from '@/components/ui/Button';

export default function AddMedicationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [medication, setMedication] = useState<{ value: string; label: string } | null>(null);
  const [doseMagnitude, setDoseMagnitude] = useState('');
  const [unit, setUnit] = useState<'MG' | 'UI' | 'TABLET'>('MG');
  const [scheduleHours, setScheduleHours] = useState(['08:00']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setPatientId(data.user.id);
    };

    loadUser();
  }, [router, supabase]);

  const loadMedOptions = async (input: string) => {
    const meds = await searchMedications(input);
    return meds.map((item) => ({ value: item.id, label: `${item.generic_name}${item.commercial_name ? ` - ${item.commercial_name}` : ''}` }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!patientId || !medication) return;

    setLoading(true);
    try {
      await suggestMedication({
        medicationId: medication.value,
        doseMagnitude: Number(doseMagnitude),
        unit,
        scheduleHours,
        notes,
        patientId,
      });
      toast.success('Sugerencia enviada');
      router.push('/dashboard/medications');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la sugerencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Sugerir medicamento</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Propón un tratamiento a tu médico</h1>
      </div>
      <div className="space-y-4">
        <AsyncSelect cacheOptions defaultOptions loadOptions={loadMedOptions} onChange={(option) => setMedication(option as any)} placeholder="Buscar medicamento" />
        <div className="grid gap-4 md:grid-cols-2">
          <input value={doseMagnitude} onChange={(event) => setDoseMagnitude(event.target.value)} placeholder="Dosis" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <select value={unit} onChange={(event) => setUnit(event.target.value as any)} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="MG">MG</option>
            <option value="UI">UI</option>
            <option value="TABLET">TABLET</option>
          </select>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Horarios</p>
          {scheduleHours.map((time, index) => (
            <div key={`${time}-${index}`} className="flex gap-3">
              <input value={time} onChange={(event) => setScheduleHours((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="08:00" />
              <Button type="button" variant="secondary" onClick={() => setScheduleHours((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Quitar</Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setScheduleHours((current) => [...current, ''])}>Agregar horario</Button>
        </div>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas para el médico" className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" />
      </div>
      <Button type="submit" isLoading={loading}>Enviar sugerencia</Button>
    </form>
  );
}
