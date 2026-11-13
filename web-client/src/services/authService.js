import { apiRequest } from "@/lib/api";

export const authService = {
  login: (credentials) =>
    apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),

  registerPatient: (data) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...data, role: "PATIENT" }),
    }),

  changePassword: (payload) =>
    apiRequest("/api/auth/change-password", { method: "POST", body: JSON.stringify(payload) }),

  adminCreateDoctorAuth: (doctorAuth) =>
    apiRequest("/api/auth/admin/create-doctor", {
      method: "POST",
      body: JSON.stringify(doctorAuth),
    }),
};