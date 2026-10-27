import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canViewProject } from "@/lib/permissions";
export async function GET(req: NextRequest, { params }: { params: { assessmentId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const a = await store.getAssessment(params.assessmentId); if (!a) return jsonError(404, "Assessment not found.");
  const members = await store.getMembers(a.project_id); if (!canViewProject(members, user.id)) return jsonError(403, "You are not a participant in this project.");
  return Response.json({ assessment: a });
}
