import { Allergy, Medication, DrugInteractionAlert, VitalSigns } from '../types/epis';

interface DrugRule {
  drugAKeywords: string[];
  drugBKeywords: string[];
  severity: 'critical' | 'major' | 'moderate';
  title: string;
  description: string;
  recommendation: string;
}

const KNOWN_DRUG_INTERACTIONS: DrugRule[] = [
  {
    drugAKeywords: ['warfarin', 'coumadin', 'eliquis', 'apixaban', 'xarelto', 'rivaroxaban', 'pradaxa'],
    drugBKeywords: ['aspirin', 'ibuprofen', 'naproxen', 'advil', 'aleve', 'meloxicam', 'diclofenac'],
    severity: 'critical',
    title: 'Severe Hemorrhage / Bleeding Risk',
    description: 'Concurrent use of systemic anticoagulants with NSAIDs or antiplatelet agents exponentially increases risk of major gastrointestinal and intracranial hemorrhage.',
    recommendation: 'Avoid combination unless specifically directed by cardiology/hematology. Monitor INR/coagulation panel and consider gastroprotection.',
  },
  {
    drugAKeywords: ['lisinopril', 'enalapril', 'ramipril', 'losartan', 'valsartan'],
    drugBKeywords: ['spironolactone', 'eplerenone', 'potassium', 'k-dur'],
    severity: 'major',
    title: 'Severe Hyperkalemia Risk',
    description: 'Combining ACE inhibitors or ARBs with potassium-sparing diuretics or potassium supplements can lead to life-threatening elevated serum potassium levels and cardiac arrhythmias.',
    recommendation: 'Check baseline serum potassium and creatinine before administration. Continuous ECG monitoring if symptomatic.',
  },
  {
    drugAKeywords: ['metformin', 'glucophage'],
    drugBKeywords: ['contrast', 'iodinated', 'iv dye', 'ct contrast'],
    severity: 'major',
    title: 'Lactic Acidosis with IV Contrast Media',
    description: 'Administration of intravascular iodinated contrast agents in patients taking metformin can lead to acute renal impairment and fatal lactic acidosis.',
    recommendation: 'Withhold metformin at time of procedure and for 48 hours post-imaging. Re-evaluate eGFR prior to resumption.',
  },
  {
    drugAKeywords: ['tramadol', 'sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'duloxetine', 'venlafaxine'],
    drugBKeywords: ['selegiline', 'linezolid', 'rasagiline', 'sumatriptan', 'rizatriptan'],
    severity: 'critical',
    title: 'Serotonin Syndrome Toxicity',
    description: 'Co-administration of multiple serotonergic agents can precipitate hyperthermia, autonomic hyperactivity, clonus, and life-threatening serotonin toxicity.',
    recommendation: 'Contraindicated. Discontinue secondary serotonergic agent immediately; monitor core temperature and neurologic reflexes.',
  },
  {
    drugAKeywords: ['digoxin', 'lanoxin'],
    drugBKeywords: ['amiodarone', 'pacerone', 'verapamil', 'diltiazem'],
    severity: 'major',
    title: 'Digoxin Toxicity via Reduced Clearance',
    description: 'Amiodarone or non-dihydropyridine calcium channel blockers inhibit P-glycoprotein, dramatically elevating serum digoxin concentrations.',
    recommendation: 'Reduce oral digoxin dose by 30%–50% upon initiating inhibitor. Monitor trough serum digoxin levels and PR interval on ECG.',
  },
  {
    drugAKeywords: ['clopidogrel', 'plavix'],
    drugBKeywords: ['omeprazole', 'prilosec', 'esomeprazole', 'nexium'],
    severity: 'moderate',
    title: 'Reduced Antiplatelet Efficacy via CYP2C19',
    description: 'Omeprazole competitively inhibits CYP2C19 bioactivation of clopidogrel to its active metabolite, potentially reducing antiplatelet protection.',
    recommendation: 'Consider switching to pantoprazole or famotidine (H2 blocker) which exhibit minimal CYP2C19 inhibition.',
  },
];

const ALLERGY_CROSS_REACTIONS: {
  allergenKeywords: string[];
  contraindicatedKeywords: string[];
  severity: 'critical' | 'major' | 'moderate';
  title: string;
  reactionDetails: string;
}[] = [
  {
    allergenKeywords: ['penicillin', 'amoxicillin', 'ampicillin'],
    contraindicatedKeywords: ['amoxicillin', 'ampicillin', 'augmentin', 'piperacillin', 'zosyn', 'penicillin', 'keflex', 'cephalexin'],
    severity: 'critical',
    title: 'Beta-Lactam Anaphylaxis Alert',
    reactionDetails: 'Patient has documented severe allergy to Penicillin. Cross-reactivity with prescribed aminopenicillins and 1st generation cephalosporins can cause fatal anaphylactic shock.',
  },
  {
    allergenKeywords: ['sulfa', 'sulfonamide', 'bactrim'],
    contraindicatedKeywords: ['bactrim', 'septra', 'sulfamethoxazole', 'sulfadiazine'],
    severity: 'major',
    title: 'Sulfonamide Hypersensitivity Alert',
    reactionDetails: 'Known allergy to Sulfa drugs. Administration carries high risk of severe cutaneous adverse reactions (Stevens-Johnson syndrome / TEN).',
  },
  {
    allergenKeywords: ['latex'],
    contraindicatedKeywords: ['latex catheters', 'latex gloves'],
    severity: 'moderate',
    title: 'Latex Precautions Alert',
    reactionDetails: 'Patient has documented Type I or contact hypersensitivity to natural rubber latex. Non-latex gloves and medical tubing required.',
  },
];

/**
 * Evaluates active medications and allergies to detect life-threatening interactions
 */
export function analyzeDrugSafety(
  medications: Medication[],
  allergies: Allergy[],
  newMedicationName?: string
): DrugInteractionAlert[] {
  const alerts: DrugInteractionAlert[] = [];
  const allMeds = [...medications.map((m) => m.name.toLowerCase())];
  if (newMedicationName) {
    allMeds.push(newMedicationName.toLowerCase());
  }

  // 1. Cross-check Allergies against all medications
  allergies.forEach((allergy) => {
    const allergenName = allergy.allergen.toLowerCase();
    ALLERGY_CROSS_REACTIONS.forEach((rule) => {
      const allergyMatches = rule.allergenKeywords.some((kw) => allergenName.includes(kw));
      if (allergyMatches) {
        allMeds.forEach((med) => {
          const medMatches = rule.contraindicatedKeywords.some((kw) => med.includes(kw));
          if (medMatches) {
            alerts.push({
              id: `allergy-${allergenName}-${med}`,
              severity: rule.severity,
              itemA: allergy.allergen,
              itemB: med,
              title: rule.title,
              description: rule.reactionDetails,
              recommendation: 'DO NOT ADMINISTER. Discontinue immediately and select alternative class (e.g. Macrolides, Fluoroquinolones, or Carbapenems as indicated).',
            });
          }
        });
      }
    });
  });

  // 2. Cross-check Drug-Drug interactions among active medications
  for (let i = 0; i < allMeds.length; i++) {
    for (let j = i + 1; j < allMeds.length; j++) {
      const medA = allMeds[i];
      const medB = allMeds[j];

      KNOWN_DRUG_INTERACTIONS.forEach((rule) => {
        const aMatches1 = rule.drugAKeywords.some((kw) => medA.includes(kw));
        const bMatches2 = rule.drugBKeywords.some((kw) => medB.includes(kw));

        const aMatches2 = rule.drugBKeywords.some((kw) => medA.includes(kw));
        const bMatches1 = rule.drugAKeywords.some((kw) => medB.includes(kw));

        if ((aMatches1 && bMatches2) || (aMatches2 && bMatches1)) {
          alerts.push({
            id: `drug-${medA}-${medB}`,
            severity: rule.severity,
            itemA: medA,
            itemB: medB,
            title: rule.title,
            description: rule.description,
            recommendation: rule.recommendation,
          });
        }
      });
    }
  }

  return alerts;
}

/**
 * Checks vital signs against clinical limits
 */
export function getVitalSignAlerts(vitals: VitalSigns): { label: string; level: 'critical' | 'warning' }[] {
  const alerts: { label: string; level: 'critical' | 'warning' }[] = [];

  if (vitals.bpSystolic >= 180 || vitals.bpDiastolic >= 110) {
    alerts.push({ label: `Hypertensive Crisis (BP ${vitals.bpSystolic}/${vitals.bpDiastolic})`, level: 'critical' });
  } else if (vitals.bpSystolic <= 90) {
    alerts.push({ label: `Hypotension / Shock Concern (BP ${vitals.bpSystolic}/${vitals.bpDiastolic})`, level: 'critical' });
  }

  if (vitals.spo2 < 90) {
    alerts.push({ label: `Critical Hypoxemia (SpO2 ${vitals.spo2}%)`, level: 'critical' });
  } else if (vitals.spo2 < 94) {
    alerts.push({ label: `Suboptimal Oxygenation (SpO2 ${vitals.spo2}%)`, level: 'warning' });
  }

  if (vitals.heartRate > 120) {
    alerts.push({ label: `Severe Tachycardia (${vitals.heartRate} bpm)`, level: 'critical' });
  } else if (vitals.heartRate < 50) {
    alerts.push({ label: `Marked Bradycardia (${vitals.heartRate} bpm)`, level: 'critical' });
  }

  if (vitals.tempF >= 103) {
    alerts.push({ label: `Severe Hyperpyrexia (${vitals.tempF}°F)`, level: 'critical' });
  }

  return alerts;
}
