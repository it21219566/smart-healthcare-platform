"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { authService } from "@/services/authService";

export default function PasswordRotationGate({ onSuccess, notify }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedAuth = await authService.changePassword(form);
      localStorage.setItem("token", updatedAuth.token);
      localStorage.setItem("user", JSON.stringify(updatedAuth));
      notify("Password updated! Full account access unlocked.");
      onSuccess(updatedAuth);
    } catch (err) {
      notify("Password change failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-slate-900 border border-[#fed352]/60 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-2 text-[#fed352] font-bold text-base mb-2">
        <ShieldCheck className="w-5 h-5" /> Security Policy: Rotate Temporary Password
      </div>
      <p className="text-xs text-slate-300 mb-4">
        Your account was provisioned with a one-time password. Set a new strong password (min 8 chars, uppercase, lowercase, digit, symbol) to unlock the portal.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <input
          type="password"
          required
          placeholder="Current One-Time Password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
        />
        <input
          type="password"
          required
          placeholder="New Strong Password (e.g. Health@2026!)"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          className="w-full p-2.5 rounded bg-slate-800 border border-slate-700 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#fed352] text-[#1e2a5e] font-bold"
        >
          {loading ? "Updating..." : "Update Password & Unlock Account"}
        </button>
      </form>
    </main>
  );
}