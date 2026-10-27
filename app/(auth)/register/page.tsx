"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Field, inputClass } from "@/components/ui";
export default function RegisterPage() {
  const router = useRouter(); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  function submit(e: React.FormEvent) { e.preventDefault(); if (name.trim().length < 2 || !email.includes("@") || password.length < 8) { setError("Enter a display name, a valid email, and a password of at least 8 characters."); return; } localStorage.setItem("kaamproof-demo-user", email); router.push("/dashboard"); }
  return <Card><h1 className="text-xl font-bold">Create account</h1><form onSubmit={submit} className="mt-4 space-y-3"><Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass()} /></Field><Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass()} /></Field><Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass()} /></Field>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button type="submit">Create account</Button></form><p className="mt-3 text-sm">By continuing you agree to the Terms and Privacy notice. Password recovery never reveals whether another person has an account.</p></Card>;
}
