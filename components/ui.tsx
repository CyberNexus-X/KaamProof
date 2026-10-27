import type { ReactNode } from "react";
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "amber" | "teal" | "red" }) {
  const tones: Record<string, string> = { slate: "bg-slate-100 text-slate-700", amber: "bg-amber-100 text-amber-800", teal: "bg-teal-100 text-teal-800", red: "bg-red-100 text-red-800" };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${props.className ?? ""}`}>{children}</button>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-1 block">{children}</span></label>;
}
export function inputClass() { return "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none"; }
