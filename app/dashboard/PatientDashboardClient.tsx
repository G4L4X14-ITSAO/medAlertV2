'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Clock3, HeartPulse, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { recordAdherence } from '@/actions/adherence';
import { getTriageColor } from '@/utils/helpers';
import type { DashboardSummary } from '@/types';

export function PatientDashboardClient({ name, doctorName, adherencePercent, activeMeds, triage, currentMeds, patientId }: DashboardSummary) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleCheck = async (scheduleHourId: string) => {
    setSavingId(scheduleHourId);
    try {
      await recordAdherence(scheduleHourId, patientId);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-teal-300">Hola, {name}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Tu control diario empieza aquí.</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Tu médico asignado es <span className="font-semibold text-white">{doctorName ?? 'pendiente de asignación'}</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/medications" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
              Ver medicamentos
            </Link>
            <Link href="/dashboard/signos" className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white">
              Registrar signos
            </Link>
          </div>
        </div>
        <div className={`rounded-[2rem] border p-8 shadow-sm ${getTriageColor(triage)} bg-white`}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Triage actual</p>
          <h2 className="mt-4 text-5xl font-semibold">{triage}</h2>
          <p className="mt-4 text-sm text-slate-600">Color calculado desde tu último registro clínico.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <HeartPulse className="h-5 w-5 text-teal-700" />
            Adherencia
          </div>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{Math.round(adherencePercent)}%</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <Clock3 className="h-5 w-5 text-teal-700" />
            Medicamentos activos
          </div>
          <p className="mt-4 text-4xl font-semibold text-slate-950">{activeMeds}</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <ShieldAlert className="h-5 w-5 text-teal-700" />
            Estado general
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-950">Seguimiento activo</p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Checklist de medicamentos</h2>
            <p className="mt-1 text-sm text-slate-500">Marca lo que tomaste en tu ventana actual.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {currentMeds.length ? currentMeds.map((medication) => (
            <div key={medication.scheduleHourId} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{medication.medicationName}</p>
                  <p className="text-sm text-slate-500">{medication.time}</p>
                </div>
                {medication.checked ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
              </div>
              <p className="mt-4 text-sm text-slate-600">Dosis: {medication.dose} {medication.unit}</p>
              <Button
                className="mt-5 w-full"
                variant={medication.checked ? 'secondary' : 'primary'}
                isLoading={savingId === medication.scheduleHourId}
                onClick={() => handleCheck(medication.scheduleHourId)}
                disabled={medication.checked}
              >
                {medication.checked ? 'Ya registrado' : 'Marcar tomado'}
              </Button>
            </div>
          )) : <p className="text-sm text-slate-500">No hay medicamentos programados en este horario.</p>}
        </div>
      </section>
    </div>
  );
}
