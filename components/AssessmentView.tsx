"use client";
import { Card, Badge } from "./ui";
import type { Assessment, Task } from "@/lib/types";
const LABELS: Record<string, string> = { supported: "Supported by evidence", not_supported: "Not visibly supported", potential_discrepancy: "Potential discrepancy — needs human review", insufficient_evidence: "Insufficient evidence", not_assessable: "Not assessable from images" };
export default function AssessmentView({ assessment, task }: { assessment: Assessment; task: Task }) {
  const byId = new Map(task.criteria.map((c) => [c.id, c.text]));
  return (
    <Card>
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">AI assessment (advisory)</h3><Badge tone={assessment.overall_finding === "supported" ? "teal" : assessment.overall_finding === "insufficient_evidence" ? "amber" : "slate"}>{LABELS[assessment.overall_finding] ?? assessment.overall_finding}</Badge></div>
      <p className="mt-1 text-sm text-slate-600">Model: {assessment.model_provider}/{assessment.model_identifier} · {assessment.created_at ? new Date(assessment.created_at).toLocaleString() : ""}</p>
      <p className="mt-1 text-sm text-slate-600">This is an advisory finding about the submitted images. It is <strong>not</strong> a certification, a safety check, or a customer acceptance. Only a human review decision can accept a task.</p>
      <ul className="mt-3 space-y-3">
        {assessment.criteria.map((c) => (
          <li key={c.criterion_id} className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-medium">{byId.get(c.criterion_id) ?? c.criterion_id}</p>
            <p className="text-sm"><Badge>{LABELS[c.finding] ?? c.finding}</Badge></p>
            <p className="mt-1 text-sm text-slate-700">{c.explanation}</p>
            {c.limitations.length > 0 && <p className="mt-1 text-xs text-slate-500">Limitations: {c.limitations.join(" ")}</p>}
          </li>
        ))}
      </ul>
      {assessment.missing_evidence.length > 0 && (<div className="mt-3"><p className="font-medium text-sm">Missing evidence</p><ul className="list-disc pl-5 text-sm">{assessment.missing_evidence.map((m, i) => <li key={i}>{m}</li>)}</ul></div>)}
      {assessment.limitations.length > 0 && (<div className="mt-3"><p className="font-medium text-sm">Limitations</p><ul className="list-disc pl-5 text-sm">{assessment.limitations.map((m, i) => <li key={i}>{m}</li>)}</ul></div>)}
      <p className="mt-3 text-sm">Suggested next action: <strong>{assessment.recommended_next_action}</strong></p>
    </Card>
  );
}
