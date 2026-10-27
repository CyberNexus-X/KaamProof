import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject } from "@/lib/permissions";
import { parseOrNull, commentSchema } from "@/lib/validation";
import { makeEvent } from "@/lib/activity";
import { randomUUID } from "crypto";
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  const taskId = new URL(req.url).searchParams.get("task_id") ?? undefined;
  return Response.json({ comments: await store.listComments(project.id, taskId) });
}
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(commentSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const comment = { id: randomUUID(), project_id: project.id, task_id: parsed.data.task_id ?? null, assessment_id: parsed.data.assessment_id ?? null, author_id: user.id, body: parsed.data.body, created_at: new Date().toISOString() };
  await store.addComment(comment);
  await store.addActivity(makeEvent(project.id, user.id, "comment_added", "comment", comment.id, {}));
  return Response.json({ comment }, { status: 201 });
}
