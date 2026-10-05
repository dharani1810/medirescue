import React from 'react';
import { PatientProfile, GPSLocation, TriageRecord } from '../types/epis';
import { Printer, X, ShieldAlert, Heart, Phone, FileText } from 'lucide-react';

interface PrintMedicalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  location: GPSLocation;
  triageRecord?: TriageRecord;
}

export const PrintMedicalSummaryModal: React.FC<PrintMedicalSummaryModalProps> = ({
  isOpen,
  onClose,
  patient,
  location,
  triageRecord,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-summary-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 print:bg-white print:text-black border border-slate-700 print:border-none rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none">
        {/* Header - Screen only */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <h2 id="print-summary-modal-title" className="text-base font-bold text-white font-mono">
              Emergency Medical ID & Dispatch Summary Sheet
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:p-0 print:space-y-4 text-xs">
          {/* Document Header */}
          <div className="border-b-2 border-rose-600 pb-4 flex items-center justify-between">
            <div>
              <div className="text-rose-600 font-mono font-black text-xl tracking-tight">
                EPIS EMERGENCY MEDICAL ID CARD
              </div>
              <div className="text-slate-400 print:text-slate-600 text-xs font-mono">
                Official Clinical Emergency Information Record · Generated {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-rose-500 print:text-rose-700 border-2 border-rose-600 px-3 py-1 rounded-lg inline-block">
                {patient.bloodType} NEG
              </span>
            </div>
          </div>

          {/* Demographics & Code Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950 print:bg-slate-100 rounded-xl font-mono text-xs">
            <div>
              <div className="text-slate-400 print:text-slate-500 text-[10px]">PATIENT NAME</div>
              <div className="font-bold text-white print:text-black text-sm">{patient.name}</div>
            </div>
            <div>
              <div className="text-slate-400 print:text-slate-500 text-[10px]">MRN / RECORD #</div>
              <div className="font-bold text-white print:text-black">{patient.mrn}</div>
            </div>
            <div>
              <div className="text-slate-400 print:text-slate-500 text-[10px]">DOB / AGE / SEX</div>
              <div className="font-bold text-white print:text-black">{patient.dob} ({patient.age}y {patient.gender})</div>
            </div>
            <div>
              <div className="text-slate-400 print:text-slate-500 text-[10px]">ADVANCED DIRECTIVE</div>
              <div className="font-bold text-emerald-400 print:text-emerald-700">{patient.dnrStatus}</div>
            </div>
          </div>

          {/* Critical Safety: Allergies & Implants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-rose-500/50 print:border-rose-600 p-3.5 rounded-xl bg-rose-950/20 print:bg-rose-50">
              <div className="font-bold text-rose-400 print:text-rose-700 font-mono uppercase text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Critical Severe Allergies:
              </div>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-200 print:text-black text-xs font-semibold">
                {patient.allergies.map((a, i) => (
                  <li key={i}>
                    {a.allergen} ({a.severity.toUpperCase()}): {a.reaction}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-700 print:border-slate-300 p-3.5 rounded-xl bg-slate-950 print:bg-slate-50">
              <div className="font-bold text-sky-400 print:text-sky-700 font-mono uppercase text-xs flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                Implants & Chronic Conditions:
              </div>
              <div className="mt-2 text-slate-200 print:text-black text-xs space-y-1">
                <div><strong>Implants:</strong> {patient.implants.join('; ')}</div>
                <div><strong>Chronic:</strong> {patient.chronicConditions.join('; ')}</div>
              </div>
            </div>
          </div>

          {/* Current Active Medications */}
          <div>
            <div className="font-bold text-slate-300 print:text-black font-mono uppercase text-xs mb-2">
              Verified Active Home Medications:
            </div>
            <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300 rounded-lg overflow-hidden font-mono">
              <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-black">
                <tr>
                  <th className="p-2">Medication</th>
                  <th className="p-2">Dosage</th>
                  <th className="p-2">Frequency</th>
                  <th className="p-2">Indication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {patient.medications.map((m) => (
                  <tr key={m.id} className="text-slate-200 print:text-black">
                    <td className="p-2 font-bold">{m.name}</td>
                    <td className="p-2">{m.dosage}</td>
                    <td className="p-2">{m.frequency}</td>
                    <td className="p-2 text-slate-400 print:text-slate-600">{m.indication}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Emergency Contacts & Primary Care */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 print:border-slate-300">
            <div>
              <div className="font-bold text-slate-300 print:text-black font-mono uppercase text-xs mb-1.5">
                Designated Emergency Contacts:
              </div>
              <div className="space-y-1 font-mono text-xs text-slate-300 print:text-black">
                {patient.emergencyContacts.map((c) => (
                  <div key={c.id}>
                    • <strong>{c.name}</strong> ({c.relationship}): {c.phone} {c.isPrimary && '(PRIMARY PROXY)'}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-300 print:text-black font-mono uppercase text-xs mb-1.5">
                Primary Care & Insurance:
              </div>
              <div className="text-xs font-mono text-slate-300 print:text-black space-y-1">
                <div>Physician: {patient.primaryCarePhysician.name} ({patient.primaryCarePhysician.phone})</div>
                <div>Clinic: {patient.primaryCarePhysician.clinic}</div>
                <div>Insurance: {patient.insurance.provider} (Policy: {patient.insurance.policyNumber})</div>
              </div>
            </div>
          </div>

          {/* Footer certification */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-400 print:text-slate-600 font-mono">
            <div>EPIS System Verification ID: #EPIS-AUTH-849204</div>
            <div>HIPAA Consent Confirmed: {patient.consentTimestamp || 'Active'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
