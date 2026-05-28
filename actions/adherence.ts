'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function recordAdherence(scheduleHourId: string, patientId: string) {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.schema('clinical_data').from('medication_adherence_log').upsert(
    {
      schedule_hour_id: scheduleHourId,
      patient_id: patientId,
      compliance_date: today,
      state: 'TOMADO_A_TIEMPO',
      registered_at: new Date().toISOString(),
      created_by: patientId,
    },
    { onConflict: 'schedule_hour_id, compliance_date' },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
}
