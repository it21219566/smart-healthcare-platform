"use client";

import { useEffect, useState } from "react";
import { PlusCircle, ShieldCheck, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { doctorService } from "@/services/doctorService";

export default function AdminWorkspace({ notify }) {
  const [doctors, setDoctors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [docForm, setDocForm] = useState({
    fullName: "",
    email: "",
    password: "",
    specialty: "Cardiologist",
    qualification: "MBBS, MD",
    slmcRegNumber: "",
    consultationFee: 2500,
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const list = await doctorService.getAllDoctors();
      setDoctors(list || []);
    } catch (err) {
      notify("Error fetching doctors: " + err.message);
    }
  };

  // Coordinates onboarding across auth-service and doctor-service
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Step 1: Create DOCTOR login credentials in auth-service (passwordChangeRequired = true)
      const authCreated = await authService.adminCreateDoctorAuth({
        fullName: docForm.fullName,
        email: docForm.email,
        password: docForm.password,
      });

      // Step 2: Create verified Doctor profile in doctor-service linked to authCreated.userId
      await doctorService.adminCreateDoctorProfile({
        userId: authCreated.userId,
        fullName: docForm.fullName,
        email: docForm.email,
        specialty: docForm.specialty,
        qualification: docForm.qualification,
        slmcRegNumber: docForm.slmcRegNumber,
        consultationFee: Number(docForm.consultationFee),
      });

      notify(
        `Doctor ${docForm.fullName} onboarded! Account & Profile created (must rotate password on first login).`
      );
      setDocForm({
        fullName: "",
        email: "",
        password: "",
        specialty: "Cardiologist",
        qualification: "MBBS, MD",
        slmcRegNumber: "",
        consultationFee: 2500,
      });
      loadDoctors();
    } catch (err) {
      notify("Failed to onboard doctor: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const approveDoctor = async (docId) => {
    try {
      await doctorService.verifyDoctor(docId);
      notify(`Doctor #${docId} verified!`);
      loadDoctors();
    } catch (err) {
      notify("Verification failed: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Admin Form to Onboard a New Doctor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
          <PlusCircle className="w-4 h-4" /> Onboard New Doctor
        </h2>
        <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Doctor Full Name</label>
            <input
              type="text"
              required
              placeholder="Dr. Kasun Perera"
              value={docForm.fullName}
              onChange={(e) => setDocForm({ ...docForm, fullName: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Login Email</label>
            <input
              type="email"
              required
              placeholder="kasun@hospital.lk"
              value={docForm.email}
              onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              One-Time Temporary Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={docForm.password}
              onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Specialty</label>
            <input
              type="text"
              required
              placeholder="Cardiologist / Dermatologist / Pediatrician"
              value={docForm.specialty}
              onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Qualifications</label>
            <input
              type="text"
              required
              placeholder="MBBS, MD (Colombo)"
              value={docForm.qualification}
              onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">SLMC Reg No</label>
              <input
                type="text"
                required
                placeholder="SLMC-44210"
                value={docForm.slmcRegNumber}
                onChange={(e) => setDocForm({ ...docForm, slmcRegNumber: e.target.value })}
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Fee (LKR)</label>
              <input
                type="number"
                required
                value={docForm.consultationFee}
                onChange={(e) => setDocForm({ ...docForm, consultationFee: e.target.value })}
                className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 mt-2 rounded-lg bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] font-bold transition"
          >
            {submitting ? "Creating Account & Profile..." : "+ Create Doctor & Profile"}
          </button>
        </form>
      </div>

      {/* Right 2 Columns: Registered Doctors Directory */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5" /> Registered Doctors Directory ({doctors.length})
        </h2>
        {doctors.length === 0 ? (
          <p className="text-xs text-slate-400">
            No doctors added yet. Use the form on the left to onboard a doctor.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
              >
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-white">{doc.fullName}</p>
                  <p className="text-[#fed352] font-medium">
                    {doc.specialty} • {doc.qualification}
                  </p>
                  <p className="text-slate-400">{doc.email}</p>
                  <p className="text-slate-400">
                    SLMC: {doc.slmcRegNumber} • Fee: LKR {doc.consultationFee}
                  </p>
                </div>
                {doc.verified ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => approveDoctor(doc.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#fed352] text-[#1e2a5e] text-xs font-bold"
                  >
                    Verify
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}