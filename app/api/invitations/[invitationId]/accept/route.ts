import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { isInvitationExpired } from "@/lib/invitations";
import { makeEvent } from "@/lib/activity";
export async function POST(req: NextRequest, { params }: { params: { invitationId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const inv = await store.getInvitation(params.invitationId); if (!inv) return jsonError(404, "Invitation not found.");
  if (inv.revoked_at) return jsonError(409, "This invitation was revoked.");
  if (isInvitationExpired(inv.expires_at)) return jsonError(409, "This invitation has expired.");
  await store.acceptInvitation(inv.id, user.id);
  await store.addActivity(makeEvent(inv.project_id, user.id, "participant_accepted", "invitation", inv.id, {}));
  return Response.json({ ok: true, project_id: inv.project_id });
}
