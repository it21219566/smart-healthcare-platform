"use client";

import { Calendar, Video, Pill } from "lucide-react";

export default function PatientAppointmentsList({ appointments, prescriptions }) {
  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" /> 3. My Appointments & Telemedicine Room
        </h2>
        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400">No appointments booked yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{apt.doctorName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Date: {apt.appointmentDate} at {apt.startTime} • Reason: {apt.reason}
                  </p>
                </div>
                {apt.meetingLink && apt.status === "CONFIRMED" && (
                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Video className="w-4 h-4" /> Join Video Session
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
          <Pill className="w-4 h-4" /> 4. Digital Prescriptions
        </h2>
        {prescriptions.length === 0 ? (
          <p className="text-xs text-slate-400">No digital prescriptions issued yet.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((pr) => (
              <div key={pr.id} className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <p className="font-bold text-[#fed352]">Diagnosis: {pr.diagnosis}</p>
                <p className="text-white mt-1">Medications: {pr.medications}</p>
                <p className="text-slate-400 mt-1">Notes: {pr.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}