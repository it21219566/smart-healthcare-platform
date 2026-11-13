"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { patientService } from "@/services/patientService";

export default function PatientProfileForm({ user, initialProfile, onSaved, notify }) {
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    email: "",
    phone: "+94771234567",
    dateOfBirth: "1999-05-14",
    bloodGroup: "O+",
    allergies: "None",
    medicalHistory: "No chronic conditions",
  });

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile);
  }, [initialProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saved = await patientService.saveProfile(profile);
      notify(`Patient profile saved! (Patient ID: #${saved.id})`);
      onSaved(saved);
    } catch (err) {
      notify("Error saving profile: " + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
        <User className="w-4 h-4" /> 1. Patient Profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <input
          type="text"
          placeholder="Full Name"
          required
          value={profile.fullName}
          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
        />
        <input
          type="email"
          placeholder="Email for Notifications"
          required
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Phone (+94...)"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <input
            type="text"
            placeholder="Blood Group (e.g. O+)"
            value={profile.bloodGroup}
            onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
        </div>
        <input
          type="text"
          placeholder="Allergies"
          value={profile.allergies}
          onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
        />
        <textarea
          placeholder="Medical History"
          rows={2}
          value={profile.medicalHistory}
          onChange={(e) => setProfile({ ...profile, medicalHistory: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold hover:bg-yellow-400 transition"
        >
          Save Patient Profile
        </button>
      </form>
    </div>
  );
}