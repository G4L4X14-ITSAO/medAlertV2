'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPatientMedications } from '@/actions/medications';
import { Button } from '@/components/ui/Button';
import { Eye, Plus } from 'lucide-react';
import { getStatusColor, formatTime } from '@/utils/helpers';

export function MedicationsClient({ patientId }: { patientId: string }) {
  const [medications, setMedications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ACTIVOS');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPatientMedications(patientId, statusFilter, search, page);
      setMedications(result.medications);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Medicamentos</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Lista y seguimiento</h1>
          </div>
          <Link href="/dashboard/medications/add">
            <Button>
              <Plus className="h-4 w-4" />
              Sugerir medicamento
            </Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar medicamento" />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ACTIVOS">Activos</option>
            <option value="PAUSADOS">Pausados</option>
            <option value="TODOS">Todos</option>
          </select>
          <Button variant="secondary" onClick={fetchData} isLoading={loading}>Actualizar</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Medicamento</th>
              <th className="px-6 py-4 font-medium">Dosis</th>
              <th className="px-6 py-4 font-medium">Horario</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medications.map((medication) => (
              <tr key={medication.id}>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-950">{medication.medication_name}</p>
                  <p className="text-slate-500">{medication.commercial_name}</p>
                </td>
                <td className="px-6 py-4 text-slate-700">{medication.dose_magnitude} {medication.unit}</td>
                <td className="px-6 py-4 text-slate-700">{(medication.schedule_hours ?? []).join(', ')}</td>
                <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(medication.status)}`}>{medication.status}</span></td>
                <td className="px-6 py-4">
                  <Button variant="secondary" onClick={() => setSelectedMed(medication)}>
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
            {!medications.length ? (
              <tr><td className="px-6 py-8 text-center text-slate-500" colSpan={5}>No hay registros para mostrar.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Anterior</Button>
        <p className="text-sm text-slate-500">Página {page} de {totalPages}</p>
        <Button variant="secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Siguiente</Button>
      </div>

      {selectedMed ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Detalle</h2>
              <p className="text-slate-500">{selectedMed.medication_name}</p>
            </div>
            <Button variant="secondary" onClick={() => setSelectedMed(null)}>Cerrar</Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p><span className="font-semibold">Dosis:</span> {selectedMed.dose_magnitude} {selectedMed.unit}</p>
            <p><span className="font-semibold">Estado:</span> {selectedMed.status}</p>
            <p><span className="font-semibold">Horario:</span> {(selectedMed.schedule_hours ?? []).map((time: string) => formatTime(time)).join(', ')}</p>
            <p><span className="font-semibold">Notas:</span> {selectedMed.notes ?? 'Sin notas'}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
