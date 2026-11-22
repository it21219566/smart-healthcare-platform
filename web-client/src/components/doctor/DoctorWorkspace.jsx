"use client";

import { useEffect, useState } from "react";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import { patientService } from "@/services/patientService";
import DoctorProfileAndSlots from "./DoctorProfileAndSlots";
import DoctorAppointmentsAndRx from "./DoctorAppointmentsAndRx";

export default function DoctorWorkspace({ user, notify }) {
  const [doctorRecord, setDoctorRecord] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reportsByAppointment, setReportsByAppointment] = useState({});

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const allDocs = await doctorService.getAllDoctors();
      const mine = (allDocs || []).find((d) => d.userId === user.userId);
      if (mine) {
        setDoctorRecord(mine);
        const [mySlots, myAppts] = await Promise.all([
          doctorService.getAvailableSlots(mine.id),
          appointmentService.getByDoctor(mine.id),
        ]);
        const apptList = myAppts || [];
        setSlots(mySlots || []);
        setAppointments(apptList);

        // Fetch medical reports attached to each appointment
        const reportEntries = await Promise.all(
          apptList.map(async (apt) => {
            try {
              const reps = await patientService.getReportsByAppointment(apt.id);
              return [apt.id, reps || []];
            } catch (_) {
              return [apt.id, []];
            }
          })
        );
        setReportsByAppointment(Object.fromEntries(reportEntries));
      }
    } catch (_) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DoctorProfileAndSlots
        user={user}
        doctorRecord={doctorRecord}
        slots={slots}
        onUpdated={loadDoctorData}
        notify={notify}
      />
      <div className="lg:col-span-2 space-y-6">
        <DoctorAppointmentsAndRx
          doctorRecord={doctorRecord}
          appointments={appointments}
          reportsByAppointment={reportsByAppointment}
          onStatusChanged={loadDoctorData}
          notify={notify}
        />
      </div>
    </div>
  );
}