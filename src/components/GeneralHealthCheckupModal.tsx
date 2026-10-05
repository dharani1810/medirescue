import React, { useState, useMemo } from 'react';
import { PatientProfile, VitalSigns, TriageRecord, EsiLevel } from '../types/epis';
import { calculateEsiScore, evaluateDangerZoneVitals, EsiCalculationResult } from '../utils/triageEngine';
import { analyzeDrugSafety, getVitalSignAlerts } from '../utils/drugSafetyEngine';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Stethoscope,
  Pill,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface GeneralHealthCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSubmitTriage: (record: TriageRecord) => void;
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
}

const COMMON_COMPLAINTS = [
  'Mild substernal chest discomfort on exertion',
  'Shortness of breath on climbing stairs',
  'Right lower quadrant abdominal cramping',
  'Persistent dry cough with low-grade fever',
  'Throbbing unilateral headache with photophobia',
  'Acute right ankle twisting injury & swelling',
  'Deep forearm skin laceration (bleeding controlled)',
  'Elevated home blood pressure & dizziness',
  'Routine medication refill & diabetes check',
];

const PAIN_FACES = [
  { level: 0, label: 'No Pain', desc: 'Alert, smiling, completely comfortable' },
  { level: 2, label: 'Mild', desc: 'Noticeable, easily tolerated' },
  { level: 4, label: 'Moderate', desc: 'Distracting, interferes with concentration' },
  { level: 6, label: 'Severe', desc: 'Interferes with basic tasks' },
  { level: 8, label: 'Very Severe', desc: 'Intense distress, unable to focus' },
  { level: 10, label: 'Worst Possible', desc: 'Unbearable, excruciating, bedridden' },
];

export const GeneralHealthCheckupModal: React.FC<GeneralHealthCheckupModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSubmitTriage,
  onLogAudit,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState<string>('Mild substernal chest discomfort on exertion');
  const [symptomDuration, setSymptomDuration] = useState<string>('2 hours');
  const [painScore, setPainScore] = useState<number>(4);
  const [painCharacter, setPainCharacter] = useState<string>('Dull ache, non-radiating');
  const [isDisoriented, setIsDisoriented] = useState<boolean>(false);
  const [isImmediateLifeThreat, setIsImmediateLifeThreat] = useState<boolean>(false);

  // Vitals State
  const [vitals, setVitals] = useState<VitalSigns>({
    bpSystolic: 138,
    bpDiastolic: 88,
    heartRate: 84,
    tempF: 98.6,
    spo2: 97,
    respiratoryRate: 16,
    timestamp: 'Just now',
  });

  // New potential medication to screen for interaction
  const [newMedicationTest, setNewMedicationTest] = useState<string>('');

  // 1. Calculate ESI Score using standardized clinical engine
  const esiResult: EsiCalculationResult = useMemo(() => {
    return calculateEsiScore({
      chiefComplaint,
      painScore,
      symptomDuration,
      vitals,
      isDisoriented,
      isImmediateLifeThreat,
    });
  }, [chiefComplaint, painScore, symptomDuration, vitals, isDisoriented, isImmediateLifeThreat]);

  // 2. Calculate Drug & Allergy safety alerts
  const drugAlerts = useMemo(() => {
    return analyzeDrugSafety(patient.medications, patient.allergies, newMedicationTest);
  }, [patient.medications, patient.allergies, newMedicationTest]);

  // 3. Vital Sign Threshold alerts
  const vitalAlerts = useMemo(() => {
    return getVitalSignAlerts(vitals);
  }, [vitals]);

  const handleVitalsPreset = (preset: 'normal' | 'hypertensive' | 'tachycardic' | 'febrile') => {
    switch (preset) {
      case 'normal':
        setVitals({
          bpSystolic: 120,
          bpDiastolic: 80,
          heartRate: 72,
          tempF: 98.6,
          spo2: 99,
          respiratoryRate: 14,
          timestamp: 'Just now',
        });
        break;
      case 'hypertensive':
        setVitals({
          bpSystolic: 182,
          bpDiastolic: 104,
          heartRate: 92,
          tempF: 98.7,
          spo2: 96,
          respiratoryRate: 18,
          timestamp: 'Just now',
        });
        break;
      case 'tachycardic':
        setVitals({
          bpSystolic: 126,
          bpDiastolic: 82,
          heartRate: 118,
          tempF: 99.1,
          spo2: 93,
          respiratoryRate: 22,
          timestamp: 'Just now',
        });
        break;
      case 'febrile':
        setVitals({
          bpSystolic: 114,
          bpDiastolic: 72,
          heartRate: 102,
          tempF: 102.4,
          spo2: 96,
          respiratoryRate: 20,
          timestamp: 'Just now',
        });
        break;
    }
  };

  const handleFinishAndSubmit = () => {
    const record: TriageRecord = {
      id: `tr-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      chiefComplaint,
      symptomDuration,
      painScore,
      painCharacter,
      vitals: {
        ...vitals,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      esiLevel: esiResult.level,
      esiRationale: esiResult.rationale,
      resourcesNeeded: esiResult.resourceCount,
      dangerZoneVitals: esiResult.dangerZoneVitals,
      alerts: drugAlerts,
      status: esiResult.level <= 2 ? 'in_triage' : 'waiting',
      emergencyOverride: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onSubmitTriage(record);
    onLogAudit(
      'HEALTH_INTAKE_SUBMITTED',
      `Triage intake completed. Chief complaint: "${chiefComplaint}". Computed ESI Level: ${esiResult.level} (${esiResult.title}).`,
      false
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-checkup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 id="health-checkup-modal-title" className="text-base font-bold text-white font-mono">
                General Health Check-Up & Triage Intake
              </h2>
              <p className="text-xs text-slate-400">
                Patient: <span className="text-slate-200 font-semibold">{patient.name}</span> · MRN: {patient.mrn} · Blood Type: {patient.bloodType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { num: 1, label: '1. Symptoms & Pain' },
              { num: 2, label: '2. Vital Signs' },
              { num: 3, label: '3. ESI Clinical Triage' },
              { num: 4, label: '4. Medications & Safety' },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num as 1 | 2 | 3 | 4)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentStep === step.num
                    ? 'bg-sky-600 text-white font-semibold'
                    : currentStep > step.num
                    ? 'text-sky-300 hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Chief Complaint & Pain Assessment */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-2">
                  Chief Complaint / Reason for Visit
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Describe main symptoms in patient's own words..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_COMPLAINTS.slice(0, 5).map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setChiefComplaint(comp)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Symptom Duration & Character */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Symptom Onset & Duration
                  </label>
                  <input
                    type="text"
                    value={symptomDuration}
                    onChange={(e) => setSymptomDuration(e.target.value)}
                    placeholder="e.g. 2 hours, 3 days, sudden onset"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5">
                    Pain Character / Radiation
                  </label>
                  <input
                    type="text"
                    value={painCharacter}
                    onChange={(e) => setPainCharacter(e.target.value)}
                    placeholder="e.g. Sharp, dull, radiating to arm/back"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Visual Pain Scale 0 - 10 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Standardized Pain Score (0 - 10)
                  </label>
                  <span className="text-lg font-black text-rose-400 font-mono">
                    {painScore} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                  {PAIN_FACES.map((face) => (
                    <button
                      key={face.level}
                      type="button"
                      onClick={() => setPainScore(face.level)}
                      className={`p-2 rounded-lg text-left border transition-colors ${
                        painScore === face.level || (painScore >= face.level && painScore < face.level + 2 && face.level < 10)
                          ? 'bg-rose-950/40 border-rose-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs flex items-center justify-between">
                        <span>Level {face.level}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-200">{face.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{face.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* High Risk Flags */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Neurological & High-Risk Triage Check
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={isDisoriented}
                      onChange={(e) => setIsDisoriented(e.target.checked)}
                      className="rounded accent-sky-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-medium text-white">Altered Mental Status / Lethargy</div>
                      <div className="text-[10px] text-slate-400">Patient appears disoriented, confused, or unresponsive to questions</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={isImmediateLifeThreat}
                      onChange={(e) => setIsImmediateLifeThreat(e.target.checked)}
                      className="rounded accent-rose-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-medium text-rose-300">Severe Airway / Respiratory Distress</div>
                      <div className="text-[10px] text-slate-400">Stridor, cyanosis, gasping, or intubation candidate (ESI 1)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Vital Signs Entry */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Current Clinical Vital Signs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter measured patient telemetry. Safety algorithms automatically check for critical vital threshold breaches.
                  </p>
                </div>

                {/* Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1 font-mono">Presets:</span>
                  <button
                    onClick={() => handleVitalsPreset('normal')}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleVitalsPreset('hypertensive')}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
                  >
                    High BP
                  </button>
                  <button
                    onClick={() => handleVitalsPreset('tachycardic')}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30"
                  >
                    Tachycardia
                  </button>
                  <button
                    onClick={() => handleVitalsPreset('febrile')}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30"
                  >
                    Fever
                  </button>
                </div>
              </div>

              {/* Vitals Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Blood Pressure */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Gauge className="w-4 h-4 text-sky-400" />
                      Blood Pressure (mmHg)
                    </span>
                    <span className="text-[11px] font-mono">Normal: 120/80</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={vitals.bpSystolic}
                      onChange={(e) => setVitals({ ...vitals, bpSystolic: parseInt(e.target.value) || 0 })}
                      className="w-1/2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                      placeholder="Systolic"
                    />
                    <span className="text-slate-500 font-bold">/</span>
                    <input
                      type="number"
                      value={vitals.bpDiastolic}
                      onChange={(e) => setVitals({ ...vitals, bpDiastolic: parseInt(e.target.value) || 0 })}
                      className="w-1/2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                      placeholder="Diastolic"
                    />
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Heart className="w-4 h-4 text-rose-400" />
                      Heart Rate (BPM)
                    </span>
                    <span className="text-[11px] font-mono">Normal: 60-100</span>
                  </div>
                  <input
                    type="number"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                  />
                </div>

                {/* Temperature */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      Temperature (°F)
                    </span>
                    <span className="text-[11px] font-mono">Normal: 98.6°F</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.tempF}
                    onChange={(e) => setVitals({ ...vitals, tempF: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                  />
                </div>

                {/* Oxygen Saturation */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      SpO2 Saturation (%)
                    </span>
                    <span className="text-[11px] font-mono">Normal: ≥95%</span>
                  </div>
                  <input
                    type="number"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                  />
                </div>

                {/* Respiratory Rate */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Respiratory Rate (bpm)
                    </span>
                    <span className="text-[11px] font-mono">Normal: 12-20</span>
                  </div>
                  <input
                    type="number"
                    value={vitals.respiratoryRate}
                    onChange={(e) => setVitals({ ...vitals, respiratoryRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-center font-bold"
                  />
                </div>

                {/* Danger Zone Status Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-center">
                  <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                    Vital Limits Analysis
                  </div>
                  <div className="mt-1">
                    {vitalAlerts.length === 0 ? (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Within Safe Baseline Range
                      </span>
                    ) : (
                      <span className="text-rose-400 text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {vitalAlerts.length} Critical Limit Breached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning box if vitals in danger */}
              {vitalAlerts.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-600/40 space-y-1">
                  <div className="text-xs font-bold text-rose-300 uppercase font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Automated Safety Warning: Critical Limits Exceeded
                  </div>
                  <div className="text-xs text-slate-300">
                    {vitalAlerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-rose-400">•</span>
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ESI Clinical Triage Result & Algorithm Breakdown */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Automated ESI Triage Score & Protocol Rationale
                </h3>
                <p className="text-xs text-slate-400">
                  Standardized Emergency Severity Index v4 clinical decision tree calculation.
                </p>
              </div>

              {/* ESI Main Card */}
              <div className={`p-5 rounded-2xl border ${esiResult.colorClass.border} ${esiResult.colorClass.bg} space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-xl font-mono font-black text-lg ${esiResult.colorClass.badge}`}>
                      ESI LEVEL {esiResult.level}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{esiResult.title}</h4>
                      <p className="text-xs text-slate-300">{esiResult.priorityDescription}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Target Time to Physician</div>
                    <div className="text-sm font-bold text-white font-mono flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {esiResult.recommendedTimeframe}
                    </div>
                  </div>
                </div>

                {/* Rationale Tree */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Decision Algorithm Rationale:
                  </div>
                  <div className="space-y-1.5">
                    {esiResult.rationale.map((line, idx) => (
                      <div key={idx} className="text-xs text-slate-200 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 font-mono">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ESI Level Explanatory Guide */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  ESI Protocol Reference Matrix
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    { lvl: 1, name: 'Resuscitation', time: 'Immediate', desc: 'Airway / life threat' },
                    { lvl: 2, name: 'Emergent', time: '< 10 min', desc: 'High risk / severe pain' },
                    { lvl: 3, name: 'Urgent', time: '30-60 min', desc: '2+ clinical resources' },
                    { lvl: 4, name: 'Less Urgent', time: '1-2 hrs', desc: '1 clinical resource' },
                    { lvl: 5, name: 'Non-Urgent', time: 'Ambulatory', desc: '0 clinical resources' },
                  ].map((guide) => (
                    <div
                      key={guide.lvl}
                      className={`p-2 rounded-lg border text-center ${
                        esiResult.level === guide.lvl
                          ? 'border-sky-500 bg-sky-950/40 text-white'
                          : 'border-slate-800/80 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="font-mono font-bold">ESI {guide.lvl}</div>
                      <div className="text-[11px] font-semibold text-slate-200">{guide.name}</div>
                      <div className="text-[10px] text-slate-400">{guide.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Medications, Safety & Clinical Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Active Medications & Drug-Allergy Safety Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Cross-checks active outpatient prescriptions and planned drugs against known severe allergies.
                </p>
              </div>

              {/* Patient's Current Medications */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Active Home Medications ({patient.medications.length})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {patient.medications.map((med) => (
                    <div key={med.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{med.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{med.dosage}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{med.frequency}</div>
                      <div className="text-[10px] text-sky-400 mt-0.5">{med.indication}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Alerts / Interactions */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Automated Drug Interaction & Allergy Alerts
                    </span>
                  </div>
                  <span className="text-xs font-mono text-rose-400">
                    {drugAlerts.length} Flagged Warnings
                  </span>
                </div>

                {/* Test new medication interaction simulator */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">
                    Test planned medication or candidate antibiotic against patient allergy/drug profile:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMedicationTest}
                      onChange={(e) => setNewMedicationTest(e.target.value)}
                      placeholder="e.g. Amoxicillin, Aspirin, Spironolactone..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setNewMedicationTest('Amoxicillin')}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Test Amoxicillin
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMedicationTest('Aspirin')}
                      className="px-2 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Test Aspirin
                    </button>
                  </div>
                </div>

                {/* Alert Cards */}
                <div className="space-y-2 pt-1">
                  {drugAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-xl bg-rose-950/30 border border-rose-600/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          {alert.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-500/40">
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">{alert.description}</div>
                      <div className="text-[11px] text-amber-300 font-mono bg-slate-900/80 p-2 rounded border border-amber-500/30">
                        <span className="font-bold">Recommendation: </span>
                        {alert.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-Second Fast Intake Confirmation */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Digital Intake & Verification Summary (&lt;30s Verified)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">Demographics: </span>
                    <span className="text-slate-200 font-medium">Arthur Pendelton, 58M, O-</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Insurance: </span>
                    <span className="text-slate-200 font-medium">{patient.insurance.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Primary Contact: </span>
                    <span className="text-slate-200 font-medium">Sarah Pendelton (Spouse)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-900/30"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shadow-emerald-900/30"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit Clinical Intake & Triage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
