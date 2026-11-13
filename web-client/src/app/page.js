"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Stethoscope, UserPlus, LogIn } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { ...form, role: "PATIENT" };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#1e2a5e]/80 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#fed352] text-[#1e2a5e]">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              SmartHealth<span className="text-[#fed352]">.lk</span>
            </h1>
            <p className="text-xs text-slate-300">
              Cloud-Native Telemedicine & Channeling
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/70 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`py-2 text-sm font-semibold rounded-lg transition ${
              isLogin
                ? "bg-[#fed352] text-[#1e2a5e]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`py-2 text-sm font-semibold rounded-lg transition ${
              !isLogin
                ? "bg-[#fed352] text-[#1e2a5e]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Patient Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Patient Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Nimal Silva"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#fed352]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#fed352]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder={isLogin ? "••••••••" : "Min 8 chars, Upper, Lower, Digit & Symbol"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#fed352]"
            />
          </div>

          {!isLogin && (
            <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              Public registration is strictly for <strong>Patients</strong>. Doctors are provisioned by the Platform Administrator.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#fed352] hover:bg-yellow-400 text-[#1e2a5e] font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Processing..." : isLogin ? "Sign In to Portal" : "Register as Patient"}
          </button>
        </form>
      </div>
    </div>
  );
}