import React from 'react';
import { PatientProfile, GPSLocation } from '../types/epis';
import {
  PhoneCall,
  Activity,
  AlertOctagon,
  ShieldAlert,
  MapPin,
  Pill,
  Heart,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface PatientDashboardProps {
  patient: PatientProfile;
  location: GPSLocation;
  onTriggerEmergency: () => void;
  onOpenCheckup: () => void;
  onOpenPrintSummary: () => void;
  onOpenConsent: () => void;
  highContrast: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  location,
  onTriggerEmergency,
  onOpenCheckup,
  onOpenPrintSummary,
  onOpenConsent,
  highContrast,
}) => {
  return (
    <div className="space-y-6">
      {/* Patient Medical ID Header Card */}
      <section aria-label="Patient Identity Banner" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={patient.avatarUrl}
                alt={patient.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-800"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">
                {patient.bloodType}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {patient.name}
                </h1>
                <span className="text-xs text-slate-400 font-mono">
                  {patient.age} y/o · {patient.gender}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-1">
                <span>MRN: <strong className="text-slate-200">{patient.mrn}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Code Status: <strong className="text-emerald-400">{patient.dnrStatus}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Primary: <strong className="text-slate-200">{patient.primaryCarePhysician.name}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Badges: Allergies & Blood */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2 text-left">
              <div className="text-[10px] uppercase font-mono text-rose-300 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Severe Allergies ({patient.allergies.length})
              </div>
              <div className="text-xs font-bold text-white mt-0.5">
                {patient.allergies.map((a) => a.allergen).join(', ')}
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-left">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-medium">
                Current Location
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-400" />
                <span>San Francisco, CA (GPS Active)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE DUAL-MODE PRIMARY COMMAND CENTER (OPTION A vs OPTION B)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* OPTION A: EMERGENCY (CRITICAL ACTION) */}
        <div
          className={`relative rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between ${
            highContrast
              ? 'bg-rose-950 border-rose-500 text-white'
              : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-950/40 border-rose-600/70 shadow-2xl shadow-rose-950/60'
          }`}
        >
          {/* Subtle emergency strobe aura */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            CRITICAL ACTION
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/60">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-mono text-rose-400 font-bold">
                OPTION A · IMMEDIATE SOS
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                EMERGENCY
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Single-tap trigger automated dial-up to Emergency 911 Services with real-time GPS broadcast and instant medical ID delivery.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 py-1 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>3-Second Visual Countdown Cancel Window to prevent accidents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Automated GPS pinpoint broadcast to dispatchers & family</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Immediate delivery of Blood Type, Allergies & Pacemaker ID</span>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="pt-6">
            <button
              onClick={onTriggerEmergency}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-black text-base tracking-wide uppercase font-mono shadow-xl shadow-rose-900/60 flex items-center justify-center gap-3 transition-transform"
            >
              <PhoneCall className="w-6 h-6 animate-pulse" />
              <span>TRIGGER EMERGENCY (911 SOS)</span>
            </button>
            <div className="text-center text-[11px] text-slate-400 mt-2 font-mono">
              Tap once · Includes 3s cancel countdown · Automated telephony
            </div>
          </div>
        </div>

        {/* OPTION B: GENERAL HEALTH CHECK-UP (CLINICAL INTAKE) */}
        <div
          className={`relative rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between ${
            highContrast
              ? 'bg-slate-900 border-sky-500 text-white'
              : 'bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border-slate-700/80 hover:border-sky-500/60 shadow-xl'
          }`}
        >
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-600/20 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            NON-EMERGENCY
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-900/50">
              <Activity className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-mono text-sky-400 font-bold">
                OPTION B · CLINICAL TRIAGE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                HEALTH CHECK-UP
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Structured clinical intake capturing symptoms, standardized ESI triage severity (Level 1–5), vital signs, and safety alerts.
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 py-1 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Standardized ESI (Emergency Severity Index) auto-scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Comprehensive Vital Signs evaluation (BP, HR, SpO2, Temp)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Automated Drug Interaction & severe allergy warning check</span>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="pt-6">
            <button
              onClick={onOpenCheckup}
              className="w-full py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-black text-base tracking-wide uppercase font-mono shadow-xl shadow-sky-900/40 flex items-center justify-center gap-3 transition-transform"
            >
              <Activity className="w-6 h-6" />
              <span>START HEALTH CHECK-UP</span>
            </button>
            <div className="text-center text-[11px] text-slate-400 mt-2 font-mono">
              Complete in under 2 minutes · Seamless queue sync
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PATIENT MEDICAL RECORDS & CLINICAL SUMMARY TILES
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tile 1: Active Prescriptions & Drug Interaction Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Active Medications ({patient.medications.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Verified</span>
          </div>

          <div className="space-y-2.5">
            {patient.medications.map((med) => (
              <div
                key={med.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{med.name}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">{med.dosage}</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{med.frequency}</div>
                <div className="text-[10px] text-sky-400 mt-0.5">{med.indication}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-amber-300 flex items-start gap-1.5 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Note:</strong> Warfarin therapy requires active monitoring of INR. Avoid NSAIDs without medical supervision.
            </span>
          </div>
        </div>

        {/* Tile 2: Emergency Contacts & Notification Network */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Emergency Contacts ({patient.emergencyContacts.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Auto-Broadcast Ready</span>
          </div>

          <div className="space-y-2.5">
            {patient.emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span>{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-mono uppercase">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{contact.relationship}</div>
                  <div className="text-sky-400 font-mono text-[11px] mt-0.5">{contact.phone}</div>
                </div>

                <a
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title={`Call ${contact.name}`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-1">
            Emergency broadcast transmits live GPS location via secure SMS link upon SOS trigger.
          </div>
        </div>

        {/* Tile 3: Chronic Conditions & Medical Implants */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Conditions & Implants
              </h3>
            </div>
            <button
              onClick={onOpenPrintSummary}
              className="text-[11px] text-sky-400 hover:underline font-mono"
            >
              Print ID
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                Chronic Medical Conditions:
              </div>
              <div className="space-y-1">
                {patient.chronicConditions.map((cond, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">
                    • {cond}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                Implanted Devices:
              </div>
              <div className="space-y-1">
                {patient.implants.map((imp, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 font-mono text-[11px]">
                    ⚠ {imp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
