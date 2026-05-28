'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'next/navigation';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';
import { getPatientMedications, addMedication, editMedication, toggleMedicationStatus, deleteMedication, searchMedications } from '@/actions/medications';
import { Button } from '@/components/ui/Button';

export default function BotiquinPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMed, setEditingMed] = useState<any>(null);
  const [selectedMedication, setSelectedMedication] = useState<{ value: string; label: string } | null>(null);
  const [doseMagnitude, setDoseMagnitude] = useState('');
  const [unit, setUnit] = useState<'MG' | 'UI' | 'TABLET'>('MG');
  const [scheduleHours, setScheduleHours] = useState(['08:00']);
  const [notes, setNotes] = useState('');

  const fetchMeds = async () => {
    setLoading(true);
    try {
      const result = await getPatientMedications(patientId, 'TODOS', '', 1);
      setMedications(result.medications);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los medicamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, [patientId]);

  const loadOptions = async (input: string) => {
    const meds = await searchMedications(input);
    return meds.map((item) => ({ value: item.id, label: `${item.generic_name}${item.commercial_name ? ` - ${item.commercial_name}` : ''}` }));
  };

  const resetForm = () => {
    setEditingMed(null);
    setSelectedMedication(null);
    setDoseMagnitude('');
    setUnit('MG');
    setScheduleHours(['08:00']);
    setNotes('');
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMedication && !editingMed) return;

    try {
      if (editingMed) {
        await editMedication(editingMed.id, Number(doseMagnitude), unit, scheduleHours);
        toast.success('Medicamento actualizado');
      } else {
        await addMedication({
          patientId,
          medicationId: selectedMedication?.value ?? '',
          doseMagnitude: Number(doseMagnitude),
          unit,
          scheduleHours,
          notes,
        });
        toast.success('Medicamento agregado');
      }
      resetForm();
      await fetchMeds();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
    }
  };

  const handleToggle = async (planId: string, currentStatus: string) => {
    try {
      await toggleMedicationStatus(planId, currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
      toast.success('Estado actualizado');
      await fetchMeds();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el estado');
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await deleteMedication(planId);
      toast.success('Medicamento eliminado');
      await fetchMeds();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  };

  const handleEdit = (item: any) => {
    setEditingMed(item);
    setDoseMagnitude(String(item.dose_magnitude));
    setUnit(item.unit);
    setScheduleHours(item.schedule_hours?.length ? item.schedule_hours : ['08:00']);
    setNotes(item.notes ?? '');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Botiquín</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Medicamentos del paciente</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-[1.5rem] border border-slate-200 p-5">
          <AsyncSelect cacheOptions defaultOptions loadOptions={loadOptions} onChange={(option) => setSelectedMedication(option as any)} placeholder="Buscar medicamento" />
          <div className="grid gap-4 md:grid-cols-2">
            <input value={doseMagnitude} onChange={(event) => setDoseMagnitude(event.target.value)} placeholder="Dosis" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <select value={unit} onChange={(event) => setUnit(event.target.value as any)} className="rounded-2xl border border-slate-200 px-4 py-3">
              <option value="MG">MG</option>
              <option value="UI">UI</option>
              <option value="TABLET">TABLET</option>
            </select>
          </div>
          <div className="space-y-3">
            {scheduleHours.map((time, index) => (
              <input key={`${index}-${time}`} value={time} onChange={(event) => setScheduleHours((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="08:00" />
            ))}
            <Button type="button" variant="secondary" onClick={() => setScheduleHours((current) => [...current, ''])}>Agregar horario</Button>
          </div>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3" />
          <div className="flex gap-3">
            <Button type="submit">{editingMed ? 'Actualizar' : 'Agregar'}</Button>
            {editingMed ? <Button type="button" variant="secondary" onClick={resetForm}>Cancelar edición</Button> : null}
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {loading ? <p className="text-sm text-slate-500">Cargando...</p> : null}
        {medications.map((medication) => (
          <article key={medication.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{medication.medication_name}</h2>
                <p className="text-sm text-slate-500">{medication.dose_magnitude} {medication.unit} · {(medication.schedule_hours ?? []).join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => handleEdit(medication)}>Editar</Button>
                <Button variant="secondary" onClick={() => handleToggle(medication.id, medication.status)}>{medication.status === 'ACTIVE' ? 'Pausar' : 'Reactivar'}</Button>
                <Button variant="danger" onClick={() => handleDelete(medication.id)}>Eliminar</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
