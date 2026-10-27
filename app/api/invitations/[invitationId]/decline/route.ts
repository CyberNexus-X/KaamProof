import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
export async function POST(req: NextRequest, { params }: { params: { invitationId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const inv = await store.getInvitation(params.invitationId); if (!inv) return jsonError(404, "Invitation not found.");
  // Decline is recorded as a no-access outcome; the invitation token itself is
  // single-use by design and must not be reused after a decision.
  return Response.json({ ok: true, declined: true, project_id: inv.project_id });
}
