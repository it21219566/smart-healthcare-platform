"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StatusBanner from "@/components/layout/StatusBanner";
import PasswordRotationGate from "@/components/auth/PasswordRotationGate";
import PatientWorkspace from "@/components/patient/PatientWorkspace";
import DoctorWorkspace from "@/components/doctor/DoctorWorkspace";
import AdminWorkspace from "@/components/admin/AdminWorkspace";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(saved));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <Navbar user={user} onLogout={handleLogout} />
      <StatusBanner message={statusMsg} onClear={() => setStatusMsg("")} />

      {user.passwordChangeRequired ? (
        <PasswordRotationGate onSuccess={setUser} notify={setStatusMsg} />
      ) : (
        <main className="max-w-7xl mx-auto p-6">
          {user.role === "PATIENT" && <PatientWorkspace user={user} notify={setStatusMsg} />}
          {user.role === "DOCTOR" && <DoctorWorkspace user={user} notify={setStatusMsg} />}
          {user.role === "ADMIN" && <AdminWorkspace notify={setStatusMsg} />}
        </main>
      )}
    </div>
  );
}