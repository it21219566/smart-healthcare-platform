"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { appointmentService } from "@/services/appointmentService";
import { doctorService } from "@/services/doctorService";

export default function DoctorAppointmentsAndRx({ doctorRecord, appointments, onStatusChanged, notify }) {
  const [prescForm, setPrescForm] = useState({
    appointmentId: "",
    patientId: "",
    diagnosis: "",
    medications: "",
    notes: "",
  });

  const handleStatusUpdate = async (aptId, status) => {
    try {
      await appointmentService.updateStatus(aptId, status);
      notify(`Appointment #${aptId} marked as ${status}. Notification sent via ActiveMQ!`);
      onStatusChanged();
    } catch (err) {
      notify("Error updating status: " + err.message);
    }
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!doctorRecord) return;
    try {
      await doctorService.issuePrescription({
        ...prescForm,
        doctorId: doctorRecord.id,
      });
      notify("Digital prescription issued to patient!");
      setPrescForm({ appointmentId: "", patientId: "", diagnosis: "", medications: "", notes: "" });
    } catch (err) {
      notify("Failed to issue prescription: " + err.message);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] mb-4">
          3. Scheduled Telemedicine Appointments
        </h2>
        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400">No patient bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col sm:flex-row justify-between gap-3"
              >
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-white">
                    Appt #{apt.id} — Patient: {apt.patientName} (Patient ID: #{apt.patientId})
                  </p>
                  <p className="text-slate-300">
                    Date: {apt.appointmentDate} at {apt.startTime} • Status:{" "}
                    <span className="text-[#fed352] font-bold">{apt.status}</span>
                  </p>
                  <p className="text-slate-400">Reason: {apt.reason}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {apt.meetingLink && (
                    <a
                      href={apt.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" /> Start Video
                    </a>
                  )}
                  <button
                    onClick={() =>
                      setPrescForm({ ...prescForm, appointmentId: apt.id, patientId: apt.patientId })
                    }
                    className="px-3 py-1.5 rounded bg-[#fed352] text-[#1e2a5e] font-bold text-xs"
                  >
                    Prescribe
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(apt.id, "COMPLETED")}
                    className="px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(apt.id, "CANCELLED")}
                    className="px-2.5 py-1.5 rounded bg-red-600/80 text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] mb-4">4. Issue Digital Prescription</h2>
        <form onSubmit={handleIssuePrescription} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Appointment ID"
              required
              value={prescForm.appointmentId}
              onChange={(e) => setPrescForm({ ...prescForm, appointmentId: Number(e.target.value) })}
              className="p-2.5 rounded bg-slate-800 border border-slate-700"
            />
            <input
              type="number"
              placeholder="Patient ID"
              required
              value={prescForm.patientId}
              onChange={(e) => setPrescForm({ ...prescForm, patientId: Number(e.target.value) })}
              className="p-2.5 rounded bg-slate-800 border border-slate-700"
            />
          </div>
          <input
            type="text"
            placeholder="Clinical Diagnosis"
            required
            value={prescForm.diagnosis}
            onChange={(e) => setPrescForm({ ...prescForm, diagnosis: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <textarea
            placeholder="Medications & Dosage (e.g. Atorvastatin 10mg - 1 tablet nightly for 30 days)"
            rows={2}
            required
            value={prescForm.medications}
            onChange={(e) => setPrescForm({ ...prescForm, medications: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <input
            type="text"
            placeholder="Follow-up instructions"
            value={prescForm.notes}
            onChange={(e) => setPrescForm({ ...prescForm, notes: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold">
            Issue Prescription
          </button>
        </form>
      </div>
    </>
  );
}