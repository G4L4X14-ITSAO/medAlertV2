'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createVitalSigns } from '@/actions/signos';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function SignosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const [glucose, setGlucose] = useState('');
  const [contexto, setContexto] = useState<'Ayunas' | 'Postprandial'>('Ayunas');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

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

  const critical = useMemo(() => {
    const pasNum = Number(pas) || 0;
    const padNum = Number(pad) || 0;
    const glucoseNum = Number(glucose) || 0;
    return pasNum > 180 || padNum > 110 || glucoseNum < 54 || glucoseNum > 300;
  }, [pas, pad, glucose]);

  const activeField = pas === '' ? 'pas' : pad === '' ? 'pad' : 'glucose';
  const activeFieldLabel = activeField === 'pas'
    ? 'Presión alta (sistólica)'
    : activeField === 'pad'
      ? 'Presión baja (diastólica)'
      : 'Glucosa';

  const saveData = async (data: any) => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      await createVitalSigns({
        patientId,
        createdBy: patientId,
        pas: data.pas ? Number(data.pas) : undefined,
        pad: data.pad ? Number(data.pad) : undefined,
        glucose: data.glucose ? Number(data.glucose) : undefined,
        estadoIngesta: data.contexto,
      });
      toast.success('Signos guardados en tu expediente');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los signos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const data = { pas, pad, glucose, contexto };
    if (critical) {
      setPendingData(data);
      setShowConfirmModal(true);
      return;
    }

    await saveData(data);
  };

  const handleKeyPress = (value: string, field: 'pas' | 'pad' | 'glucose') => {
    const setters = { pas: setPas, pad: setPad, glucose: setGlucose };
    const current = field === 'pas' ? pas : field === 'pad' ? pad : glucose;
    if (value === '⌫') {
      setters[field](current.slice(0, -1));
      return;
    }
    if (value === '.' && current.includes('.')) return;
    setters[field](`${current}${value}`);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '⌫'];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="secondary" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Registrar signos</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Captura rápida con teclado numérico</h1>
        <p className="mt-2 text-sm text-slate-600">
          Primero registra la presión alta y la presión baja. Al guardar, la información se almacena en tu expediente.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Presión alta (sistólica)</span>
              <input value={pas} readOnly className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-2xl font-semibold" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Presión baja (diastólica)</span>
              <input value={pad} readOnly className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-2xl font-semibold" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Glucosa</span>
              <input value={glucose} readOnly className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-2xl font-semibold" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Momento de la medición</span>
              <select value={contexto} onChange={(event) => setContexto(event.target.value as any)} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                <option value="Ayunas">Ayunas</option>
                <option value="Postprandial">Postprandial</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-slate-600">Campo actual: {activeFieldLabel}</p>
            <div className="grid grid-cols-3 gap-3">
              {keys.map((key) => (
                <button key={key} type="button" onClick={() => handleKeyPress(key, activeField)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg font-semibold hover:bg-slate-100">
                  {key}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button variant={critical ? 'danger' : 'primary'} onClick={handleSubmit} isLoading={isLoading}>
                Guardar signos
              </Button>
              <Button variant="secondary" onClick={() => {
                setPas('');
                setPad('');
                setGlucose('');
              }}>
                Limpiar
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Estos datos se guardan en tu historial de signos para que puedas consultarlos después.</p>
            {critical ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Los valores parecen críticos y pedirán confirmación adicional.</p> : null}
          </div>
        </div>
      </div>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-slate-950">Confirmar registro crítico</h2>
            <p className="mt-3 text-slate-600">Los valores registrados superan el rango esperado. ¿Deseas continuar?</p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="w-full" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
              <Button className="w-full" onClick={async () => {
                setShowConfirmModal(false);
                await saveData(pendingData);
              }}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
