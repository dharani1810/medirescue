import React, { useState, useEffect } from 'react';
import { UserRole, PatientProfile, GPSLocation, TriageRecord, AuditLogEntry } from './types/epis';
import { INITIAL_PATIENT, INITIAL_ED_QUEUE, INITIAL_AUDIT_LOGS } from './data/mockData';
import { fetchCurrentGPSLocation } from './utils/emergencyService';
import { analyzeDrugSafety } from './utils/drugSafetyEngine';

import { Header } from './components/Header';
import { PatientDashboard } from './components/PatientDashboard';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { GeneralHealthCheckupModal } from './components/GeneralHealthCheckupModal';
import { ParamedicFieldView } from './components/ParamedicFieldView';
import { TriageNurseView } from './components/TriageNurseView';
import { PhysicianClinicalView } from './components/PhysicianClinicalView';
import { HipaaAuditModal } from './components/HipaaAuditModal';
import { ConsentManagementModal } from './components/ConsentManagementModal';
import { PrintMedicalSummaryModal } from './components/PrintMedicalSummaryModal';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [patient, setPatient] = useState<PatientProfile>(INITIAL_PATIENT);
  const [location, setLocation] = useState<GPSLocation>({
    latitude: 37.774929,
    longitude: -122.419416,
    accuracy: 6,
    streetAddress: '742 Evergreen Terrace, Sector 4',
    crossStreet: 'Corner of Elm Street & Lincoln Way',
    gridReference: 'CAD-BAY-7749-4194',
    fetching: true,
    error: null,
    timestamp: 'Initializing GPS...',
  });

  const [edQueue, setEdQueue] = useState<TriageRecord[]>(INITIAL_ED_QUEUE);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Modals
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isCheckupOpen, setIsCheckupOpen] = useState<boolean>(false);
  const [isHipaaAuditOpen, setIsHipaaAuditOpen] = useState<boolean>(false);
  const [isConsentOpen, setIsConsentOpen] = useState<boolean>(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Fetch real-time GPS location on initial load
  useEffect(() => {
    refreshGPS();
  }, []);

  const refreshGPS = async () => {
    setLocation((prev) => ({ ...prev, fetching: true }));
    const loc = await fetchCurrentGPSLocation();
    setLocation(loc);
  };

  const logAudit = (action: string, reason: string, override = false) => {
    const actorNames: Record<UserRole, string> = {
      patient: patient.name,
      paramedic: 'EMS Medic-4 (Field Responder)',
      nurse: 'Nurse Evelyn Chen, RN',
      doctor: 'Dr. Aris Thorne, MD',
    };

    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      actorName: actorNames[currentRole] || 'System',
      actorRole: currentRole,
      action,
      patientMrn: patient.mrn,
      reason,
      emergencyOverride: override,
    };

    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    logAudit(
      'ROLE_SWITCH',
      `Session context changed to ${newRole.toUpperCase()} view. Protected medical data accessed under authorized clinical role.`,
      newRole === 'doctor' || newRole === 'paramedic'
    );
  };

  const handleSubmitTriage = (record: TriageRecord) => {
    setEdQueue((prev) => [record, ...prev]);
  };

  const handleUpdateStatus = (id: string, newStatus: TriageRecord['status'], bed?: string) => {
    setEdQueue((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? { ...rec, status: newStatus, bedAssignment: bed || rec.bedAssignment }
          : rec
      )
    );
  };

  const handleUpdateConsent = (signed: boolean) => {
    setPatient((prev) => ({
      ...prev,
      consentSigned: signed,
      consentTimestamp: signed ? new Date().toLocaleString() : undefined,
    }));
  };

  const drugAlerts = analyzeDrugSafety(patient.medications, patient.allergies);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        highContrast ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top Bar Navigation Contract */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenHipaaAudit={() => setIsHipaaAuditOpen(true)}
        onOpenConsent={() => setIsConsentOpen(true)}
        onOpenPrintSummary={() => setIsPrintSummaryOpen(true)}
        consentSigned={patient.consentSigned}
        auditCount={auditLogs.length}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentRole === 'patient' && (
          <PatientDashboard
            patient={patient}
            location={location}
            onTriggerEmergency={() => setIsSosOpen(true)}
            onOpenCheckup={() => setIsCheckupOpen(true)}
            onOpenPrintSummary={() => setIsPrintSummaryOpen(true)}
            onOpenConsent={() => setIsConsentOpen(true)}
            highContrast={highContrast}
          />
        )}

        {currentRole === 'paramedic' && (
          <ParamedicFieldView
            patient={patient}
            location={location}
            onLogAudit={logAudit}
          />
        )}

        {currentRole === 'nurse' && (
          <TriageNurseView
            queue={edQueue}
            onUpdateStatus={handleUpdateStatus}
            onOpenCheckup={() => setIsCheckupOpen(true)}
            onLogAudit={logAudit}
          />
        )}

        {currentRole === 'doctor' && (
          <PhysicianClinicalView
            patient={patient}
            triageRecord={edQueue[0]}
            drugAlerts={drugAlerts}
            onLogAudit={logAudit}
            onOpenPrintSummary={() => setIsPrintSummaryOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EPIS · Emergency Patient Information System</span>
          <span>ESI Protocol v4 · HIPAA Security Rule Aligned (45 CFR § 164.312)</span>
        </div>
      </footer>

      {/* Modals */}
      <EmergencySOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        patient={patient}
        location={location}
        onRefreshLocation={refreshGPS}
        onLogAudit={logAudit}
      />

      <GeneralHealthCheckupModal
        isOpen={isCheckupOpen}
        onClose={() => setIsCheckupOpen(false)}
        patient={patient}
        onSubmitTriage={handleSubmitTriage}
        onLogAudit={logAudit}
      />

      <HipaaAuditModal
        isOpen={isHipaaAuditOpen}
        onClose={() => setIsHipaaAuditOpen(false)}
        logs={auditLogs}
      />

      <ConsentManagementModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        patient={patient}
        onUpdateConsent={handleUpdateConsent}
        onLogAudit={logAudit}
      />

      <PrintMedicalSummaryModal
        isOpen={isPrintSummaryOpen}
        onClose={() => setIsPrintSummaryOpen(false)}
        patient={patient}
        location={location}
        triageRecord={edQueue[0]}
      />
    </div>
  );
}
