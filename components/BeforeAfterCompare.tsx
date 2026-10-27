"use client";
import { useState } from "react";
import type { Evidence } from "@/lib/types";
export default function BeforeAfterCompare({ before, after }: { before?: Evidence | null; after?: Evidence | null }) {
  const [pos, setPos] = useState(50);
  if (!before?.image_url && !after?.image_url) return <p className="text-sm text-slate-500">No before/after photos yet. Upload a &ldquo;before&rdquo; photo and an &ldquo;after&rdquo; photo to compare them here.</p>;
  const beforeUrl = before?.image_url ?? after?.image_url ?? ""; const afterUrl = after?.image_url ?? before?.image_url ?? "";
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border" style={{ aspectRatio: "4 / 3" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterUrl} alt={after?.caption ?? "After photo"} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt={before?.caption ?? "Before photo"} className="h-full w-full object-cover" style={{ width: `${pos === 0 ? 100 : 10000 / pos}%`, maxWidth: "none" }} />
        </div>
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Before</span>
        <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">After</span>
      </div>
      <label className="mt-2 block text-sm">Drag to compare before / after<input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full" aria-label="Before and after comparison slider" /></label>
      <p className="text-xs text-slate-500">If the two photos show different angles, lighting or areas, direct comparison is unreliable — the AI assessment will say so rather than assume they match.</p>
    </div>
  );
}
