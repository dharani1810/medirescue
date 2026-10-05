import React, { useState } from 'react';
import { PatientProfile, TriageRecord, DrugInteractionAlert } from '../types/epis';
import {
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  Pill,
  FileText,
  CheckCircle,
  Plus,
  Lock,
  Unlock,
  Printer,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

interface PhysicianClinicalViewProps {
  patient: PatientProfile;
  triageRecord?: TriageRecord;
  drugAlerts: DrugInteractionAlert[];
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
  onOpenPrintSummary: () => void;
}

export const PhysicianClinicalView: React.FC<PhysicianClinicalViewProps> = ({
  patient,
  triageRecord,
  drugAlerts,
  onLogAudit,
  onOpenPrintSummary,
}) => {
  const [breakGlassActive, setBreakGlassActive] = useState<boolean>(false);
  const [orders, setOrders] = useState<{ id: string; name: string; category: string; status: string }[]>([
    { id: 'ord-1', name: '12-Lead Electrocardiogram (ECG)', category: 'Diagnostics', status: 'Completed (Sinus Tach, 1mm ST Dep V4-V6)' },
    { id: 'ord-2', name: 'STAT High-Sensitivity Troponin I & CK-MB', category: 'Laboratory', status: 'In Lab Analysis' },
    { id: 'ord-3', name: 'STAT Portable Chest Radiograph (CXR)', category: 'Imaging', status: 'Pending Tech' },
    { id: 'ord-4', name: 'Continuous Pulse Oximetry & Cardiac Telemetry', category: 'Nursing', status: 'Active' },
  ]);

  const [newOrderName, setNewOrderName] = useState<string>('');
  const [newOrderCategory, setNewOrderCategory] = useState<string>('Laboratory');

  const [clinicalNotes, setClinicalNotes] = useState<string>(
    '58-year-old male with known CAD (stent 2022) presenting with acute exertional chest pressure and diaphoresis. Vitals remarkable for tachycardia (HR 104) and elevated BP (168/98). ESI Level 2 triage verified. Warfarin therapy noted; caution advised against high-dose antiplatelet loading prior to STAT INR result. Penicillin anaphylaxis confirmed.'
  );

  const handleBreakGlass = () => {
    const nextState = !breakGlassActive;
    setBreakGlassActive(nextState);
    onLogAudit(
      nextState ? 'BREAK_GLASS_OVERRIDE_ENABLED' : 'BREAK_GLASS_OVERRIDE_REVOKED',
      nextState
        ? 'Emergency physician activated HIPAA Break-Glass protocol to access unredacted psychiatric, genetic, and restricted trauma records.'
        : 'Emergency physician concluded Break-Glass session.',
      true
    );
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderName.trim()) return;

    const newOrder = {
      id: `ord-${Date.now()}`,
      name: newOrderName.trim(),
      category: newOrderCategory,
      status: 'Ordered by Dr. Thorne',
    };

    setOrders([newOrder, ...orders]);
    onLogAudit('PHYSICIAN_ORDER_PLACED', `Doctor ordered: ${newOrder.name} (${newOrder.category})`, false);
    setNewOrderName('');
  };

  return (
    <div className="space-y-6">
      {/* Physician Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-bold">
                ATTENDING PHYSICIAN
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Dr. Aris Thorne, MD · Emergency Medicine / Cardiology
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Clinical Assessment, Computerized Orders & Safety Matrix
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Break-Glass Emergency Access */}
          <button
            onClick={handleBreakGlass}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
              breakGlassActive
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/60 animate-pulse'
                : 'bg-slate-800 text-rose-300 border-rose-500/40 hover:bg-rose-950/40'
            }`}
            title="HIPAA Emergency Break-Glass Override"
          >
            {breakGlassActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 text-rose-400" />}
            <span>{breakGlassActive ? 'Break-Glass ACTIVE' : 'Emergency Break-Glass'}</span>
          </button>

          <button
            onClick={onOpenPrintSummary}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Chart</span>
          </button>
        </div>
      </div>

      {/* Break-glass notification banner */}
      {breakGlassActive && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500 text-xs text-rose-200 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>HIPAA BREAK-GLASS OVERRIDE ACTIVE:</strong> Unrestricted access granted for emergency life-saving treatment. All keystrokes and chart views are audited in the permanent HIPAA ledger.
            </span>
          </div>
          <button
            onClick={handleBreakGlass}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
          >
            Revoke Override
          </button>
        </div>
      )}

      {/* Main Grid: Clinical EHR & Drug Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Profile, Allergies & Drug Matrix */}
        <div className="space-y-6 lg:col-span-1">
          {/* Patient Vitals & ESI Score snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Current Triage Status
              </span>
              <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-mono text-xs font-bold">
                ESI LEVEL {triageRecord?.esiLevel || 2}
              </span>
            </div>

            <div className="text-xs text-slate-300">
              <span className="text-slate-500">Chief Complaint: </span>
              <span className="font-semibold text-white">{triageRecord?.chiefComplaint || 'Chest Pressure radiating to left jaw'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">BP:</span>
                <div className="text-white font-bold">{triageRecord?.vitals.bpSystolic || 168}/{triageRecord?.vitals.bpDiastolic || 98}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">HR:</span>
                <div className="text-rose-400 font-bold">{triageRecord?.vitals.heartRate || 104} bpm</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">SpO2:</span>
                <div className="text-cyan-400 font-bold">{triageRecord?.vitals.spo2 || 93}%</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Pain:</span>
                <div className="text-amber-400 font-bold">{triageRecord?.painScore || 8} / 10</div>
              </div>
            </div>
          </div>

          {/* Automated Drug Safety & Interaction Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Drug Safety Matrix
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold">
                {drugAlerts.length} Critical
              </span>
            </div>

            <div className="space-y-2.5">
              {drugAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-rose-950/30 border border-rose-600/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>{alert.title}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-rose-900/60 text-white">
                      {alert.severity}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {alert.description}
                  </div>
                  <div className="text-amber-300 font-mono text-[10px] bg-slate-950 p-1.5 rounded border border-amber-500/20">
                    <strong>Rec:</strong> {alert.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Computerized Provider Orders & Clinical Notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Computerized Provider Order Entry (CPOE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Computerized Provider Order Entry (CPOE)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {orders.length} Active Orders
              </span>
            </div>

            {/* Quick Order Entry Form */}
            <form onSubmit={handleAddOrder} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter STAT order (e.g. IV Metoprolol 5mg, Serum Potassium, CT Angio)..."
                value={newOrderName}
                onChange={(e) => setNewOrderName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-sky-500"
              />
              <select
                value={newOrderCategory}
                onChange={(e) => setNewOrderCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono outline-none"
              >
                <option value="Laboratory">Laboratory</option>
                <option value="Diagnostics">Diagnostics</option>
                <option value="Imaging">Imaging</option>
                <option value="Medication">Medication</option>
                <option value="Nursing">Nursing</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-sky-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>Place Order</span>
              </button>
            </form>

            {/* Active Orders List */}
            <div className="space-y-2">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{ord.name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {ord.category}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                      Status: <span className="text-emerald-400">{ord.status}</span>
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Attending Physician Clinical Impression Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Clinical Impression & Attending Documentation
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Auto-Saved to EHR</span>
            </div>

            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono outline-none focus:border-indigo-500"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-400 font-mono">
                Electronic Signature: Dr. Aris Thorne, MD (ID #MD-88492)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLogAudit('PHYSICIAN_NOTE_SAVED', 'Physician updated clinical progress note.', false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Save Note
                </button>
                <button
                  onClick={() => onLogAudit('PATIENT_DISPOSITION_DECIDED', 'Physician placed disposition order: Admit to Cardiac Care Unit (CCU).', false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Admit to CCU
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
