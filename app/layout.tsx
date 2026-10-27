import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
export const metadata = { title: "KaamProof — Evidence-first work verification", description: "Know what was agreed. See the evidence. Track what is done." };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en"><body>
      <header className="border-b bg-white"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold no-underline">KaamProof</Link>
        <nav className="flex gap-4 text-sm"><Link href="/dashboard">Dashboard</Link><Link href="/projects/new">Create project</Link><Link href="/login">Sign in</Link></nav>
      </div></header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-8 text-xs text-slate-500">KaamProof helps verify evidence of work. It does not guarantee workmanship, certify legal compliance, or prove a photograph is authentic. Safety-critical work needs a qualified inspection.</footer>
    </body></html>
  );
}
