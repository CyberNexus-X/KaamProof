"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import ProjectCard from "@/components/ProjectCard";
import type { Project, Task } from "@/lib/types";
import { taskProgress } from "@/lib/progress";
export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/projects").then(async (r) => { if (!r.ok) throw new Error("Could not load projects"); const j = await r.json(); setProjects(j.projects); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const [progressById, setProgressById] = useState<Record<string, { percent: number; accepted: number; applicable: number }>>({});
  useEffect(() => { projects.forEach(async (p) => { const r = await fetch(`/api/projects/${p.id}`); if (!r.ok) return; const j = await r.json(); const pr = taskProgress(j.tasks as Task[]); setProgressById((prev) => ({ ...prev, [p.id]: pr })); }); }, [projects]);
  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Dashboard</h1><Link href="/projects/new"><Button>Create project</Button></Link></div>
      {projects.length === 0 ? (
        <Card><p>You don&apos;t have any projects yet. Create your first project to start documenting work.</p><Link href="/projects/new" className="mt-2 inline-block">Create a project →</Link></Card>
      ) : (
        <div className="space-y-3">{projects.map((p) => { const pr = progressById[p.id] ?? { percent: 0, accepted: 0, applicable: 0 }; return <ProjectCard key={p.id} project={p} taskCount={pr.applicable} accepted={pr.accepted} percent={pr.percent} />; })}</div>
      )}
      <Card><h2 className="font-semibold">Demo tip</h2><p className="text-sm text-slate-600">Open the Bedroom Painting project, run an AI assessment on its task (it will ask for more evidence), upload two more photos, run the assessment again, then record a review decision. That is the full PRD §22 demo.</p></Card>
    </div>
  );
}
