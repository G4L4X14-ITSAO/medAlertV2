'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createVitalSigns } from '@/actions/signos';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

type VitalField = 'pas' | 'pad' | 'glucose';
type VitalFormData = {
  pas: string;
  pad: string;
  glucose: string;
  contexto: 'Ayunas' | 'Postprandial';
};

export default function SignosPage() {
  const router = useRouter();
  const supabase = createClient();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const [glucose, setGlucose] = useState('');
  const [contexto, setContexto] = useState<'Ayunas' | 'Postprandial'>('Ayunas');
  const [activeField, setActiveField] = useState<VitalField>('pas');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<VitalFormData | null>(null);

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
    const pasNum = pas === '' ? null : Number(pas);
    const padNum = pad === '' ? null : Number(pad);
    const glucoseNum = glucose === '' ? null : Number(glucose);

    const isPasCritical = pasNum !== null && !Number.isNaN(pasNum) && pasNum > 180;
    const isPadCritical = padNum !== null && !Number.isNaN(padNum) && padNum > 110;
    const isGlucoseCritical =
      glucoseNum !== null && !Number.isNaN(glucoseNum) && (glucoseNum < 54 || glucoseNum > 300);

    return isPasCritical || isPadCritical || isGlucoseCritical;
  }, [pas, pad, glucose]);

  const saveData = async (data: VitalFormData) => {
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
      toast.success('Signos guardados');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los signos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!pas || !pad || !glucose) {
      toast.error('Completa PAS, PAD y Glucosa antes de guardar');
      return;
    }

    const data = { pas, pad, glucose, contexto };
    if (critical) {
      setPendingData(data);
      setShowConfirmModal(true);
      return;
    }

    await saveData(data);
  };

  const handleKeyPress = (value: string) => {
    const setters = { pas: setPas, pad: setPad, glucose: setGlucose };
    const current = activeField === 'pas' ? pas : activeField === 'pad' ? pad : glucose;
    if (value === '⌫') {
      setters[activeField](current.slice(0, -1));
      return;
    }
    if (value === '.' && current.includes('.')) return;
    setters[activeField](`${current}${value}`);
  };

  const handleInputChange = (field: VitalField, value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      const setters = { pas: setPas, pad: setPad, glucose: setGlucose };
      setters[field](value);
    }
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
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">PAS</span>
              <input
                value={pas}
                onFocus={() => setActiveField('pas')}
                onChange={(event) => handleInputChange('pas', event.target.value)}
                inputMode="decimal"
                className={`w-full rounded-2xl border px-4 py-3 text-2xl font-semibold ${activeField === 'pas' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'}`}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">PAD</span>
              <input
                value={pad}
                onFocus={() => setActiveField('pad')}
                onChange={(event) => handleInputChange('pad', event.target.value)}
                inputMode="decimal"
                className={`w-full rounded-2xl border px-4 py-3 text-2xl font-semibold ${activeField === 'pad' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'}`}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Glucosa</span>
              <input
                value={glucose}
                onFocus={() => setActiveField('glucose')}
                onChange={(event) => handleInputChange('glucose', event.target.value)}
                inputMode="decimal"
                className={`w-full rounded-2xl border px-4 py-3 text-2xl font-semibold ${activeField === 'glucose' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'}`}
              />
            </label>
            <select value={contexto} onChange={(event) => setContexto(event.target.value as any)} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
              <option value="Ayunas">Ayunas</option>
              <option value="Postprandial">Postprandial</option>
            </select>
          </div>
          <div>
            <p className="sr-only" aria-live="polite">
              Campo activo: {activeField.toUpperCase()}
            </p>
            <p className="mb-3 text-sm text-slate-600">Campo activo: <span className="font-semibold uppercase">{activeField}</span></p>
            <div className="grid grid-cols-3 gap-3">
              {keys.map((key) => (
                <button key={key} type="button" onClick={() => handleKeyPress(key)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg font-semibold hover:bg-slate-100">
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
                setActiveField('pas');
              }}>
                Limpiar
              </Button>
            </div>
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
                if (pendingData) {
                  await saveData(pendingData);
                }
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
