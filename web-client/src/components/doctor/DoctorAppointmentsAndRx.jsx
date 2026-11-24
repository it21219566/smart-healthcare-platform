"use client";

import { useState } from "react";
import { Video, FileText } from "lucide-react";
import { patientService } from "@/services/patientService";
import { appointmentService } from "@/services/appointmentService";
import { doctorService } from "@/services/doctorService";

const STATUS_STYLES = {
  BOOKED: {
    card: "bg-amber-500/10 border-amber-500/50",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-400/40",
    dot: "bg-amber-400",
  },
  PENDING: {
    card: "bg-amber-500/10 border-amber-500/50",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-400/40",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    card: "bg-emerald-500/10 border-emerald-500/50",
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
    dot: "bg-emerald-400",
  },
  COMPLETED: {
    card: "bg-blue-500/10 border-blue-500/50",
    badge: "bg-blue-500/20 text-blue-300 border border-blue-400/40",
    dot: "bg-blue-400",
  },
  CANCELLED: {
    card: "bg-red-500/10 border-red-500/50",
    badge: "bg-red-500/20 text-red-300 border border-red-400/40",
    dot: "bg-red-400",
  },
};

export default function DoctorAppointmentsAndRx({
  doctorRecord,
  appointments,
  reportsByAppointment = {},
  onStatusChanged,
  notify,
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
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

  const counts = {
    ALL: appointments.length,
    BOOKED: appointments.filter((a) => a.status === "BOOKED" || a.status === "PENDING").length,
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  const visibleAppointments =
    statusFilter === "ALL"
      ? appointments
      : appointments.filter((a) =>
          statusFilter === "BOOKED"
            ? a.status === "BOOKED" || a.status === "PENDING"
            : a.status === statusFilter
        );

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-[#fed352]">
            3. Scheduled Telemedicine Appointments
          </h2>

          {/* Color-Coded Status Legend & Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              { key: "ALL", label: `All (${counts.ALL})`, active: "bg-slate-200 text-slate-900" },
              { key: "BOOKED", label: `Booked (${counts.BOOKED})`, active: "bg-amber-500 text-slate-950" },
              { key: "CONFIRMED", label: `Confirmed (${counts.CONFIRMED})`, active: "bg-emerald-500 text-slate-950" },
              { key: "COMPLETED", label: `Completed (${counts.COMPLETED})`, active: "bg-blue-500 text-white" },
              { key: "CANCELLED", label: `Cancelled (${counts.CANCELLED})`, active: "bg-red-500 text-white" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-full font-semibold transition ${
                  statusFilter === tab.key
                    ? tab.active
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {visibleAppointments.length === 0 ? (
          <p className="text-xs text-slate-400">No appointments match this status.</p>
        ) : (
          <div className="space-y-3">
            {visibleAppointments.map((apt) => {
              const style = STATUS_STYLES[apt.status] || {
                card: "bg-slate-800 border-slate-700",
                badge: "bg-slate-700 text-slate-200",
                dot: "bg-slate-400",
              };
              const isFinalized = apt.status === "CANCELLED" || apt.status === "COMPLETED";

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-3 transition ${style.card}`}
                >
                  <div className="text-xs space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        Appt #{apt.id} — Patient: {apt.patientName} (ID: #{apt.patientId})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${style.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-slate-200">
                      Date: {apt.appointmentDate} at {apt.startTime}
                    </p>
                    <p className="text-slate-300/80">
                      <span className="font-semibold text-slate-200">Reason:</span> {apt.reason}
                    </p>
                    {apt.symptoms && (
                      <p className="text-slate-300/90 bg-slate-900/60 border border-slate-700/70 rounded px-2.5 py-1.5 mt-1">
                        <span className="font-semibold text-[#fed352]">Symptoms:</span> {apt.symptoms}
                      </p>
                    )}
                      {/* Attached Patient Medical Reports for this Appointment */}
                      <div className="pt-2">
                        {(reportsByAppointment[apt.id] || []).length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-[#fed352]" /> Reports:
                            </span>
                            {reportsByAppointment[apt.id].map((rep) => (
                              <a
                                key={rep.id}
                                href={patientService.getReportDownloadUrl(rep.id)}
                                target="_blank"
                                rel="noreferrer"
                                title={rep.description}
                                className="px-2 py-0.5 rounded bg-slate-900/90 border border-[#fed352]/50 text-[#fed352] hover:bg-[#fed352] hover:text-[#1e2a5e] text-[11px] font-semibold transition"
                              >
                                {rep.reportName}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No medical reports attached</p>
                        )}
                      </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {apt.meetingLink && apt.status !== "CANCELLED" && (
                      <a
                        href={apt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Start Video
                      </a>
                    )}
                    {apt.status !== "CANCELLED" && (
                      <button
                        onClick={() =>
                          setPrescForm({ ...prescForm, appointmentId: apt.id, patientId: apt.patientId })
                        }
                        className="px-3 py-1.5 rounded bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] font-bold text-xs"
                      >
                        Prescribe
                      </button>
                    )}
                    {!isFinalized && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(apt.id, "COMPLETED")}
                          className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(apt.id, "CANCELLED")}
                          className="px-2.5 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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