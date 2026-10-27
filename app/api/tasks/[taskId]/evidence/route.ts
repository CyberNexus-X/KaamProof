import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject, canSubmitEvidence } from "@/lib/permissions";
import { parseOrNull, evidenceSchema } from "@/lib/validation";
import { makeEvent } from "@/lib/activity";
import { canTransitionTask } from "@/lib/types";
import { randomUUID } from "crypto";
export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const task = await store.getTask(params.taskId); if (!task) return jsonError(404, "Task not found.");
  const members = await store.getMembers(task.project_id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  return Response.json({ evidence: await store.listEvidence(task.id) });
}
export async function POST(req: NextRequest, { params }: { params: { taskId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const task = await store.getTask(params.taskId); if (!task) return jsonError(404, "Task not found.");
  const members = await store.getMembers(task.project_id); if (!canSubmitEvidence(members, user.id)) return jsonError(403, "Only the owner or provider can submit evidence.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(evidenceSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const now = new Date().toISOString();
  const evidence = { id: randomUUID(), project_id: task.project_id, task_id: task.id, uploader_id: user.id, storage_path: `evidence/${task.project_id}/${task.id}/${randomUUID()}`, mime_type: parsed.data.mime_type, file_size_bytes: parsed.data.file_size_bytes, caption: parsed.data.caption ?? null, stage: parsed.data.stage, user_claimed_capture_at: parsed.data.user_claimed_capture_at ?? null, uploaded_at: now, processing_status: "ready", image_url: parsed.data.image_url ?? null };
  await store.addEvidence(evidence);
  if (canTransitionTask(task.status, "submitted_for_review")) await store.updateTask(task.id, { status: "submitted_for_review" });
  await store.addActivity(makeEvent(task.project_id, user.id, "evidence_submitted", "evidence", evidence.id, { stage: evidence.stage }));
  return Response.json({ evidence }, { status: 201 });
}
