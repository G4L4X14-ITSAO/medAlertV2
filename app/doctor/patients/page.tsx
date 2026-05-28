'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDoctorPatients, invitePatient } from '@/actions/doctor';
import { Button } from '@/components/ui/Button';
import { Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [triageFilter, setTriageFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteClues, setInviteClues] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('invite=true')) {
      setShowInviteModal(true);
    }
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const result = await getDoctorPatients(search, triageFilter, page, 10);
      setPatients(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, search, triageFilter]);

  const handleInvite = async () => {
    setInviting(true);
    try {
      await invitePatient(inviteEmail, inviteClues || undefined);
      toast.success('Paciente invitado');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteClues('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo invitar al paciente');
    } finally {
      setInviting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Pacientes</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Lista con búsqueda y triage</h1>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="h-4 w-4" />
            Invitar paciente
          </Button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <select value={triageFilter} onChange={(event) => setTriageFilter(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
            <option value="">Todos</option>
            <option value="ROJO">Rojo</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="VERDE">Verde</option>
          </select>
          <Button variant="secondary" onClick={fetchPatients} isLoading={loading}>Actualizar</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Paciente</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Triage</th>
              <th className="px-6 py-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 font-semibold text-slate-950">{patient.legal_name}</td>
                <td className="px-6 py-4 text-slate-600">{patient.email}</td>
                <td className="px-6 py-4 text-slate-600">{patient.triage}</td>
                <td className="px-6 py-4">
                  <Link href={`/doctor/patient/${patient.id}`}>
                    <Button variant="secondary">
                      <Eye className="h-4 w-4" />
                      Ver expediente
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Anterior</Button>
        <p className="text-sm text-slate-500">Página {page} de {totalPages}</p>
        <Button variant="secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Siguiente</Button>
      </div>

      {showInviteModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-slate-950">Invitar paciente</h2>
            <div className="mt-4 grid gap-3">
              <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Correo electrónico" className="rounded-2xl border border-slate-200 px-4 py-3" />
              <input value={inviteClues} onChange={(event) => setInviteClues(event.target.value)} placeholder="CLUES opcional" className="rounded-2xl border border-slate-200 px-4 py-3" />
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="w-full" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
              <Button className="w-full" onClick={handleInvite} isLoading={inviting}>Invitar</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
