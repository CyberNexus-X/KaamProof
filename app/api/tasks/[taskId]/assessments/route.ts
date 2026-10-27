import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject, canSubmitEvidence } from "@/lib/permissions";
import { getAdapter } from "@/lib/ai/adapter";
import { makeEvent } from "@/lib/activity";
import { canTransitionTask } from "@/lib/types";
import { randomUUID } from "crypto";
export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const task = await store.getTask(params.taskId); if (!task) return jsonError(404, "Task not found.");
  const members = await store.getMembers(task.project_id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  return Response.json({ assessments: await store.listAssessments(task.id) });
}
export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const task = await store.getTask(params.taskId); if (!task) return jsonError(404, "Task not found.");
  const members = await store.getMembers(task.project_id); if (!canSubmitEvidence(members, user.id)) return jsonError(403, "Only the owner or provider can request an assessment.");
  const evidence = await store.listEvidence(task.id);
  const now = new Date().toISOString();
  try {
    const result = await getAdapter().assess({ task, criteria: task.criteria, evidence });
    const assessment = { id: randomUUID(), project_id: task.project_id, task_id: task.id, created_at: now, ...result };
    await store.addAssessment(assessment);
    if (canTransitionTask(task.status, "reviewed")) await store.updateTask(task.id, { status: "reviewed" });
    await store.addActivity(makeEvent(task.project_id, user.id, "assessment_completed", "assessment", assessment.id, { overall: assessment.overall_finding }));
    return Response.json({ assessment }, { status: 201 });
  } catch (e) {
    // A failed assessment must never be interpreted as approval (PRD §8.5).
    const failed = { id: randomUUID(), project_id: task.project_id, task_id: task.id, task_version_id: String(task.current_version), status: "failed" as const, overall_finding: "not_assessable" as const, model_provider: "none", model_identifier: "none", prompt_version: "kaamproof-assessment-v1", input_evidence_ids: evidence.map((x) => x.id), criteria: [], missing_evidence: [], limitations: ["The AI assessment could not be completed. Your evidence is preserved; please retry."], recommended_next_action: "retry_assessment", error_code: e instanceof Error ? e.message : "assessment_failed", created_at: now, completed_at: now };
    await store.addAssessment(failed);
    await store.addActivity(makeEvent(task.project_id, user.id, "assessment_failed", "assessment", failed.id, {}));
    return Response.json({ assessment: failed, error: "AI assessment unavailable — evidence is preserved, please retry." }, { status: 503 });
  }
}
