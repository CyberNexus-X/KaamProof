import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject, canEditProject } from "@/lib/permissions";
import { makeEvent } from "@/lib/activity";
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  const tasks = await store.listTasks(project.id); const activity = await store.listActivity(project.id);
  return Response.json({ project, members, tasks, activity });
}
export async function PATCH(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canEditProject(members, user.id)) return jsonError(403, "Only the project owner can edit this project.");
  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "description", "category", "site_label", "status"] as const;
  const patch: Record<string, unknown> = {}; for (const k of allowed) if (k in body) patch[k] = body[k];
  const updated = await store.updateProject(project.id, patch as never);
  await store.addActivity(makeEvent(project.id, user.id, "task_updated", "project", project.id, { fields: Object.keys(patch) }));
  return Response.json({ project: updated });
}
