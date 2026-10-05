import React, { useState } from 'react';
import { TriageRecord, EsiLevel } from '../types/epis';
import {
  Activity,
  AlertTriangle,
  Clock,
  Bed,
  CheckCircle,
  Search,
  Filter,
  User,
  HeartPulse,
  ShieldAlert,
  ArrowUpDown,
  Plus,
} from 'lucide-react';

interface TriageNurseViewProps {
  queue: TriageRecord[];
  onUpdateStatus: (id: string, newStatus: TriageRecord['status'], bed?: string) => void;
  onOpenCheckup: () => void;
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
}

export const TriageNurseView: React.FC<TriageNurseViewProps> = ({
  queue,
  onUpdateStatus,
  onOpenCheckup,
  onLogAudit,
}) => {
  const [filterEsi, setFilterEsi] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<TriageRecord | null>(queue[0] || null);
  const [assignBedModalOpen, setAssignBedModalOpen] = useState<boolean>(false);
  const [bedInput, setBedInput] = useState<string>('Resus Bay 1');

  // Sort queue strictly by ESI level (1 is highest priority), then by timestamp
  const sortedQueue = [...queue]
    .filter((rec) => (filterEsi === 'all' ? true : rec.esiLevel === filterEsi))
    .filter((rec) =>
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.esiLevel - b.esiLevel);

  const getEsiBadge = (lvl: EsiLevel) => {
    switch (lvl) {
      case 1:
        return 'bg-rose-600 text-white border-rose-500 font-bold';
      case 2:
        return 'bg-orange-600 text-white border-orange-500 font-bold';
      case 3:
        return 'bg-amber-600 text-white border-amber-500 font-bold';
      case 4:
        return 'bg-emerald-600 text-white border-emerald-500 font-semibold';
      case 5:
        return 'bg-sky-600 text-white border-sky-500 font-semibold';
    }
  };

  const handleBedAssignment = () => {
    if (!selectedRecord) return;
    onUpdateStatus(selectedRecord.id, 'bed_assigned', bedInput);
    onLogAudit(
      'BED_ASSIGNED_BY_NURSE',
      `Patient ${selectedRecord.patientName} (ESI ${selectedRecord.esiLevel}) allocated to ${bedInput}.`,
      false
    );
    setAssignBedModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Triage Nurse Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-mono text-[11px] font-bold">
                ED TRIAGE DESK
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ESI v4 Clinical Queue
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Synchronized Waiting Room & Triage Tracking Board
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCheckup}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Patient Triage Intake</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <span className="text-xs text-slate-400 font-mono mr-2">Filter ESI:</span>
          {(['all', 1, 2, 3, 4, 5] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterEsi(filter)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-colors ${
                filterEsi === filter
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {filter === 'all' ? 'All (Total ' + queue.length + ')' : `ESI ${filter}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, complaint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Main Grid: Queue Table on Left, Selected Patient Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Queue Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3 flex items-center justify-between">
            <span>Clinical Queue (Ordered by ESI Urgency)</span>
            <span className="text-emerald-400">{sortedQueue.length} Active Patients</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[560px]">
            {sortedQueue.map((record) => {
              const isSelected = selectedRecord?.id === record.id;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${getEsiBadge(record.esiLevel)}`}>
                        ESI {record.esiLevel}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{record.patientName}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            {record.patientAge}y · {record.patientGender}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                          {record.chiefComplaint}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">Triage Vitals:</div>
                        <div className="text-slate-200">
                          BP {record.vitals.bpSystolic}/{record.vitals.bpDiastolic} · HR {record.vitals.heartRate} · SpO2 {record.vitals.spo2}%
                        </div>
                      </div>

                      {record.bedAssignment ? (
                        <span className="px-2 py-1 rounded bg-sky-950 text-sky-300 border border-sky-500/30 text-[11px]">
                          {record.bedAssignment}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[11px]">
                          Waiting Bed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Patient Clinical Summary Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          {selectedRecord ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedRecord.patientName}</h3>
                  <div className="text-xs text-slate-400 font-mono">
                    Triage Time: {selectedRecord.timestamp}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${getEsiBadge(selectedRecord.esiLevel)}`}>
                  ESI LEVEL {selectedRecord.esiLevel}
                </div>
              </div>

              {/* Chief Complaint & Pain */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono uppercase text-[11px]">Chief Complaint & Duration</div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                  {selectedRecord.chiefComplaint}
                  <div className="text-slate-400 text-[11px] mt-1 font-mono">
                    Duration: {selectedRecord.symptomDuration} · Pain: {selectedRecord.painScore}/10 ({selectedRecord.painCharacter})
                  </div>
                </div>
              </div>

              {/* Vitals Feed */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono uppercase text-[11px] flex items-center justify-between">
                  <span>Current Vitals</span>
                  {selectedRecord.dangerZoneVitals && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Danger Zone
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Blood Pressure:</span>
                    <div className="text-white font-bold">{selectedRecord.vitals.bpSystolic}/{selectedRecord.vitals.bpDiastolic} mmHg</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Heart Rate:</span>
                    <div className="text-white font-bold">{selectedRecord.vitals.heartRate} bpm</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Temperature:</span>
                    <div className="text-white font-bold">{selectedRecord.vitals.tempF}°F</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">O2 Saturation:</span>
                    <div className="text-white font-bold">{selectedRecord.vitals.spo2}%</div>
                  </div>
                </div>
              </div>

              {/* ESI Decision Rationale */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono uppercase text-[11px]">ESI Protocol Decision Rationale</div>
                <div className="space-y-1">
                  {selectedRecord.esiRationale.map((r, i) => (
                    <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-[11px]">
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bed Assignment Action */}
              <div className="pt-2 border-t border-slate-800">
                {selectedRecord.bedAssignment ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold font-mono">Bed Assigned:</span>
                      <div className="text-white font-bold text-sm mt-0.5">{selectedRecord.bedAssignment}</div>
                    </div>
                    <button
                      onClick={() => setAssignBedModalOpen(true)}
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Reassign
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssignBedModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-colors"
                  >
                    <Bed className="w-4 h-4" />
                    <span>Allocate ED Treatment Bed</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a patient from the queue to view clinical details.
            </div>
          )}
        </div>
      </div>

      {/* Bed Assignment Modal */}
      {assignBedModalOpen && selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bed-allocation-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 id="bed-allocation-modal-title" className="text-base font-bold text-white font-mono">
              Allocate Treatment Bed: {selectedRecord.patientName}
            </h3>
            <p className="text-xs text-slate-400">
              Select available clinical department bed or resuscitation bay for ESI Level {selectedRecord.esiLevel}.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Resus Bay 1', 'Resus Bay 2', 'Acute Bay 3', 'Acute Bay 4', 'Fast-Track 1', 'Step-Down 2'].map((bed) => (
                <button
                  key={bed}
                  type="button"
                  onClick={() => setBedInput(bed)}
                  className={`p-2.5 rounded-xl border text-left font-mono font-medium transition-colors ${
                    bedInput === bed
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {bed}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setAssignBedModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleBedAssignment}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
