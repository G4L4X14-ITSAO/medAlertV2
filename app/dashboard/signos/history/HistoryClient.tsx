'use client';

import { useEffect, useState } from 'react';
import { getSignsHistory } from '@/actions/signos';
import { Button } from '@/components/ui/Button';
import { formatDate, getTriageColor } from '@/utils/helpers';

export function HistoryClient({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const result = await getSignsHistory(patientId, startDate.toISOString(), new Date().toISOString(), page);
      setRecords(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, days]);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Historial de signos</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Últimos registros</h1>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {[7, 30, 90].map((option) => (
            <Button key={option} variant={days === option ? 'primary' : 'secondary'} onClick={() => setDays(option)}>{option} días</Button>
          ))}
          <Button variant="secondary" onClick={fetchData} isLoading={loading}>Actualizar</Button>
        </div>
      </div>

      <div className="space-y-4">
        {records.map((record) => (
          <article key={record.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{formatDate(record.created_at)}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Registro clínico</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTriageColor(record.triage)}`}>{record.triage}</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <p><span className="font-semibold">Presión alta:</span> {record.content?.pas ?? 'N/A'}</p>
              <p><span className="font-semibold">Presión baja:</span> {record.content?.pad ?? 'N/A'}</p>
              <p><span className="font-semibold">Glucosa:</span> {record.content?.glucose ?? 'N/A'}</p>
            </div>
          </article>
        ))}
        {!records.length ? <p className="text-sm text-slate-500">Sin registros para el periodo seleccionado.</p> : null}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Anterior</Button>
        <p className="text-sm text-slate-500">Página {page} de {totalPages}</p>
        <Button variant="secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Siguiente</Button>
      </div>
    </div>
  );
}
