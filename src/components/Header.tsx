import React from 'react';
import { UserRole } from '../types/epis';
import { ShieldCheck, ShieldAlert, FileText, User, Ambulance, Stethoscope, Activity, Printer, SunMedium, Moon } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenHipaaAudit: () => void;
  onOpenConsent: () => void;
  onOpenPrintSummary: () => void;
  consentSigned: boolean;
  auditCount: number;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  onOpenHipaaAudit,
  onOpenConsent,
  onOpenPrintSummary,
  consentSigned,
  auditCount,
  highContrast,
  onToggleHighContrast,
}) => {
  const roles: { id: UserRole; label: string; icon: React.ReactNode }[] = [
    { id: 'patient', label: 'Patient Portal', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'paramedic', label: 'EMS Paramedic', icon: <Ambulance className="w-3.5 h-3.5" /> },
    { id: 'nurse', label: 'Triage Nurse', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'doctor', label: 'Attending Physician', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/30 font-bold text-base">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-mono">
                  EPIS
                </span>
                <span className="text-xs text-slate-400 font-sans hidden sm:inline">
                  Emergency Patient Information System
                </span>
              </div>
            </div>
          </div>

          {/* Mobile consent/audit trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenConsent}
              className={`p-1.5 rounded text-xs flex items-center gap-1 border ${
                consentSigned
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                  : 'border-rose-500/40 text-rose-400 bg-rose-950/30'
              }`}
              title="HIPAA Consent"
            >
              {consentSigned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Zone 2: Role Switcher Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto scrollbar-none">
          {roles.map((r) => {
            const isActive = currentRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onRoleChange(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Zone 3: Security, Audit & Clinical Tools */}
        <div className="hidden md:flex items-center gap-2">
          {/* HIPAA Consent Indicator */}
          <button
            onClick={onOpenConsent}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              consentSigned
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40 animate-pulse'
            }`}
          >
            {consentSigned ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{consentSigned ? 'HIPAA Consent Active' : 'Consent Action Required'}</span>
          </button>

          {/* HIPAA Audit Log */}
          <button
            onClick={onOpenHipaaAudit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
            title="HIPAA Audit Trail & Security Logs"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Audit Trail</span>
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
              {auditCount}
            </span>
          </button>

          {/* Printable Emergency Medical ID Sheet */}
          <button
            onClick={onOpenPrintSummary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
            title="Print Emergency Medical ID Card & Dispatch Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print ID</span>
          </button>

          {/* Contrast mode */}
          <button
            onClick={onToggleHighContrast}
            className={`p-1.5 rounded-lg border transition-colors ${
              highContrast
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle High-Contrast Field Ambulance Mode"
          >
            {highContrast ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
