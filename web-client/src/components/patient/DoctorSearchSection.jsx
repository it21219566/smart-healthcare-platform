"use client";

import { useEffect, useState } from "react";
import { Search, Clock } from "lucide-react";
import { doctorService } from "@/services/doctorService";
import { appointmentService } from "@/services/appointmentService";

export default function DoctorSearchSection({ patientRecord, onBooked, notify }) {
  const [specialtyQuery, setSpecialtyQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("General Consultation & Checkup");

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
    try {
      await appointmentService.book({
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
      });
      notify("Appointment booked! Confirmation Email & SMS triggered via ActiveMQ.");
      viewSlots(selectedDoctor);
      onBooked();
    } catch (err) {
      notify("Booking failed: " + err.message);
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
            <div key={doc.id} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{doc.fullName}</h3>
                <p className="text-xs text-[#fed352] font-medium">{doc.specialty}</p>
                <p className="text-xs text-slate-400 mt-1">{doc.qualification} • SLMC: {doc.slmcRegNumber}</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">Fee: LKR {doc.consultationFee}</p>
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
        <div className="mt-5 p-4 rounded-xl bg-[#1e2a5e]/40 border border-[#fed352]/40">
          <h4 className="text-sm font-bold text-white mb-2">
            Available Slots for {selectedDoctor.fullName}
          </h4>
          <input
            type="text"
            placeholder="Reason for consultation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-slate-900 border border-slate-700 text-xs"
          />
          {slots.length === 0 ? (
            <p className="text-xs text-slate-300">No unbooked slots available for this doctor.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleBookSlot(slot)}
                  className="px-3 py-2 rounded-lg bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] text-xs font-bold flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {slot.availableDate} ({slot.startTime}) — Book Now
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}