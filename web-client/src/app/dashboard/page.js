"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, GATEWAY_URL } from "@/lib/api";
import {
  Stethoscope, LogOut, Search, Calendar, Upload, FileText,
  Video, CheckCircle, XCircle, Clock, PlusCircle, ShieldCheck, Pill, User
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(saved));
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="bg-[#1e2a5e] border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#fed352] text-[#1e2a5e]">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">
              SmartHealth<span className="text-[#fed352]">.lk</span>
            </h1>
            <p className="text-xs text-slate-300">
              Logged in as <span className="text-[#fed352] font-semibold">{user.fullName}</span> ({user.role})
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-xs font-semibold flex items-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      {/* Flash Message Banner */}
      {statusMsg && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="p-3 rounded-lg bg-[#1e2a5e] border border-[#fed352] text-[#fed352] text-sm flex justify-between items-center">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="text-xs underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Role-Specific Workspace */}
      <main className="max-w-7xl mx-auto p-6">
        {user.role === "PATIENT" && <PatientWorkspace user={user} notify={setStatusMsg} />}
        {user.role === "DOCTOR" && <DoctorWorkspace user={user} notify={setStatusMsg} />}
        {user.role === "ADMIN" && <AdminWorkspace user={user} notify={setStatusMsg} />}
      </main>
    </div>
  );
}

/* ============================================================================
   1. PATIENT WORKSPACE (Profile, Doctor Search, Slot Booking, Reports, Video)
   ============================================================================ */
function PatientWorkspace({ user, notify }) {
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    email: "",
    phone: "+94771234567",
    dateOfBirth: "1999-05-14",
    bloodGroup: "O+",
    allergies: "None",
    medicalHistory: "No chronic conditions",
  });
  const [patientRecord, setPatientRecord] = useState(null);
  const [specialtyQuery, setSpecialtyQuery] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("General Consultation & Checkup");
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reportFile, setReportFile] = useState(null);
  const [reportDesc, setReportDesc] = useState("");

  useEffect(() => {
    loadInitialPatientData();
    searchDoctors("");
  }, []);

  const loadInitialPatientData = async () => {
    try {
      const p = await apiRequest(`/api/patients/${user.userId}`);
      setPatientRecord(p);
      setProfile(p);
      loadPatientExtras(p.id);
    } catch (_) {
      // Profile not created yet
    }
  };

  const loadPatientExtras = async (patientId) => {
    try {
      const [appts, reps, presc] = await Promise.all([
        apiRequest(`/api/appointments/patient/${patientId}`),
        apiRequest(`/api/patients/${patientId}/reports`),
        apiRequest(`/api/doctors/prescriptions/patient/${patientId}`),
      ]);
      setAppointments(appts || []);
      setReports(reps || []);
      setPrescriptions(presc || []);
    } catch (_) {}
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const saved = await apiRequest("/api/patients/profile", {
        method: "POST",
        body: JSON.stringify(profile),
      });
      setPatientRecord(saved);
      notify("Patient profile saved! (Patient ID: #" + saved.id + ")");
      loadPatientExtras(saved.id);
    } catch (err) {
      notify("Error saving profile: " + err.message);
    }
  };

  const searchDoctors = async (spec) => {
    try {
      const query = spec ? `?specialty=${encodeURIComponent(spec)}` : "";
      const list = await apiRequest(`/api/doctors/search${query}`);
      setDoctors(list || []);
    } catch (err) {
      notify("Error loading doctors: " + err.message);
    }
  };

  const viewDoctorSlots = async (doc) => {
    setSelectedDoctor(doc);
    try {
      const available = await apiRequest(`/api/doctors/${doc.id}/slots`);
      setSlots(available || []);
    } catch (err) {
      notify("Could not load slots: " + err.message);
    }
  };

  const bookSlot = async (slot) => {
    if (!patientRecord) {
      notify("Please click 'Save Patient Profile' first before booking!");
      return;
    }
    try {
      await apiRequest("/api/appointments/book", {
        method: "POST",
        body: JSON.stringify({
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
        }),
      });
      notify("Appointment booked! Confirmation Email & SMS triggered via ActiveMQ.");
      viewDoctorSlots(selectedDoctor);
      loadPatientExtras(patientRecord.id);
    } catch (err) {
      notify("Booking failed: " + err.message);
    }
  };

  const uploadMedicalReport = async (e) => {
    e.preventDefault();
    if (!patientRecord || !reportFile) {
      notify("Save your profile and choose a PDF/Image file first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", reportFile);
      formData.append("description", reportDesc || "Lab Report");

      await apiRequest(`/api/patients/${patientRecord.id}/reports`, {
        method: "POST",
        isMultipart: true,
        body: formData,
      });
      notify("Medical report uploaded successfully!");
      setReportFile(null);
      setReportDesc("");
      loadPatientExtras(patientRecord.id);
    } catch (err) {
      notify("Upload failed: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Patient Profile & Medical Report Upload */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
            <User className="w-4 h-4" /> 1. Patient Profile
          </h2>
          <form onSubmit={saveProfile} className="space-y-3 text-xs">
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

        {/* Upload Medical Reports */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4" /> Upload Medical Reports
          </h2>
          <form onSubmit={uploadMedicalReport} className="space-y-3 text-xs">
            <input
              type="file"
              onChange={(e) => setReportFile(e.target.files[0])}
              className="w-full text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#1e2a5e] file:text-[#fed352]"
            />
            <input
              type="text"
              placeholder="Report Description (e.g. ECG / Blood Test)"
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full p-2.5 rounded bg-slate-800 border border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#1e2a5e] border border-[#fed352]/50 text-[#fed352] font-semibold hover:bg-[#1e2a5e]/80"
            >
              Upload Document
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="p-2.5 rounded bg-slate-800/70 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-white">{r.reportName}</p>
                  <p className="text-slate-400">{r.description}</p>
                </div>
                <a
                  href={`${GATEWAY_URL}/api/patients/reports/${r.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-[#fed352] text-[#1e2a5e] font-bold"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle & Right Columns: Search Doctors, Book Slots & View Appointments */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search Verified Doctors */}
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
                onClick={() => searchDoctors(specialtyQuery)}
                className="px-4 py-1.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold text-xs"
              >
                Search
              </button>
            </div>
          </div>

          {doctors.length === 0 ? (
            <p className="text-xs text-slate-400">
              No verified doctors found. (Create a Doctor profile and approve it via an ADMIN account).
            </p>
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
                    <p className="text-xs text-slate-400 mt-1">{doc.qualification} • SLMC: {doc.slmcRegNumber}</p>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">
                      Fee: LKR {doc.consultationFee}
                    </p>
                  </div>
                  <button
                    onClick={() => viewDoctorSlots(doc)}
                    className="mt-3 py-2 rounded-lg bg-[#1e2a5e] hover:bg-[#fed352] hover:text-[#1e2a5e] text-white text-xs font-bold transition"
                  >
                    View Available Time Slots
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available Slots Modal/Drawer */}
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
                      onClick={() => bookSlot(slot)}
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

        {/* My Appointments & Telemedicine Video Links */}
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

        {/* Digital Prescriptions */}
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
      </div>
    </div>
  );
}

/* ============================================================================
   2. DOCTOR WORKSPACE (Profile, Add Slots, Manage Appointments, Prescribe)
   ============================================================================ */
function DoctorWorkspace({ user, notify }) {
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    email: "",
    specialty: "Cardiologist",
    qualification: "MBBS, MD",
    slmcRegNumber: "SLMC-44210",
    consultationFee: 2500,
  });
  const [doctorRecord, setDoctorRecord] = useState(null);
  const [slotForm, setSlotForm] = useState({
    availableDate: "2026-11-25",
    startTime: "16:00:00",
    endTime: "16:30:00",
  });
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescForm, setPrescForm] = useState({
    appointmentId: "",
    patientId: "",
    diagnosis: "",
    medications: "",
    notes: "",
  });

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const allDocs = await apiRequest("/api/doctors/all");
      const mine = (allDocs || []).find((d) => d.userId === user.userId);
      if (mine) {
        setDoctorRecord(mine);
        setProfile(mine);
        const [mySlots, myAppts] = await Promise.all([
          apiRequest(`/api/doctors/${mine.id}/slots`),
          apiRequest(`/api/appointments/doctor/${mine.id}`),
        ]);
        setSlots(mySlots || []);
        setAppointments(myAppts || []);
      }
    } catch (_) {}
  };

  const saveDoctorProfile = async (e) => {
    e.preventDefault();
    try {
      const saved = await apiRequest("/api/doctors/profile", {
        method: "POST",
        body: JSON.stringify(profile),
      });
      setDoctorRecord(saved);
      notify(`Doctor profile saved (ID #${saved.id}). Verification status: ${saved.verified ? "VERIFIED" : "Pending Admin Approval"}`);
      loadDoctorData();
    } catch (err) {
      notify("Error saving doctor profile: " + err.message);
    }
  };

  const addAvailabilitySlot = async (e) => {
    e.preventDefault();
    if (!doctorRecord) {
      notify("Save your Doctor Profile first!");
      return;
    }
    try {
      await apiRequest(`/api/doctors/${doctorRecord.id}/slots`, {
        method: "POST",
        body: JSON.stringify(slotForm),
      });
      notify("Time slot published!");
      loadDoctorData();
    } catch (err) {
      notify("Failed to add slot: " + err.message);
    }
  };

  const updateApptStatus = async (aptId, status) => {
    try {
      await apiRequest(`/api/appointments/${aptId}/status?status=${status}`, {
        method: "PUT",
      });
      notify(`Appointment #${aptId} marked as ${status}. Notification sent via ActiveMQ!`);
      loadDoctorData();
    } catch (err) {
      notify("Error updating status: " + err.message);
    }
  };

  const issuePrescription = async (e) => {
    e.preventDefault();
    if (!doctorRecord) return;
    try {
      await apiRequest("/api/doctors/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          ...prescForm,
          doctorId: doctorRecord.id,
        }),
      });
      notify("Digital prescription issued to patient!");
      setPrescForm({ appointmentId: "", patientId: "", diagnosis: "", medications: "", notes: "" });
    } catch (err) {
      notify("Failed to issue prescription: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Doctor Profile & Add Slot */}
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
          <form onSubmit={saveDoctorProfile} className="space-y-3 text-xs">
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
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold"
            >
              Save Doctor Profile
            </button>
          </form>
        </div>

        {/* Add Availability Slot */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-[#fed352] mb-3">2. Publish Availability Slot</h2>
          <form onSubmit={addAvailabilitySlot} className="space-y-3 text-xs">
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

      {/* Right 2 Columns: Doctor Appointments & Issue Prescription */}
      <div className="lg:col-span-2 space-y-6">
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
                      onClick={() => {
                        setPrescForm({
                          ...prescForm,
                          appointmentId: apt.id,
                          patientId: apt.patientId,
                        });
                      }}
                      className="px-3 py-1.5 rounded bg-[#fed352] text-[#1e2a5e] font-bold text-xs"
                    >
                      Prescribe
                    </button>
                    <button
                      onClick={() => updateApptStatus(apt.id, "COMPLETED")}
                      className="px-2.5 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => updateApptStatus(apt.id, "CANCELLED")}
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

        {/* Issue Digital Prescription */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-base font-bold text-[#fed352] mb-4">
            4. Issue Digital Prescription
          </h2>
          <form onSubmit={issuePrescription} className="space-y-3 text-xs">
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
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold"
            >
              Issue Prescription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. ADMIN WORKSPACE (Verify Doctor Registrations & Platform Oversight)
   ============================================================================ */
function AdminWorkspace({ notify }) {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const list = await apiRequest("/api/doctors/all");
      setDoctors(list || []);
    } catch (err) {
      notify("Error fetching doctors: " + err.message);
    }
  };

  const approveDoctor = async (docId) => {
    try {
      await apiRequest(`/api/doctors/${docId}/verify`, { method: "PUT" });
      notify(`Doctor #${docId} verified! They now appear in public patient searches.`);
      loadDoctors();
    } catch (err) {
      notify("Verification failed: " + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-bold text-[#fed352] flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5" /> Admin Governance: Verify Doctor Registrations
      </h2>
      {doctors.length === 0 ? (
        <p className="text-xs text-slate-400">No doctors registered in doctor-service yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between"
            >
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-white">{doc.fullName}</p>
                <p className="text-[#fed352]">{doc.specialty} • {doc.qualification}</p>
                <p className="text-slate-400">SLMC: {doc.slmcRegNumber} • Fee: LKR {doc.consultationFee}</p>
              </div>
              {doc.verified ? (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              ) : (
                <button
                  onClick={() => approveDoctor(doc.id)}
                  className="px-4 py-2 rounded-lg bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] text-xs font-bold"
                >
                  Approve & Verify
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}