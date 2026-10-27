"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, inputClass } from "@/components/ui";
export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  function submit(e: React.FormEvent) { e.preventDefault(); if (!email.includes("@") || !password) { setError("Enter a valid email and password."); return; } localStorage.setItem("kaamproof-demo-user", email); router.push("/dashboard"); }
  return <Card><h1 className="text-xl font-bold">Sign in</h1><p className="mt-1 text-sm text-slate-600">Demo mode: any email/password continues to the seeded demo project. Real Supabase Auth sign-in from this form is not yet wired — see README “Known limitations”.</p><form onSubmit={submit} className="mt-4 space-y-3"><Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass()} /></Field><Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass()} /></Field>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button type="submit">Sign in</Button></form><p className="mt-3 text-sm">No account? <a href="/register">Create account</a> · <a href="/login">Account recovery</a> is handled by your auth provider in real mode.</p></Card>;
}
