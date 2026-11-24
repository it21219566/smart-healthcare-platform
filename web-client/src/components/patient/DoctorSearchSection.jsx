"use client";

import { useEffect, useState } from "react";
import { Search, Clock, Paperclip } from "lucide-react";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";
import { patientService } from "@/services/patientService";

export default function DoctorSearchSection({ patientRecord, onBooked, notify }) {
  const [specialtyQuery, setSpecialtyQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("General Consultation & Checkup");
  const [symptoms, setSymptoms] = useState("");
  const [reportFiles, setReportFiles] = useState([]);
  const [reportDesc, setReportDesc] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    handleSearch("");
  }, []);

  const handleSearch = async (spec) => {
    try {
      const list = await doctorService.searchVerified(spec);
      setDoctors(list || []);
    } catch (err) {
      notify("Error loading doctors: " + err.message);
    }
  };

  const viewSlots = async (doc) => {
    setSelectedDoctor(doc);
    setSymptoms("");
    setReportFiles([]);
    setReportDesc("");
    try {
      const available = await doctorService.getAvailableSlots(doc.id);
      setSlots(available || []);
    } catch (err) {
      notify("Could not load slots: " + err.message);
    }
  };

  const handleBookSlot = async (slot) => {
    if (!patientRecord) {
      notify("Please click 'Save Patient Profile' first before booking!");
      return;
    }

    setBooking(true);
    try {
      // 1. Book appointment & lock slot synchronously
      const booked = await appointmentService.book({
        patientId: patientRecord.id,
        patientName: patientRecord.fullName,
        patientEmail: patientRecord.email,
        patientPhone: patientRecord.phone,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        doctorEmail: selectedDoctor.email,
        specialty: selectedDoctor.specialty,
        slotId: slot.id,
        appointmentDate: slot.availableDate,
        startTime: slot.startTime,
        reason,
        symptoms
      });

      // 2. Upload any attached medical reports linked to this appointment ID
      if (reportFiles.length > 0 && booked?.id) {
        await Promise.all(
          reportFiles.map((file) =>
            patientService.uploadReport(
              patientRecord.id,
              file,
              reportDesc || "Pre-Consultation Report",
              booked.id
            )
          )
        );
      }

      const fileMsg =
        reportFiles.length > 0 ? ` with ${reportFiles.length} medical report(s) attached` : "";
      notify(`Appointment #${booked?.id} booked${fileMsg}! Confirmation sent via ActiveMQ.`);

      setReportFiles([]);
      setSymptoms("");
      setReportDesc("");
      viewSlots(selectedDoctor);
      onBooked();
    } catch (err) {
      notify("Booking failed: " + err.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2">
          <Search className="w-4 h-4" /> 2. Find Verified Specialists & Book
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter by specialty (e.g. Cardiologist)"
            value={specialtyQuery}
            onChange={(e) => setSpecialtyQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs"
          />
          <button
            onClick={() => handleSearch(specialtyQuery)}
            className="px-4 py-1.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold text-xs"
          >
            Search
          </button>
        </div>
      </div>

      {doctors.length === 0 ? (
        <p className="text-xs text-slate-400">No verified doctors found yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-white text-sm">{doc.fullName}</h3>
                <p className="text-xs text-[#fed352] font-medium">{doc.specialty}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {doc.qualification} • SLMC: {doc.slmcRegNumber}
                </p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  Fee: LKR {doc.consultationFee}
                </p>
              </div>
              <button
                onClick={() => viewSlots(doc)}
                className="mt-3 py-2 rounded-lg bg-[#1e2a5e] hover:bg-[#fed352] hover:text-[#1e2a5e] text-white text-xs font-bold transition"
              >
                View Available Time Slots
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="mt-5 p-4 rounded-xl bg-[#1e2a5e]/40 border border-[#fed352]/40 space-y-3">
          <h4 className="text-sm font-bold text-white">
            Book Consultation with {selectedDoctor.fullName}
          </h4>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Brief Reason for Visit
              </label>
              <input
                type="text"
                placeholder="e.g. General Consultation & Checkup"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Describe Your Symptoms in Detail (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Explain your symptoms further (onset, duration, severity, triggers, or current medications)..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-xs resize-y"
              />
            </div>
          </div>

          {/* Integrated Medical Report Attachment during Booking */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700 space-y-2 text-xs">
            <label className="font-semibold text-[#fed352] flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attach Medical Reports for Doctor (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setReportFiles(Array.from(e.target.files || []))}
              className="w-full text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#1e2a5e] file:text-[#fed352]"
            />
            {reportFiles.length > 0 && (
              <>
                <input
                  type="text"
                  placeholder="Report Description (e.g. ECG, Blood Test, X-Ray)"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-xs"
                />
                <p className="text-[11px] text-emerald-400">
                  Selected ({reportFiles.length}): {reportFiles.map((f) => f.name).join(", ")}
                </p>
              </>
            )}
          </div>

          {slots.length === 0 ? (
            <p className="text-xs text-slate-300">No unbooked slots available for this doctor.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={booking}
                  onClick={() => handleBookSlot(slot)}
                  className="px-3 py-2 rounded-lg bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {slot.availableDate} ({String(slot.startTime).slice(0, 5)}–{String(slot.endTime).slice(0, 5)}) —{" "}
                  {booking ? "Booking..." : "Book Now"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}