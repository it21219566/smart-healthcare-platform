"use client";

export default function StatusBanner({ message, onClear }) {
  if (!message) return null;
  return (
    <div className="max-w-7xl mx-auto mt-4 px-6">
      <div className="p-3 rounded-lg bg-[#1e2a5e] border border-[#fed352] text-[#fed352] text-sm flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClear} className="text-xs underline">
          Dismiss
        </button>
      </div>
    </div>
  );
}