"use client";

import { useEffect, useState } from "react";
import { patientService } from "@/services/patientService";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import PatientProfileForm from "./PatientProfileForm";
import MedicalReportsCard from "./MedicalReportsCard";
import DoctorSearchSection from "./DoctorSearchSection";
import PatientAppointmentsList from "./PatientAppointmentsList";

export default function PatientWorkspace({ user, notify }) {
  const [patientRecord, setPatientRecord] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const p = await patientService.getProfile(user.userId);
      setPatientRecord(p);
      await refreshPatientExtras(p.id);
    } catch (_) {
      // Profile not created yet
    }
  };

  const refreshPatientExtras = async (patientId) => {
    try {
      const [appts, reps, presc] = await Promise.all([
        appointmentService.getByPatient(patientId),
        patientService.getReports(patientId),
        doctorService.getPatientPrescriptions(patientId),
      ]);
      setAppointments(appts || []);
      setReports(reps || []);
      setPrescriptions(presc || []);
    } catch (_) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <PatientProfileForm
          user={user}
          initialProfile={patientRecord}
          onSaved={(saved) => {
            setPatientRecord(saved);
            refreshPatientExtras(saved.id);
          }}
          notify={notify}
        />
        <MedicalReportsCard
          patientRecord={patientRecord}
          reports={reports}
          onUploaded={() => refreshPatientExtras(patientRecord.id)}
          notify={notify}
        />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <DoctorSearchSection
          patientRecord={patientRecord}
          onBooked={() => refreshPatientExtras(patientRecord.id)}
          notify={notify}
        />
        <PatientAppointmentsList
          appointments={appointments}
          prescriptions={prescriptions}
        />
      </div>
    </div>
  );
}