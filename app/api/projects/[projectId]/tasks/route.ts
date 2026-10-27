import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject, canEditProject } from "@/lib/permissions";
import { parseOrNull, taskSchema } from "@/lib/validation";
import { makeEvent } from "@/lib/activity";
import { randomUUID } from "crypto";
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  return Response.json({ tasks: await store.listTasks(project.id) });
}
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canEditProject(members, user.id)) return jsonError(403, "Only the project owner can create tasks.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(taskSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const now = new Date().toISOString();
  const task = { id: randomUUID(), project_id: project.id, title: parsed.data.title, description: parsed.data.description, status: "not_started" as const, assigned_to: parsed.data.assigned_to ?? null, due_date: parsed.data.due_date ?? null, current_version: 1, criteria: parsed.data.criteria, required_evidence: parsed.data.required_evidence ?? [], created_by: user.id, created_at: now, updated_at: now };
  await store.createTask(task);
  await store.addActivity(makeEvent(project.id, user.id, "task_created", "task", task.id, { title: task.title }));
  return Response.json({ task }, { status: 201 });
}
