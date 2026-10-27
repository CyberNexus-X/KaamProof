import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject, canEditProject } from "@/lib/permissions";
import { canTransitionTask } from "@/lib/types";
import { makeEvent } from "@/lib/activity";
async function load(req: NextRequest, taskId: string) {
  const user = await getSessionUser(req); if (!user) return { err: jsonError(401, "Sign in required.") } as const;
  const store = getStore(); const task = await store.getTask(taskId); if (!task) return { err: jsonError(404, "Task not found.") } as const;
  const members = await store.getMembers(task.project_id); if (!canViewProject(members, user.id)) return { err: jsonError(403, "You are not a participant in this project.") } as const;
  return { user, store, task, members } as const;
}
export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const l = await load(req, params.taskId); if ("err" in l) return l.err;
  const evidence = await l.store.listEvidence(l.task.id); const assessments = await l.store.listAssessments(l.task.id);
  const decisions = await l.store.listReviewDecisions(l.task.id); const comments = await l.store.listComments(l.task.project_id, l.task.id);
  return Response.json({ task: l.task, evidence, assessments, decisions, comments });
}
export async function PATCH(req: NextRequest, { params }: { params: { taskId: string } }) {
  const l = await load(req, params.taskId); if ("err" in l) return l.err;
  if (!canEditProject(l.members, l.user.id)) return jsonError(403, "Only the project owner can edit tasks.");
  const body = await req.json().catch(() => ({}));
  if (body.status && !canTransitionTask(l.task.status, body.status)) return jsonError(409, `Cannot move a task from ${l.task.status} to ${body.status}.`);
  const updated = await l.store.updateTask(l.task.id, { status: body.status ?? l.task.status, title: body.title ?? l.task.title, description: body.description ?? l.task.description });
  await l.store.addActivity(makeEvent(l.task.project_id, l.user.id, "task_updated", "task", l.task.id, { status: body.status ?? l.task.status }));
  return Response.json({ task: updated });
}
