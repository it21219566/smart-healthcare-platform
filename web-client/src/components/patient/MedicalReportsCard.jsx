"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { patientService } from "@/services/patientService";

export default function MedicalReportsCard({ patientRecord, reports, onUploaded, notify }) {
  const [reportFile, setReportFile] = useState(null);
  const [reportDesc, setReportDesc] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!patientRecord || !reportFile) {
      notify("Save your profile and choose a PDF/Image file first.");
      return;
    }
    try {
      await patientService.uploadReport(patientRecord.id, reportFile, reportDesc);
      notify("Medical report uploaded successfully!");
      setReportFile(null);
      setReportDesc("");
      onUploaded();
    } catch (err) {
      notify("Upload failed: " + err.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4" /> Upload Medical Reports
      </h2>
      <form onSubmit={handleUpload} className="space-y-3 text-xs">
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
              href={patientService.getReportDownloadUrl(r.id)}
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
  );
}