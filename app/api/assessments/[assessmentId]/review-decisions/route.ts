import { NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { getSessionUser, jsonError } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { parseOrNull, reviewDecisionSchema } from "@/lib/validation";
import { makeEvent } from "@/lib/activity";
import { randomUUID } from "crypto";
const NEXT_STATUS = { accepted: "accepted_by_customer", request_more_evidence: "needs_more_evidence", revision_requested: "revision_requested", rejected: "rejected_by_customer", disputed: "reviewed" } as const;
export async function POST(req: NextRequest, { params }: { params: { assessmentId: string } }) {
  const user = await getSessionUser(req); if (!user) return jsonError(401, "Sign in required.");
  const store = getStore(); const a = await store.getAssessment(params.assessmentId); if (!a) return jsonError(404, "Assessment not found.");
  const members = await store.getMembers(a.project_id); if (!canReview(members, user.id)) return jsonError(403, "Only the owner or a reviewer can record a review decision.");
  const body = await req.json().catch(() => null);
  const parsed = parseOrNull(reviewDecisionSchema, body); if (!parsed.ok) return jsonError(400, parsed.error);
  const decision = { id: randomUUID(), project_id: a.project_id, task_id: a.task_id, assessment_id: a.id, reviewer_id: user.id, decision: parsed.data.decision, comment: parsed.data.comment ?? null, created_at: new Date().toISOString() };
  await store.addReviewDecision(decision);
  await store.updateTask(a.task_id, { status: NEXT_STATUS[parsed.data.decision] });
  await store.addActivity(makeEvent(a.project_id, user.id, "review_decision", "review_decision", decision.id, { decision: decision.decision }));
  return Response.json({ decision }, { status: 201 });
}
