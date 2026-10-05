import { EsiLevel, VitalSigns } from '../types/epis';

export interface EsiCalculationInput {
  chiefComplaint: string;
  painScore: number;
  symptomDuration: string;
  vitals: VitalSigns;
  isImmediateLifeThreat?: boolean;
  isHighRiskCondition?: boolean;
  isDisoriented?: boolean;
  predictedResources?: number;
}

export interface EsiCalculationResult {
  level: EsiLevel;
  title: string;
  priorityDescription: string;
  recommendedTimeframe: string;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  rationale: string[];
  dangerZoneVitals: boolean;
  resourceCount: number;
}

/**
 * Checks if vital signs violate safe limits for an adult patient,
 * as defined in the ESI (Emergency Severity Index v4) protocol.
 */
export function evaluateDangerZoneVitals(vitals: VitalSigns): {
  isDanger: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Heart Rate
  if (vitals.heartRate > 100) {
    reasons.push(`Tachycardia: HR ${vitals.heartRate} bpm (> 100 bpm threshold)`);
  } else if (vitals.heartRate < 50) {
    reasons.push(`Bradycardia: HR ${vitals.heartRate} bpm (< 50 bpm threshold)`);
  }

  // SpO2
  if (vitals.spo2 < 92) {
    reasons.push(`Hypoxemia: SpO2 ${vitals.spo2}% (< 92% room air threshold)`);
  }

  // Respiratory Rate
  if (vitals.respiratoryRate > 20) {
    reasons.push(`Tachypnea: RR ${vitals.respiratoryRate} bpm (> 20 bpm threshold)`);
  } else if (vitals.respiratoryRate < 10) {
    reasons.push(`Bradypnea: RR ${vitals.respiratoryRate} bpm (< 10 bpm threshold)`);
  }

  // Blood Pressure
  if (vitals.bpSystolic > 180 || vitals.bpDiastolic > 110) {
    reasons.push(`Hypertensive Urgency: BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`);
  } else if (vitals.bpSystolic < 90) {
    reasons.push(`Hypotension / Shock indicator: Systolic ${vitals.bpSystolic} mmHg (< 90 mmHg)`);
  }

  // Temperature
  if (vitals.tempF > 103.0) {
    reasons.push(`High Pyrexia: Temp ${vitals.tempF}°F (> 103.0°F)`);
  } else if (vitals.tempF < 95.0) {
    reasons.push(`Hypothermia: Temp ${vitals.tempF}°F (< 95.0°F)`);
  }

  return {
    isDanger: reasons.length > 0,
    reasons,
  };
}

/**
 * Predicts the number of clinical resources required based on chief complaint.
 * ESI resource definition: Labs, ECG/X-ray/CT, IV fluids, IV/IM meds, Specialty Consult.
 * Physical exam, PO meds, tetanus booster, simple bandage are NOT resources.
 */
export function estimateResourcesNeeded(chiefComplaint: string, painScore: number): number {
  const complaint = chiefComplaint.toLowerCase();

  // High complexity complaints usually require multiple resources (labs, imaging, IV)
  if (
    complaint.includes('chest pain') ||
    complaint.includes('shortness of breath') ||
    complaint.includes('abdominal pain') ||
    complaint.includes('trauma') ||
    complaint.includes('headache') && painScore >= 7 ||
    complaint.includes('fever') && complaint.includes('chills')
  ) {
    return 2; // >= 2 resources (ESI 3 or higher)
  }

  // Moderate complaints: usually 1 resource (e.g. simple X-ray for twisted ankle, or simple sutures)
  if (
    complaint.includes('ankle') ||
    complaint.includes('sprain') ||
    complaint.includes('laceration') ||
    complaint.includes('sore throat') ||
    complaint.includes('ear pain') ||
    complaint.includes('urinary') ||
    complaint.includes('cough')
  ) {
    return 1;
  }

  // Minor complaints: 0 resources (e.g., medication refill, rash check, suture removal)
  return 0;
}

/**
 * Full ESI v4 (Emergency Severity Index) Calculation Logic
 */
export function calculateEsiScore(input: EsiCalculationInput): EsiCalculationResult {
  const complaint = input.chiefComplaint.toLowerCase();
  const rationale: string[] = [];

  // 1. STEP A: Immediate life-saving intervention needed?
  const isDirectLifeThreat =
    input.isImmediateLifeThreat ||
    complaint.includes('cardiac arrest') ||
    complaint.includes('unresponsive') ||
    complaint.includes('stopped breathing') ||
    complaint.includes('severe anaphylaxis') ||
    complaint.includes('massive bleeding') ||
    input.vitals.heartRate === 0;

  if (isDirectLifeThreat) {
    rationale.push('STEP A: Patient presents with immediate compromise of airway, breathing, or hemodynamic stability.');
    rationale.push('Requires immediate resuscitative life-saving intervention without delay.');
    return {
      level: 1,
      title: 'Level 1: Resuscitation',
      priorityDescription: 'Immediate Life-Threatening',
      recommendedTimeframe: 'Immediate (0 minutes)',
      colorClass: {
        bg: 'bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-500/50',
        badge: 'bg-rose-600 text-white',
      },
      rationale,
      dangerZoneVitals: true,
      resourceCount: 3,
    };
  }

  // 2. STEP B: High-risk situation? Confused/lethargic? Severe pain/distress?
  const highRiskTriggers: string[] = [];
  if (complaint.includes('chest pain') || complaint.includes('pressure in chest')) {
    highRiskTriggers.push('Acute chest pain consistent with acute coronary syndrome (ACS)');
  }
  if (complaint.includes('stroke') || complaint.includes('facial droop') || complaint.includes('slurred speech')) {
    highRiskTriggers.push('Acute focal neurological deficit (stroke / code neuro protocol)');
  }
  if (complaint.includes('severe allergic') || complaint.includes('throat tightness') || complaint.includes('swelling')) {
    highRiskTriggers.push('Airway compromise danger from allergic reaction');
  }
  if (input.isDisoriented) {
    highRiskTriggers.push('Acute altered mental status, confusion, or disorientation');
  }
  if (input.painScore >= 8) {
    highRiskTriggers.push(`Severe distress with excruciating pain score (${input.painScore}/10)`);
  }
  if (input.isHighRiskCondition) {
    highRiskTriggers.push('High-risk clinical criteria flagged by clinician assessment');
  }

  if (highRiskTriggers.length > 0) {
    rationale.push('STEP B: High-risk situation, severe distress, or high potential for rapid clinical decompensation.');
    highRiskTriggers.forEach((trig) => rationale.push(`• ${trig}`));
    return {
      level: 2,
      title: 'Level 2: Emergent',
      priorityDescription: 'High Risk / Severe Pain / Rapid Deterioration Risk',
      recommendedTimeframe: 'Within 10 minutes',
      colorClass: {
        bg: 'bg-orange-950/40',
        text: 'text-orange-400',
        border: 'border-orange-500/50',
        badge: 'bg-orange-600 text-white',
      },
      rationale,
      dangerZoneVitals: false,
      resourceCount: 2,
    };
  }

  // 3. STEP C: How many resources are needed?
  const resources =
    input.predictedResources !== undefined
      ? input.predictedResources
      : estimateResourcesNeeded(input.chiefComplaint, input.painScore);

  const dangerEvaluation = evaluateDangerZoneVitals(input.vitals);

  // If 2 or more resources needed, evaluate vital signs
  if (resources >= 2) {
    // STEP D: Danger Zone Vitals check
    if (dangerEvaluation.isDanger) {
      rationale.push('STEP C: Multiple resources (≥2) required.');
      rationale.push('STEP D: Danger Zone Vitals breached - Upgrading from ESI Level 3 to Level 2:');
      dangerEvaluation.reasons.forEach((r) => rationale.push(`• ${r}`));

      return {
        level: 2,
        title: 'Level 2: Emergent (Vital Sign Override)',
        priorityDescription: 'Multiple Resources + Danger Zone Vitals',
        recommendedTimeframe: 'Within 10 minutes',
        colorClass: {
          bg: 'bg-orange-950/40',
          text: 'text-orange-400',
          border: 'border-orange-500/50',
          badge: 'bg-orange-600 text-white',
        },
        rationale,
        dangerZoneVitals: true,
        resourceCount: resources,
      };
    }

    rationale.push('STEP C: Complex case requiring multiple clinical resources (Labs, Diagnostic Imaging, IV access).');
    rationale.push('STEP D: Vital signs stable and within normal baseline parameters.');
    return {
      level: 3,
      title: 'Level 3: Urgent',
      priorityDescription: 'Multiple Clinical Resources Required (Stable Vitals)',
      recommendedTimeframe: 'Within 30 - 60 minutes',
      colorClass: {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        badge: 'bg-amber-600 text-white',
      },
      rationale,
      dangerZoneVitals: false,
      resourceCount: resources,
    };
  }

  if (resources === 1) {
    rationale.push('STEP C: Single diagnostic or therapeutic resource expected (e.g., Simple X-ray, Suture, or Monitored Oral Med).');
    rationale.push('Vital signs stable, low risk of deterioration.');
    return {
      level: 4,
      title: 'Level 4: Less Urgent',
      priorityDescription: 'Single Clinical Resource Required',
      recommendedTimeframe: 'Within 60 - 120 minutes',
      colorClass: {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/50',
        badge: 'bg-emerald-600 text-white',
      },
      rationale,
      dangerZoneVitals: false,
      resourceCount: 1,
    };
  }

  // 0 resources
  rationale.push('STEP C: No diagnostic or procedural resources required (e.g. routine prescription renewal, simple clean dressing, medical advice).');
  rationale.push('Routine ambulatory presentation.');
  return {
    level: 5,
    title: 'Level 5: Non-Urgent',
    priorityDescription: 'No Clinical Resources Required (Fast-Track / Clinic)',
    recommendedTimeframe: 'Within 120+ minutes / Ambulatory Clinic',
    colorClass: {
      bg: 'bg-sky-950/40',
      text: 'text-sky-400',
      border: 'border-sky-500/50',
      badge: 'bg-sky-600 text-white',
    },
    rationale,
    dangerZoneVitals: false,
    resourceCount: 0,
  };
}
