"use client";

import { FileText } from "lucide-react";
import { patientService } from "@/services/patientService";

export default function MedicalReportsCard({ reports = [] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-base font-bold text-[#fed352] flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4" /> My Submitted Medical Reports
      </h2>
      <p className="text-[11px] text-slate-400 mb-3">
        Reports attached during appointment bookings appear here.
      </p>

      {reports.length === 0 ? (
        <p className="text-xs text-slate-500">No medical reports submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="p-2.5 rounded bg-slate-800/70 flex justify-between items-center text-xs"
            >
              <div>
                <p className="font-semibold text-white">{r.reportName}</p>
                <p className="text-slate-400">
                  {r.appointmentId ? `Appt #${r.appointmentId} • ` : ""}
                  {r.description}
                </p>
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
      )}
    </div>
  );
}