import React, { useState } from 'react';
import { AuditLogEntry, UserRole } from '../types/epis';
import { FileText, ShieldAlert, ShieldCheck, X, Download, Filter, Search, Lock } from 'lucide-react';

interface HipaaAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
}

export const HipaaAuditModal: React.FC<HipaaAuditModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterOverrideOnly, setFilterOverrideOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredLogs = logs
    .filter((log) => (filterRole === 'all' ? true : log.actorRole === filterRole))
    .filter((log) => (filterOverrideOnly ? log.emergencyOverride : true))
    .filter(
      (log) =>
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Patient MRN', 'Emergency Override', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.patientMrn}"`,
      `"${l.emergencyOverride ? 'YES' : 'NO'}"`,
      `"${l.reason.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HIPAA_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hipaa-audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="hipaa-audit-modal-title" className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>HIPAA Security & Disclosure Audit Log</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  45 CFR § 164.312(b) Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Immutable, cryptographic tamper-evident record of all electronic Protected Health Information (ePHI) access.
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

        {/* Filters */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
            <span className="text-slate-400 font-mono">Role:</span>
            {(['all', 'patient', 'paramedic', 'nurse', 'doctor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  filterRole === r
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}

            <label className="flex items-center gap-1.5 ml-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={filterOverrideOnly}
                onChange={(e) => setFilterOverrideOnly(e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span className="text-[11px] font-mono text-rose-300">Break-Glass Only</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3 h-3 text-sky-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No audit records matching specified filters.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border text-xs ${
                  entry.emergencyOverride
                    ? 'bg-rose-950/20 border-rose-600/50'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-bold">{entry.timestamp}</span>
                    <span>·</span>
                    <span className="text-white font-semibold">{entry.actorName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">
                      {entry.actorRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.emergencyOverride && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        BREAK-GLASS OVERRIDE
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px]">MRN: {entry.patientMrn}</span>
                  </div>
                </div>

                <div className="text-white font-semibold mt-1">
                  Action: <span className="text-emerald-400">{entry.action}</span>
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  {entry.reason}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono text-[11px]">
            Total Logged Events: {logs.length} (Viewing {filteredLogs.length})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
