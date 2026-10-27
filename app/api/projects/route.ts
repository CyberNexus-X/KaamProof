import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { parseOrNull, projectSchema } from "@/lib/validation";
import { makeEvent } from "@/lib/activity";
import { randomUUID } from "crypto";
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const projects = await store.listProjects(user.id);
  return Response.json({ projects });
}
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(projectSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const now = new Date().toISOString();
  const project = { id: randomUUID(), owner_id: user.id, name: parsed.data.name, description: parsed.data.description, category: parsed.data.category, site_label: parsed.data.site_label ?? null, planned_start_date: parsed.data.planned_start_date ?? null, expected_completion_date: parsed.data.expected_completion_date ?? null, status: "draft" as const, currency: parsed.data.currency ?? "INR", created_at: now, updated_at: now, closed_at: null };
  const store = getStore(); await store.createProject(project, user.id);
  await store.addActivity(makeEvent(project.id, user.id, "project_created", "project", project.id, { name: project.name }));
  return Response.json({ project }, { status: 201 });
}
