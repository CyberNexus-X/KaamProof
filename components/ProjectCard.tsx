"use client";
import Link from "next/link";
import { Card, Badge } from "./ui";
import { PROJECT_STATUS_LABELS, type Project } from "@/lib/types";
export default function ProjectCard({ project, taskCount, accepted, percent }: { project: Project; taskCount: number; accepted: number; percent: number }) {
  return (
    <Link href={`/projects/${project.id}`} className="no-underline">
      <Card>
        <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{project.name}</h3><Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge></div>
        <p className="mt-1 text-sm text-slate-600">{project.description}</p>
        <p className="mt-3 text-sm">Task completion progress: <strong>{percent}%</strong> ({accepted} of {taskCount} applicable tasks accepted). This is task progress, not a quality score.</p>
        <p className="mt-1 text-xs text-slate-500">{project.category}{project.site_label ? ` · ${project.site_label}` : ""}</p>
      </Card>
    </Link>
  );
}
