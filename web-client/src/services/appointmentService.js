import { apiRequest } from "@/lib/api";

export const appointmentService = {
  book: (payload) =>
    apiRequest("/api/appointments/book", { method: "POST", body: JSON.stringify(payload) }),

  getByPatient: (patientId) => apiRequest(`/api/appointments/patient/${patientId}`),

  getByDoctor: (doctorId) => apiRequest(`/api/appointments/doctor/${doctorId}`),

  updateStatus: (appointmentId, status) =>
    apiRequest(`/api/appointments/${appointmentId}/status?status=${status}`, { method: "PUT" }),
};