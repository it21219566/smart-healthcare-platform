import { apiRequest, GATEWAY_URL } from "@/lib/api";

export const patientService = {
  getProfile: (userId) => apiRequest(`/api/patients/${userId}`),

  saveProfile: (profile) =>
    apiRequest("/api/patients/profile", { method: "POST", body: JSON.stringify(profile) }),

  getReports: (patientId) => apiRequest(`/api/patients/${patientId}/reports`),

  getReportsByAppointment: (appointmentId) =>
    apiRequest(`/api/patients/reports/appointment/${appointmentId}`),

  uploadReport: (patientId, file, description, appointmentId = null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description || "Pre-Consultation Report");
    if (appointmentId) {
      formData.append("appointmentId", String(appointmentId));
    }
    return apiRequest(`/api/patients/${patientId}/reports`, {
      method: "POST",
      isMultipart: true,
      body: formData,
    });
  },

  getReportDownloadUrl: (reportId) => `${GATEWAY_URL}/api/patients/reports/${reportId}/download`,
};