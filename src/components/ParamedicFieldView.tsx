import React, { useState } from 'react';
import { PatientProfile, GPSLocation, VitalSigns, EsiLevel } from '../types/epis';
import {
  Ambulance,
  MapPin,
  ShieldAlert,
  Radio,
  HeartPulse,
  Send,
  Check,
  AlertTriangle,
  Clock,
  Compass,
  FileText,
  Phone,
} from 'lucide-react';

interface ParamedicFieldViewProps {
  patient: PatientProfile;
  location: GPSLocation;
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
}

export const ParamedicFieldView: React.FC<ParamedicFieldViewProps> = ({
  patient,
  location,
  onLogAudit,
}) => {
  const [fieldVitals, setFieldVitals] = useState<VitalSigns>({
    bpSystolic: 154,
    bpDiastolic: 92,
    heartRate: 102,
    tempF: 98.6,
    spo2: 94,
    respiratoryRate: 20,
    timestamp: 'Field Reading',
  });

  const [fieldEsiTag, setFieldEsiTag] = useState<EsiLevel>(2);
  const [radioPatchStatus, setRadioPatchStatus] = useState<'idle' | 'transmitting' | 'sent'>('idle');
  const [fieldNotes, setFieldNotes] = useState<string>(
    'Patient conscious and alert, complains of pressure-like chest tightness. 12-lead ECG acquired showing sinus tachycardia with 1mm ST elevation in lead III. IV established 18G left antecubital. Oxygen 2L nasal cannula applied.'
  );

  const handleTransmitRadioPatch = () => {
    setRadioPatchStatus('transmitting');
    setTimeout(() => {
      setRadioPatchStatus('sent');
      onLogAudit(
        'PARAMEDIC_RADIO_PATCH_TRANSMITTED',
        `Pre-hospital report transmitted to Trauma Center. Field ESI: ${fieldEsiTag}. Vitals: BP ${fieldVitals.bpSystolic}/${fieldVitals.bpDiastolic}, HR ${fieldVitals.heartRate}, SpO2 ${fieldVitals.spo2}%.`,
        true
      );
      setTimeout(() => setRadioPatchStatus('idle'), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Field Dispatch Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Ambulance className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[11px] font-bold">
                EMS UNIT MEDIC-4
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                CAD LINK CONNECTED
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Field Responder & Pre-Hospital Intake
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px]">ETA to St. Jude Trauma:</div>
            <div className="text-amber-400 font-bold text-sm">6 Minutes</div>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[10px]">CAD Dispatch Incident:</div>
            <div className="text-slate-200 font-bold text-sm">#CAD-911-849204</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: GPS Navigation & Patient Alert Quick-Scan */}
        <div className="space-y-6 lg:col-span-1">
          {/* GPS Coordinates & Routing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Scene GPS & Navigation
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">Locked</span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Patient Location:</span>
                <div className="text-white font-semibold">{location.streetAddress}</div>
                <div className="text-slate-400 text-[11px]">{location.crossStreet}</div>
              </div>

              <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1">
                <div className="text-emerald-400">
                  Lat: {location.latitude}° | Lng: {location.longitude}°
                </div>
                <div className="text-slate-400">
                  Accuracy: ±{location.accuracy}m · Ref: {location.gridReference}
                </div>
              </div>
            </div>

            <a
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Open in Navigation GPS</span>
            </a>
          </div>

          {/* Quick-Scan Medical Alert */}
          <div className="bg-slate-900 border border-rose-950/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                Field Medical Alert (NFC/QR)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40">
                <div className="text-[10px] uppercase font-mono text-rose-300 font-bold">
                  Blood Type (Universal Donor)
                </div>
                <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
                  {patient.bloodType} Negative
                </div>
                <div className="text-slate-300 text-[11px] mt-1">
                  Alert Blood Bank for 2 units O-neg PRBCs on standby
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Severe Allergies</div>
                <div className="font-bold text-rose-300 mt-1">
                  {patient.allergies.map((a) => a.allergen).join(', ')}
                </div>
                <div className="text-[11px] text-rose-400 font-mono mt-0.5">
                  NO PENICILLIN / CEPHALOSPORINS
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-mono text-slate-400">Implanted Device Alert</div>
                <div className="font-medium text-slate-200 mt-0.5">
                  Cardiac Pacemaker (Azure XT) · Left Knee Implant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Field Vitals, Pre-Hospital ESI Tag & Radio Patch */}
        <div className="space-y-6 lg:col-span-2">
          {/* Field Vitals Monitor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  EMS Field Vitals Log
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Live Monitor Active</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">BP (mmHg)</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {fieldVitals.bpSystolic}/{fieldVitals.bpDiastolic}
                </div>
                <div className="text-[10px] text-amber-400">Elevated</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Heart Rate</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  {fieldVitals.heartRate} <span className="text-xs text-slate-400">bpm</span>
                </div>
                <div className="text-[10px] text-rose-400">Sinus Tachycardia</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">SpO2 Sat</div>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {fieldVitals.spo2}%
                </div>
                <div className="text-[10px] text-slate-400">2L NC Applied</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Resp Rate</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {fieldVitals.respiratoryRate} <span className="text-xs text-slate-400">/min</span>
                </div>
                <div className="text-[10px] text-slate-400">Mild Tachypnea</div>
              </div>
            </div>

            {/* Field ESI Tagging */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Pre-Hospital Triage Tag (ESI Level)
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFieldEsiTag(lvl as EsiLevel)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      fieldEsiTag === lvl
                        ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-900/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="font-mono text-sm">ESI {lvl}</div>
                    <div className="text-[10px]">{lvl === 1 ? 'Resus' : lvl === 2 ? 'Emergent' : lvl === 3 ? 'Urgent' : 'Routine'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Radio Patch to Hospital */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Direct Radio Patch to Receiving Trauma ED
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">St. Jude Trauma Bay</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                Pre-Arrival Narrative & Interventions:
              </label>
              <textarea
                rows={4}
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-400 font-mono">
                Receiving Physician: Dr. Aris Thorne (On Duty)
              </div>
              <button
                onClick={handleTransmitRadioPatch}
                disabled={radioPatchStatus === 'transmitting'}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-sky-900/40"
              >
                {radioPatchStatus === 'transmitting' ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Broadcasting Patch...</span>
                  </>
                ) : radioPatchStatus === 'sent' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Transmitted to ED!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast Radio Patch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
