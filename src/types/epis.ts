export type UserRole = 'patient' | 'paramedic' | 'nurse' | 'doctor';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  notifiedStatus: 'idle' | 'transmitting' | 'delivered';
  lastNotifiedTime?: string;
}

export interface Allergy {
  allergen: string;
  severity: 'anaphylactic' | 'severe' | 'moderate' | 'mild';
  reaction: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  indication: string;
  prescribedBy: string;
  active: boolean;
}

export interface VitalSigns {
  bpSystolic: number; // mmHg (e.g. 120)
  bpDiastolic: number; // mmHg (e.g. 80)
  heartRate: number; // bpm (e.g. 72)
  tempF: number; // °F (e.g. 98.6)
  spo2: number; // % (e.g. 98)
  respiratoryRate: number; // breaths/min (e.g. 16)
  timestamp: string;
}

export interface PatientProfile {
  id: string;
  mrn: string; // Medical Record Number
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  rhFactor: 'Positive' | 'Negative';
  allergies: Allergy[];
  chronicConditions: string[];
  medications: Medication[];
  dnrStatus: 'Full Code' | 'DNR (Do Not Resuscitate)' | 'DNI (Do Not Intubate)';
  implants: string[];
  primaryCarePhysician: {
    name: string;
    clinic: string;
    phone: string;
  };
  emergencyContacts: EmergencyContact[];
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  address: string;
  avatarUrl: string;
  consentSigned: boolean;
  consentTimestamp?: string;
}

export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export interface DrugInteractionAlert {
  id: string;
  severity: 'critical' | 'major' | 'moderate';
  itemA: string;
  itemB: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface TriageRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  chiefComplaint: string;
  symptomDuration: string;
  painScore: number; // 0 - 10
  painCharacter: string;
  vitals: VitalSigns;
  esiLevel: EsiLevel;
  esiRationale: string[];
  resourcesNeeded: number;
  dangerZoneVitals: boolean;
  alerts: DrugInteractionAlert[];
  status: 'critical_sos' | 'waiting' | 'in_triage' | 'examined' | 'bed_assigned' | 'discharged';
  bedAssignment?: string;
  emergencyOverride: boolean;
  timestamp: string;
}

export interface GPSLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  streetAddress: string;
  crossStreet: string;
  gridReference: string; // CAD what3words/grid style e.g. "METRO-SEC-842"
  fetching: boolean;
  error: string | null;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  patientMrn: string;
  reason: string;
  emergencyOverride: boolean;
}
