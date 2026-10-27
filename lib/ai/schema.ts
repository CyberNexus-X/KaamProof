import { z } from "zod";
// PRD §5.7 / §8.4 structured output. No confidence numbers are invented, and
// prohibited conclusions (fraud, authenticity, safety, certification, payment owed)
// are rejected at validation time, not merely discouraged in a prompt.
export const PROHIBITED_PHRASES = ["fraud", "certified", "legally compliant", "payment is owed", "authentic photograph", "structurally safe", "intentionally deceived"];
export const criterionResultSchema = z.object({
  criterion_id: z.string().min(1),
  finding: z.enum(["supported_by_evidence", "not_visibly_supported", "potential_discrepancy", "insufficient_evidence", "not_assessable"]),
  explanation: z.string().min(1).max(2000),
  evidence_ids: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});
export const assessmentSchema = z.object({
  overall_status: z.enum(["supported", "not_supported", "potential_discrepancy", "insufficient_evidence", "not_assessable"]),
  criteria: z.array(criterionResultSchema).min(1),
  missing_evidence: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommended_next_action: z.string().min(1).max(500),
});
export type AssessmentOutput = z.infer<typeof assessmentSchema>;
export function validateAssessment(data: unknown): { ok: true; data: AssessmentOutput } | { ok: false; error: string } {
  const r = assessmentSchema.safeParse(data);
  if (!r.success) return { ok: false, error: `Malformed assessment: ${r.error.issues.map((i) => i.message).join("; ")}` };
  const text = JSON.stringify(r.data).toLowerCase();
  const hit = PROHIBITED_PHRASES.find((p) => text.includes(p));
  if (hit) return { ok: false, error: `Assessment contains a prohibited conclusion (${hit}); rejected.` };
  return { ok: true, data: r.data };
}
