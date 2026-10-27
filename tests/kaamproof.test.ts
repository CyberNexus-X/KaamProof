import { describe, it, expect } from "vitest";
import { taskProgress } from "../lib/progress";
import { canTransitionTask, type Task } from "../lib/types";
import { canViewProject, canEditProject, canSubmitEvidence, canReview } from "../lib/permissions";
import { isInvitationExpired, createInvitationToken, hashToken } from "../lib/invitations";
import { validateAssessment } from "../lib/ai/schema";
import { parseOrNull, evidenceSchema, taskSchema } from "../lib/validation";
import { createDemoStore } from "../lib/store";
import { MockAdapter } from "../lib/ai/adapter";

const members = [
  { id: "m1", project_id: "p", user_id: "owner", role: "owner" as const, invitation_status: "accepted", joined_at: null },
  { id: "m2", project_id: "p", user_id: "prov", role: "provider" as const, invitation_status: "accepted", joined_at: null },
];
const t = (status: string): Task => ({ id: "t", project_id: "p", title: "x", description: "y", status: status as never, criteria: [], required_evidence: [], current_version: 1, created_by: "owner", created_at: "", updated_at: "" });

describe("progress", () => {
  it("accepted/total*100, blocked excluded", () => {
    expect(taskProgress([t("accepted_by_customer"), t("in_progress"), t("blocked")])).toEqual({ accepted: 1, applicable: 2, blocked: 1, percent: 50 });
  });
  it("empty project is 0%", () => { expect(taskProgress([]).percent).toBe(0); });
});
describe("task transitions", () => {
  it("allows submitted -> reviewed, blocks accepted -> in_progress (AI/human acceptance is terminal)", () => {
    expect(canTransitionTask("submitted_for_review", "reviewed")).toBe(true);
    expect(canTransitionTask("accepted_by_customer", "in_progress")).toBe(false);
  });
});
describe("permissions", () => {
  it("owner edits, provider submits but cannot edit, outsider cannot view", () => {
    expect(canEditProject(members, "owner")).toBe(true); expect(canEditProject(members, "prov")).toBe(false);
    expect(canSubmitEvidence(members, "prov")).toBe(true); expect(canReview(members, "prov")).toBe(false);
    expect(canViewProject(members, "stranger")).toBe(false);
  });
});
describe("invitations", () => {
  it("expiry is honoured and tokens are hashed, not stored raw", () => {
    expect(isInvitationExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(isInvitationExpired(new Date(Date.now() + 3600000).toISOString())).toBe(false);
    const { token, tokenHash } = createInvitationToken(); expect(tokenHash).toBe(hashToken(token)); expect(tokenHash).not.toBe(token);
  });
});
describe("assessment schema", () => {
  it("accepts a valid assessment", () => {
    expect(validateAssessment({ overall_status: "insufficient_evidence", criteria: [{ criterion_id: "c1", finding: "insufficient_evidence", explanation: "Not visible.", evidence_ids: [], limitations: [] }], missing_evidence: ["More photos"], limitations: [], recommended_next_action: "request_more_evidence" }).ok).toBe(true);
  });
  it("rejects malformed output and prohibited fraud/certification claims", () => {
    expect(validateAssessment({ overall_status: "supported", criteria: [] }).ok).toBe(false);
    expect(validateAssessment({ overall_status: "supported", criteria: [{ criterion_id: "c1", finding: "supported_by_evidence", explanation: "This contractor committed fraud.", evidence_ids: [], limitations: [] }], recommended_next_action: "x" }).ok).toBe(false);
  });
});
describe("input validation", () => {
  it("rejects non-JPEG/PNG and oversized evidence, and tasks without criteria", () => {
    expect(parseOrNull(evidenceSchema, { stage: "after", mime_type: "image/gif", file_size_bytes: 100 }).ok).toBe(false);
    expect(parseOrNull(evidenceSchema, { stage: "after", mime_type: "image/jpeg", file_size_bytes: 99 * 1024 * 1024 }).ok).toBe(false);
    expect(parseOrNull(taskSchema, { title: "Paint", description: "Paint walls", criteria: [] }).ok).toBe(false);
  });
});
describe("demo store + mock adapter (PRD §22)", () => {
  it("seeds the bedroom painting project and the mock finds insufficient evidence with 2 photos", async () => {
    const store = createDemoStore(); const projects = await store.listProjects("demo-user-owner");
    expect(projects[0].name).toContain("Bedroom Painting");
    const tasks = await store.listTasks(projects[0].id); const ev = await store.listEvidence(tasks[0].id);
    expect(ev.length).toBe(2);
    const result = await new MockAdapter().assess({ task: tasks[0], criteria: tasks[0].criteria, evidence: ev });
    expect(result.overall_finding).toBe("insufficient_evidence"); expect(result.missing_evidence.length).toBeGreaterThan(0);
  });
});
