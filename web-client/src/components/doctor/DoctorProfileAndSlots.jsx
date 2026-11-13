"use client";

import { useEffect, useState } from "react";
import { doctorService } from "@/services/doctorService";

export default function DoctorProfileAndSlots({ user, doctorRecord, onUpdated, notify }) {
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    email: "",
    specialty: "Cardiologist",
    qualification: "MBBS, MD",
    slmcRegNumber: "SLMC-44210",
    consultationFee: 2500,
  });

  const [slotForm, setSlotForm] = useState({
    availableDate: "2026-11-25",
    startTime: "16:00:00",
    endTime: "16:30:00",
  });

  useEffect(() => {
    if (doctorRecord) setProfile(doctorRecord);
  }, [doctorRecord]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const saved = await doctorService.saveProfile(profile);
      notify(`Doctor profile updated (ID #${saved.id}).`);
      onUpdated();
    } catch (err) {
      notify("Error saving doctor profile: " + err.message);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!doctorRecord) {
      notify("Doctor profile not found!");
      return;
    }
    try {
      await doctorService.addSlot(doctorRecord.id, slotForm);
      notify("Time slot published!");
      onUpdated();
    } catch (err) {
      notify("Failed to add slot: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] mb-3">1. Doctor Profile</h2>
        {doctorRecord && (
          <p className="text-xs mb-3">
            Status:{" "}
            <span className={doctorRecord.verified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {doctorRecord.verified ? "Verified by Admin" : "Pending Admin Verification"}
            </span>
          </p>
        )}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <input
            type="text"
            placeholder="Doctor Full Name"
            required
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <input
            type="email"
            placeholder="Official Email"
            required
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <input
            type="text"
            placeholder="Specialty (e.g. Cardiologist)"
            required
            value={profile.specialty}
            onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <input
            type="text"
            placeholder="Qualifications"
            value={profile.qualification}
            onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="SLMC Reg No"
              value={profile.slmcRegNumber}
              onChange={(e) => setProfile({ ...profile, slmcRegNumber: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
            />
            <input
              type="number"
              placeholder="Fee (LKR)"
              value={profile.consultationFee}
              onChange={(e) => setProfile({ ...profile, consultationFee: Number(e.target.value) })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold">
            Update Doctor Profile
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] mb-3">2. Publish Availability Slot</h2>
        <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
          <input
            type="date"
            required
            value={slotForm.availableDate}
            onChange={(e) => setSlotForm({ ...slotForm, availableDate: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Start (16:00:00)"
              value={slotForm.startTime}
              onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
            />
            <input
              type="text"
              placeholder="End (16:30:00)"
              value={slotForm.endTime}
              onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#1e2a5e] border border-[#fed352]/50 text-[#fed352] font-bold"
          >
            + Add Available Slot
          </button>
        </form>
      </div>
    </div>
  );
}