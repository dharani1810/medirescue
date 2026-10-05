import React, { useState, useEffect, useRef } from 'react';
import { PatientProfile, GPSLocation } from '../types/epis';
import { executeEmergencyDialUp, soundPlayer, broadcastEmergencyAlert, BroadcastResult } from '../utils/emergencyService';
import {
  PhoneCall,
  PhoneOff,
  AlertOctagon,
  MapPin,
  Copy,
  Check,
  ShieldAlert,
  Volume2,
  Mic,
  MicOff,
  HeartPulse,
  Radio,
  Siren,
  X,
  Share2,
} from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  location: GPSLocation;
  onRefreshLocation: () => void;
  onLogAudit: (action: string, reason: string, override?: boolean) => void;
}

type CallPhase = 'countdown' | 'dialing' | 'connected' | 'ended';

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  patient,
  location,
  onRefreshLocation,
  onLogAudit,
}) => {
  const [phase, setPhase] = useState<CallPhase>('countdown');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(true);
  const [copiedLocation, setCopiedLocation] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
  const [strobeActive, setStrobeActive] = useState<boolean>(false);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize countdown on open
  useEffect(() => {
    if (isOpen) {
      setPhase('countdown');
      setSecondsRemaining(3);
      setCallDuration(0);
      setCopiedLocation(false);
      setStrobeActive(false);

      soundPlayer.playCountdownBeep(880, 0.15);

      countdownTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            triggerEmergencyDispatch();
            return 0;
          }
          soundPlayer.playCountdownBeep(prev === 2 ? 987 : 1174, 0.15);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    };
  }, [isOpen]);

  // Handle call duration counter
  useEffect(() => {
    if (phase === 'connected') {
      callDurationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    }
    return () => {
      if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    };
  }, [phase]);

  const triggerEmergencyDispatch = () => {
    setPhase('connected');
    soundPlayer.playDispatchConnected();

    // 1. Trigger telephony dial-up
    executeEmergencyDialUp('911');

    // 2. Broadcast emergency alert to contacts & CAD system
    const result = broadcastEmergencyAlert(patient, location);
    setBroadcastResult(result);

    // 3. Log audit event
    onLogAudit(
      'EMERGENCY_SOS_TRIGGERED',
      `Emergency 911 call initiated with GPS location: ${location.streetAddress} (Incident ${result.incidentId})`,
      true
    );
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    onLogAudit('EMERGENCY_SOS_CANCELLED', 'Patient aborted emergency countdown within 3-second safety window', false);
    onClose();
  };

  const handleImmediateCall = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setSecondsRemaining(0);
    triggerEmergencyDispatch();
  };

  const handleEndCall = () => {
    setPhase('ended');
    setStrobeActive(false);
    onLogAudit('EMERGENCY_CALL_TERMINATED', `Call ended after ${formatDuration(callDuration)}. CAD status: Unit En Route`, true);
  };

  const handleCopyGPS = () => {
    const textToCopy = `EPIS EMERGENCY GPS: Lat ${location.latitude}, Lng ${location.longitude} (${location.streetAddress}, Cross: ${location.crossStreet}). Patient: ${patient.name}, Blood Type: ${patient.bloodType}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2500);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-sos-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
        strobeActive ? 'animate-pulse bg-rose-950/90' : 'bg-black/85 backdrop-blur-md'
      }`}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl shadow-rose-950/80 overflow-hidden text-slate-100 my-auto">
        {/* Urgent Header Banner */}
        <div className="bg-rose-600 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 animate-bounce" />
            <h2 id="emergency-sos-modal-title" className="text-base font-bold uppercase tracking-wider font-mono">
              EPIS Emergency Critical SOS Response
            </h2>
          </div>
          <button
            onClick={phase === 'countdown' ? handleCancelCountdown : onClose}
            className="p-1 rounded-md hover:bg-rose-700 text-white/90 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Phase 1: 3-Second Countdown Window */}
          {phase === 'countdown' && (
            <div className="text-center py-4 space-y-5">
              <div className="inline-block relative">
                {/* Circular timer indicator */}
                <div className="w-32 h-32 rounded-full border-4 border-rose-500/30 flex items-center justify-center mx-auto relative">
                  <div
                    className="absolute inset-0 rounded-full border-4 border-rose-500 animate-spin"
                    style={{ animationDuration: '3s' }}
                  />
                  <span className="text-5xl font-black font-mono text-rose-500">
                    {secondsRemaining}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  Connecting to Emergency 911 Dispatch
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Automatically transmitting your GPS location and medical alert history to emergency dispatchers.
                </p>
              </div>

              {/* Action Buttons: Cancel vs Immediate */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCancelCountdown}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
                >
                  Cancel SOS (Accidental Press)
                </button>
                <button
                  onClick={handleImmediateCall}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/50 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call 911 Immediately
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Active Dispatch Call & Telemetry */}
          {(phase === 'connected' || phase === 'ended') && (
            <div className="space-y-5">
              {/* Telephony Status Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      phase === 'connected'
                        ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        911 EMERGENCY DISPATCH
                      </span>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          phase === 'connected'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {phase === 'connected' ? 'CALL ACTIVE' : 'CALL ENDED'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Incident Ref: {broadcastResult?.incidentId || 'CAD-911-849204'} · Duration: {formatDuration(callDuration)}
                    </div>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      isMuted
                        ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsSpeaker(!isSpeaker)}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSpeaker
                        ? 'bg-sky-950/40 text-sky-300 border-sky-500/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Toggle Speakerphone"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStrobeActive(!strobeActive)}
                    className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      strobeActive
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-900/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Toggle Responder Beacon Flasher"
                  >
                    <Siren className="w-4 h-4" />
                  </button>
                  {phase === 'connected' ? (
                    <button
                      onClick={handleEndCall}
                      className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End Call</span>
                    </button>
                  ) : (
                    <button
                      onClick={triggerEmergencyDispatch}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Redial 911</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated Dispatcher Dialogue / Status */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    CAD Dispatcher Transmission Active
                  </span>
                  <span className="font-mono">Unit Medic-4 En Route (ETA 4 min)</span>
                </div>
                <div className="text-xs text-slate-200 bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 font-mono">
                  <span className="text-rose-400 font-bold">[DISPATCH]:</span> "Arthur, we have received your EPIS telemetry and GPS coordinates at 742 Evergreen Terrace. EMS Medic-4 has been dispatched Code 3. Keep phone line open. Critical alerts (O- blood, Penicillin anaphylaxis, pacemaker) have been forwarded to trauma team."
                </div>
              </div>
            </div>
          )}

          {/* GPS Location & Telemetry Broadcast Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Live Dispatch GPS Location
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshLocation}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono"
                >
                  Recalibrate GPS
                </button>
                <button
                  onClick={handleCopyGPS}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                >
                  {copiedLocation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy for Dispatcher</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">Primary Street Address:</div>
                <div className="font-semibold text-white mt-0.5">{location.streetAddress}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{location.crossStreet}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">GPS Coordinates & Accuracy:</div>
                <div className="font-mono text-emerald-400 font-bold mt-0.5">
                  {location.latitude ?? '37.774929'}°, {location.longitude ?? '-122.419416'}°
                </div>
                <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                  Perimeter Accuracy: ±{location.accuracy ?? 6}m · CAD Grid: {location.gridReference}
                </div>
              </div>
            </div>
          </div>

          {/* Instant Medical Alert Summary */}
          <div className="bg-slate-950 border border-rose-950/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Instant Medical Alert Summary (Transmitted to EMS)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Blood Type */}
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-600/40 text-center">
                <div className="text-[10px] text-rose-300 uppercase font-mono">Blood Type</div>
                <div className="text-xl font-black text-rose-400 font-mono mt-0.5">
                  {patient.bloodType}
                </div>
                <div className="text-[10px] text-rose-300/80">Universal Donor</div>
              </div>

              {/* Code Status */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Directives</div>
                <div className="text-sm font-bold text-white font-mono mt-1">
                  {patient.dnrStatus}
                </div>
                <div className="text-[10px] text-slate-400">Standard Resus</div>
              </div>

              {/* Severe Allergy */}
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-600/40 col-span-2 text-left">
                <div className="text-[10px] text-rose-300 uppercase font-mono flex items-center justify-between">
                  <span>Critical Allergies</span>
                  <span className="text-rose-400 font-bold">ANAPHYLAXIS</span>
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {patient.allergies.map((a) => a.allergen).join(' · ')}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Strictly avoid Beta-Lactams & Latex products
                </div>
              </div>
            </div>

            {/* Implants & Chronic Conditions */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Implants / Devices: </span>
              <span className="text-slate-200 font-medium">
                {patient.implants.join(' | ')}
              </span>
            </div>
          </div>

          {/* Emergency Contacts Broadcast Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Emergency Contacts Broadcast Feed
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {patient.emergencyContacts.length} Contacts Linked
              </span>
            </div>

            <div className="space-y-1.5">
              {patient.emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-xs border border-slate-800/80"
                >
                  <div>
                    <span className="font-semibold text-white">{contact.name}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">({contact.relationship})</span>
                    <div className="text-slate-400 text-[11px] font-mono">{contact.phone}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Check className="w-3 h-3" />
                      SMS & GPS Dispatched
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>EPIS Automated CAD Gateway v4.2</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
