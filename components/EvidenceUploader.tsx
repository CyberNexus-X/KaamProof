"use client";
import { useState } from "react";
import { Button, inputClass } from "./ui";
const MAX = 10 * 1024 * 1024;
export default function EvidenceUploader({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState(""); const [stage, setStage] = useState("after");
  const [progress, setProgress] = useState<number | null>(null); const [error, setError] = useState(""); const [ok, setOk] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setOk("");
    if (!file) { setError("Choose a photo first."); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) { setError("Only JPEG and PNG images are accepted."); return; }
    if (file.size > MAX) { setError("File is too large (max 10 MB)."); return; }
    setProgress(10);
    try {
      const image_url = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error("Could not read file")); r.readAsDataURL(file); });
      setProgress(60);
      const res = await fetch(`/api/tasks/${taskId}/evidence`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: caption || null, stage, mime_type: file.type, file_size_bytes: file.size, filename: file.name, image_url }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || `Upload failed (${res.status})`); }
      setProgress(100); setOk("Evidence submitted. You can now run an AI assessment."); setFile(null); setCaption(""); onDone();
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed — please retry. No duplicate was created if the error happened before submission."); setProgress(null); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">Photo (JPEG/PNG, max 10 MB)<input type="file" accept="image/jpeg,image/png" capture="environment" className={inputClass()} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <label className="block text-sm font-medium">Evidence stage
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass()}><option value="before">Before</option><option value="during">During</option><option value="after">After</option><option value="supporting">Supporting</option></select></label>
      <label className="block text-sm font-medium">Caption (optional)<input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass()} placeholder="e.g. North wall, after painting" /></label>
      {progress !== null && <p className="text-sm">Upload progress: {progress}%</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => setError("")}>Retry</button></p>}
      {ok && <p className="text-sm text-teal-800">{ok}</p>}
      <Button type="submit">Submit evidence</Button>
    </form>
  );
}
