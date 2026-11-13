import { apiRequest } from "@/lib/api";

export const doctorService = {
  searchVerified: (specialty = "") => {
    const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
    return apiRequest(`/api/doctors/search${query}`);
  },

  getAllDoctors: () => apiRequest("/api/doctors/all"),

  saveProfile: (profile) =>
    apiRequest("/api/doctors/profile", { method: "POST", body: JSON.stringify(profile) }),

  adminCreateDoctorProfile: (profile) =>
    apiRequest("/api/doctors/admin/create", { method: "POST", body: JSON.stringify(profile) }),

  verifyDoctor: (doctorId) =>
    apiRequest(`/api/doctors/${doctorId}/verify`, { method: "PUT" }),

  getAvailableSlots: (doctorId) => apiRequest(`/api/doctors/${doctorId}/slots`),

  addSlot: (doctorId, slot) =>
    apiRequest(`/api/doctors/${doctorId}/slots`, { method: "POST", body: JSON.stringify(slot) }),

  issuePrescription: (prescription) =>
    apiRequest("/api/doctors/prescriptions", {
      method: "POST",
      body: JSON.stringify(prescription),
    }),

  getPatientPrescriptions: (patientId) =>
    apiRequest(`/api/doctors/prescriptions/patient/${patientId}`),
};