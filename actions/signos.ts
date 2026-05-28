'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { resend } from '@/lib/resend';
import { CriticalAlertEmail } from '@/emails/CriticalAlertEmail';

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

function determineTriage(pas?: number, pad?: number, glucose?: number) {
  const pasValue = pas ?? 0;
  const padValue = pad ?? 0;
  const glucoseValue = glucose ?? 0;

  if (pasValue > 180 || padValue > 110 || glucoseValue < 54 || glucoseValue > 300) {
    return 'ROJO' as const;
  }

  if (
    (pasValue >= 140 && pasValue <= 179) ||
    (padValue >= 90 && padValue <= 109) ||
    (glucoseValue >= 126 && glucoseValue <= 300) ||
    (glucoseValue >= 55 && glucoseValue <= 69)
  ) {
    return 'AMARILLO' as const;
  }

  return 'VERDE' as const;
}

export async function createVitalSigns(data: {
  patientId: string;
  createdBy: string;
  pas?: number;
  pad?: number;
  glucose?: number;
  estadoIngesta: string;
}) {
  const supabase = createServiceClient();
  const triage = determineTriage(data.pas, data.pad, data.glucose);

  const { data: document, error: documentError } = await supabase
    .schema('clinical_data')
    .from('clinical_documents')
    .insert({
      patient_id: data.patientId,
      created_by: data.createdBy,
      document_type: triage,
    })
    .select('id')
    .single();

  if (documentError) {
    throw new Error(documentError.message);
  }

  const { error: versionError } = await supabase.schema('clinical_data').from('clinical_document_versions').insert({
    document_id: document.id,
    version: 1,
    content_structured: {
      pas: data.pas ?? null,
      pad: data.pad ?? null,
      glucose: data.glucose ?? null,
      estadoIngesta: data.estadoIngesta,
    },
    created_by: data.createdBy,
  });

  if (versionError) {
    throw new Error(versionError.message);
  }

  if (triage === 'ROJO' && env.RESEND_API_KEY) {
    const { data: consent } = await supabase
      .schema('clinical_data')
      .from('patient_doctor_consent')
      .select('doctor_id')
      .eq('patient_id', data.patientId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (consent?.doctor_id) {
      const { data: doctor } = await supabase.schema('core_auth').from('user_profiles').select('email').eq('id', consent.doctor_id).maybeSingle();
      if (doctor?.email) {
        await resend.emails.send({
          from: env.RESEND_FROM ?? 'MedAlert <noreply@medalert.local>',
          to: doctor.email,
          subject: 'Alerta crítica de signos',
          react: CriticalAlertEmail({
            patientId: data.patientId,
            pas: data.pas ?? 0,
            pad: data.pad ?? 0,
            glucose: data.glucose ?? 0,
          }),
        });
      }
    }
  }

  revalidatePath('/dashboard/signos');
  revalidatePath('/dashboard');
}

export async function getSignsHistory(patientId: string, startDate: string, endDate: string, page: number) {
  const supabase = createClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  const { data: documents, count, error } = await supabase
    .schema('clinical_data')
    .from('clinical_documents')
    .select('id, created_at, document_type', { count: 'exact' })
    .eq('patient_id', patientId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  const documentIds = (documents ?? []).map((item: { id: string }) => item.id);
  const { data: versions } = documentIds.length
    ? await supabase.schema('clinical_data').from('clinical_document_versions').select('document_id, content_structured').in('document_id', documentIds)
    : { data: [] };

  const formatted = (documents ?? []).map((document: { id: string; created_at: string; document_type: string }) => {
    const version = versions?.find((item: { document_id: string; content_structured: Record<string, unknown> }) => item.document_id === document.id);
    return {
      id: document.id,
      created_at: document.created_at,
      triage: document.document_type,
      content: version?.content_structured ?? {},
    };
  });

  return { data: formatted, total: count ?? formatted.length };
}
