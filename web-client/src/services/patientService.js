import { apiRequest, GATEWAY_URL } from "@/lib/api";

export const patientService = {
  getProfile: (userId) => apiRequest(`/api/patients/${userId}`),

  saveProfile: (profile) =>
    apiRequest("/api/patients/profile", { method: "POST", body: JSON.stringify(profile) }),

  getReports: (patientId) => apiRequest(`/api/patients/${patientId}/reports`),

  uploadReport: (patientId, file, description) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description || "Lab Report");
    return apiRequest(`/api/patients/${patientId}/reports`, {
      method: "POST",
      isMultipart: true,
      body: formData,
    });
  },

  getReportDownloadUrl: (reportId) => `${GATEWAY_URL}/api/patients/reports/${reportId}/download`,
};