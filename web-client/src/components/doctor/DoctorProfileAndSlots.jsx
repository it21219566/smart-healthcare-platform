"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { doctorService } from "@/services/doctorService";

function getMinutesDiff(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export default function DoctorProfileAndSlots({ user, doctorRecord, slots = [], onUpdated, notify }) {
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
    startTime: "16:00",
    endTime: "16:30",
  });

  useEffect(() => {
    if (doctorRecord) setProfile(doctorRecord);
  }, [doctorRecord]);

  const durationMins = getMinutesDiff(slotForm.startTime, slotForm.endTime);
  const previewCount = durationMins >= 30 ? Math.floor(durationMins / 10) : 0;

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
    if (durationMins < 30) {
      notify("Please select an availability window of at least 30 minutes.");
      return;
    }

    const toSqlTime = (t) => (t.length === 5 ? `${t}:00` : t);

    try {
      const created = await doctorService.addSlot(doctorRecord.id, {
        availableDate: slotForm.availableDate,
        startTime: toSqlTime(slotForm.startTime),
        endTime: toSqlTime(slotForm.endTime),
      });
      const count = Array.isArray(created) ? created.length : previewCount;
      notify(`${count} appointment slots (10 mins each) generated and published!`);
      onUpdated();
    } catch (err) {
      notify("Failed to publish slots: " + err.message);
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
        <h2 className="text-base font-bold text-[#fed352] mb-1">2. Publish Availability Window</h2>
        <p className="text-[11px] text-slate-400 mb-3">
          Enter your available time (minimum 30 mins). The system automatically splits it into 10-minute slots.
        </p>
        <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
          <input
            type="date"
            required
            value={slotForm.availableDate}
            onChange={(e) => setSlotForm({ ...slotForm, availableDate: e.target.value })}
            className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">From</label>
              <input
                type="time"
                required
                value={slotForm.startTime}
                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">To</label>
              <input
                type="time"
                required
                value={slotForm.endTime}
                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px]">
            {durationMins >= 30 ? (
              <span className="text-emerald-400">
                Will automatically generate <strong>{previewCount} slots</strong> (10 mins each)
              </span>
            ) : (
              <span className="text-red-400">
                Window must be at least 30 minutes (currently {Math.max(0, durationMins)} mins)
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={durationMins < 30}
            className="w-full py-2.5 rounded-lg bg-[#1e2a5e] border border-[#fed352]/50 text-[#fed352] font-bold disabled:opacity-40"
          >
            + Generate & Publish {previewCount > 0 ? `${previewCount} Slots` : "Slots"}
          </button>
        </form>

        {slots.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-300 mb-2">
              Open Unbooked Slots ({slots.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {slots.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-200 flex items-center gap-1"
                >
                  <Clock className="w-3 h-3 text-[#fed352]" />
                  {s.availableDate} {String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}