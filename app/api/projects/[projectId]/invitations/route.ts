import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canInvite } from "@/lib/permissions";
import { parseOrNull, invitationSchema } from "@/lib/validation";
import { createInvitationToken, invitationExpiry } from "@/lib/invitations";
import { makeEvent } from "@/lib/activity";
import { randomUUID } from "crypto";
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const project = await store.getProject(params.projectId); if (!project) return jsonError(404, "Project not found.");
  const members = await store.getMembers(project.id); if (!canInvite(members, user.id)) return jsonError(403, "Only the project owner can invite participants.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(invitationSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const { token, tokenHash } = createInvitationToken();
  const inv = { id: randomUUID(), project_id: project.id, inviter_id: user.id, invitee_email: parsed.data.invitee_email, invitee_user_id: null, token_hash: tokenHash, expires_at: invitationExpiry(7), accepted_at: null, revoked_at: null };
  await store.createInvitation(inv);
  await store.addActivity(makeEvent(project.id, user.id, "participant_invited", "invitation", inv.id, { invitee_email: parsed.data.invitee_email }));
  // The raw token is returned once to the inviter so it can be shared out-of-band.
  // Only its hash is stored. In production, send it by email instead of returning it.
  return Response.json({ invitation: { id: inv.id, project_id: inv.project_id, invitee_email: inv.invitee_email, expires_at: inv.expires_at }, token }, { status: 201 });
}
