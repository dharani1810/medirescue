import React, { useState } from 'react';
import { PatientProfile } from '../types/epis';
import { ShieldCheck, ShieldAlert, FileText, Check, X, Lock } from 'lucide-react';

interface ConsentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onUpdateConsent: (signed: boolean) => void;
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
}

export const ConsentManagementModal: React.FC<ConsentManagementModalProps> = ({
  isOpen,
  onClose,
  patient,
  onUpdateConsent,
  onLogAudit,
}) => {
  const [consentTreat, setConsentTreat] = useState<boolean>(true);
  const [consentEmsRelease, setConsentEmsRelease] = useState<boolean>(true);
  const [consentTelemetry, setConsentTelemetry] = useState<boolean>(true);
  const [signerName, setSignerName] = useState<string>(patient.name);

  if (!isOpen) return null;

  const handleSaveConsent = () => {
    const isAllAccepted = consentTreat && consentEmsRelease && consentTelemetry;
    onUpdateConsent(isAllAccepted);
    onLogAudit(
      isAllAccepted ? 'PATIENT_CONSENT_ACKNOWLEDGED' : 'PATIENT_CONSENT_RESTRICTED',
      `HIPAA consent form updated by ${signerName}. Treatment: ${consentTreat}, EMS Broadcast: ${consentEmsRelease}, Telemetry: ${consentTelemetry}.`,
      false
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-management-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="consent-management-modal-title" className="text-base font-bold text-white font-mono">
                Patient Consent & HIPAA Disclosure Authorization
              </h2>
              <p className="text-xs text-slate-400">
                Patient: {patient.name} · MRN: {patient.mrn}
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

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-white text-sm">Notice of Privacy Practices & Legal Alignment</div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Under 45 CFR Parts 160 and 164 (HIPAA Privacy and Security Rules), the Emergency Patient Information System (EPIS) strictly protects your electronic Protected Health Information (ePHI). In emergency situations, immediate life-saving care and GPS location transmission are authorized under emergency medical disclosure provisions.
            </p>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-850">
              <input
                type="checkbox"
                checked={consentTreat}
                onChange={(e) => setConsentTreat(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500 w-4 h-4 shrink-0"
              />
              <div>
                <div className="font-bold text-white text-xs">1. General Emergency Medical Treatment Consent</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  I authorize licensed emergency physicians, paramedics, and triage nurses to administer necessary medical diagnostics, triage scoring, and resuscitative care.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-850">
              <input
                type="checkbox"
                checked={consentEmsRelease}
                onChange={(e) => setConsentEmsRelease(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500 w-4 h-4 shrink-0"
              />
              <div>
                <div className="font-bold text-white text-xs">2. Automated 911 / EMS Broadcast & GPS Disclosure</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  I consent to automated transmission of my GPS coordinates, blood type, and severe allergy records to 911 dispatchers and primary emergency contacts upon pressing the EMERGENCY SOS button.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-850">
              <input
                type="checkbox"
                checked={consentTelemetry}
                onChange={(e) => setConsentTelemetry(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-500 w-4 h-4 shrink-0"
              />
              <div>
                <div className="font-bold text-white text-xs">3. Real-Time Telemetry & ESI Algorithm Processing</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  I consent to digital processing of my vital signs, chief complaints, and past medical history by the ESI triage algorithm and drug safety warning engine.
                </div>
              </div>
            </label>
          </div>

          {/* Digital Signature */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Electronic Signature (Patient or Legal Guardian)
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none"
            />
            <div className="text-[10px] text-slate-500 font-mono">
              Signed Timestamp: {patient.consentTimestamp || new Date().toISOString()} · IP: 198.51.100.44
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onUpdateConsent(false)}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            Revoke All Consent
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConsent}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save & Verify Consent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
