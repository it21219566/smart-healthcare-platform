"use client";

import { useEffect, useState } from "react";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import DoctorProfileAndSlots from "./DoctorProfileAndSlots";
import DoctorAppointmentsAndRx from "./DoctorAppointmentsAndRx";

export default function DoctorWorkspace({ user, notify }) {
  const [doctorRecord, setDoctorRecord] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const allDocs = await doctorService.getAllDoctors();
      const mine = (allDocs || []).find((d) => d.userId === user.userId);
      if (mine) {
        setDoctorRecord(mine);
        const myAppts = await appointmentService.getByDoctor(mine.id);
        setAppointments(myAppts || []);
      }
    } catch (_) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DoctorProfileAndSlots
        user={user}
        doctorRecord={doctorRecord}
        onUpdated={loadDoctorData}
        notify={notify}
      />
      <div className="lg:col-span-2 space-y-6">
        <DoctorAppointmentsAndRx
          doctorRecord={doctorRecord}
          appointments={appointments}
          onStatusChanged={loadDoctorData}
          notify={notify}
        />
      </div>
    </div>
  );
}