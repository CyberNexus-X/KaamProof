import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canCloseProject } from "@/lib/permissions";
import { makeEvent } from "@/lib/activity";
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canCloseProject(members, user.id)) return jsonError(403, "Only the project owner can close a project.");
  const updated = await store.updateProject(project.id, { status: "completed", closed_at: new Date().toISOString() });
  await store.addActivity(makeEvent(project.id, user.id, "project_closed", "project", project.id, {}));
  return Response.json({ project: updated });
}
