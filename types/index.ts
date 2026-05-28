export type UserRole = 'PATIENT' | 'PROFESSIONAL' | 'SUPER_ADMIN';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PlanStatus = 'ACTIVE' | 'PAUSED' | 'PENDING_APPROVAL' | 'REJECTED';
export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type AdherenceState = 'TOMADO_A_TIEMPO' | 'TOMADO_FUERA_TIEMPO' | 'NO_TOMADO' | 'PENDIENTE';
export type DocumentType = 'VERDE' | 'AMARILLO' | 'ROJO';
export type DoseUnit = 'MG' | 'UI' | 'TABLET';
export type GlucoseContext = 'Ayunas' | 'Postprandial';

export interface UserProfile {
  id: string;
  legal_name: string;
  curp: string | null;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Medication {
  id: string;
  generic_name: string;
  commercial_name: string | null;
}

export interface PatientMedicationPlan {
  id: string;
  patient_id: string;
  medication_id: string;
  medication_name: string;
  dose_magnitude: number;
  unit: DoseUnit;
  status: PlanStatus;
  start_date: string;
  end_date: string | null;
  schedule_hours: string[];
}

export interface VitalSigns {
  pas?: number;
  pad?: number;
  glucose?: number;
  estadoIngesta: GlucoseContext;
}

export interface ClinicalDocument {
  id: string;
  patient_id: string;
  document_type: DocumentType;
  created_at: string;
  version_content: VitalSigns;
}

export interface DashboardSummary {
  name: string;
  doctorName: string | null;
  adherencePercent: number;
  activeMeds: number;
  triage: DocumentType;
  currentMeds: Array<{
    scheduleHourId: string;
    medicationName: string;
    time: string;
    dose: number;
    unit: DoseUnit;
    checked: boolean;
  }>;
  patientId: string;
}
