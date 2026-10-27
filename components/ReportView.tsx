import { Card } from "./ui";
import type { Assessment, Evidence, Project, ReviewDecision, Task } from "@/lib/types";
import { TASK_STATUS_LABELS } from "@/lib/types";
export default function ReportView({ project, tasks, evidence, assessments, decisions }: { project: Project; tasks: Task[]; evidence: Evidence[]; assessments: Assessment[]; decisions: ReviewDecision[] }) {
  return (
    <div className="space-y-4">
      <Card><h2 className="text-lg font-bold">Project report — {project.name}</h2><p className="text-sm text-slate-600">{project.description}</p><p className="mt-2 text-sm">Category: {project.category} · Status: {project.status} · Report generated: {new Date().toLocaleString()}</p><p className="text-sm text-slate-600">Limitations and disclaimer: AI findings below are advisory assessments of submitted images. They are not certifications of workmanship, safety, or legal compliance, and they do not prove when a photo was captured or that it is authentic. Human review decisions are shown separately and are the only acceptances.</p></Card>
      <Card><h3 className="font-semibold">Tasks</h3><ul className="mt-2 space-y-2">{tasks.map((t) => (<li key={t.id} className="text-sm"><strong>{t.title}</strong> — {TASK_STATUS_LABELS[t.status]} · {t.criteria.length} criteria · {evidence.filter((e) => e.task_id === t.id).length} evidence items</li>))}</ul></Card>
      <Card><h3 className="font-semibold">Evidence submitted</h3><ul className="mt-2 space-y-1">{evidence.map((e) => (<li key={e.id} className="text-sm">{e.stage} · {e.caption ?? "(no caption)"} · {e.mime_type} · uploaded {new Date(e.uploaded_at).toLocaleString()} (upload time, not proof of capture time)</li>))}</ul></Card>
      <Card><h3 className="font-semibold">AI assessment summaries</h3><ul className="mt-2 space-y-1">{assessments.map((a) => (<li key={a.id} className="text-sm">{a.overall_finding} · {a.model_provider}/{a.model_identifier} · {a.missing_evidence.join("; ") || "no missing evidence listed"}</li>))}</ul></Card>
      <Card><h3 className="font-semibold">Human review decisions</h3><ul className="mt-2 space-y-1">{decisions.map((d) => (<li key={d.id} className="text-sm">{d.decision}{d.comment ? ` — ${d.comment}` : ""} · {new Date(d.created_at).toLocaleString()}</li>))}</ul></Card>
    </div>
  );
}
