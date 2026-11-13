"use client";
import { Stethoscope, LogOut } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  return (
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
        onClick={onLogout}
        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-xs font-semibold flex items-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </header>
  );
}