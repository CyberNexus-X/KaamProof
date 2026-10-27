"use client";
import Link from "next/link";
import { Card, Badge } from "./ui";
import { TASK_STATUS_LABELS, type Task } from "@/lib/types";
export default function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="no-underline">
      <Card>
        <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{task.title}</h3><Badge tone={task.status === "accepted_by_customer" ? "teal" : task.status === "needs_more_evidence" ? "amber" : "slate"}>{TASK_STATUS_LABELS[task.status]}</Badge></div>
        <p className="mt-1 text-sm text-slate-600">{task.description}</p>
        <p className="mt-2 text-sm text-slate-500">{task.criteria.length} completion {task.criteria.length === 1 ? "criterion" : "criteria"}</p>
      </Card>
    </Link>
  );
}
