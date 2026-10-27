import { z } from "zod";
export const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  category: z.string().trim().min(2).max(80),
  site_label: z.string().max(200).optional().nullable(),
  planned_start_date: z.string().optional().nullable(),
  expected_completion_date: z.string().optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
});
export const taskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(4000),
  criteria: z.array(z.object({ id: z.string().min(1), text: z.string().trim().min(3).max(500), assessable_from_images: z.boolean() })).min(1).max(20),
  required_evidence: z.array(z.string().max(200)).max(20).default([]),
  assigned_to: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
});
export const evidenceSchema = z.object({
  caption: z.string().max(500).optional().nullable(),
  stage: z.enum(["before", "during", "after", "supporting"]),
  mime_type: z.enum(["image/jpeg", "image/png"]),
  file_size_bytes: z.number().int().positive().max(10 * 1024 * 1024),
  filename: z.string().max(200).optional(),
  image_url: z.string().max(2000).optional().nullable(),
  user_claimed_capture_at: z.string().optional().nullable(),
});
export const invitationSchema = z.object({ invitee_email: z.string().email().max(200) });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000), task_id: z.string().optional().nullable(), assessment_id: z.string().optional().nullable() });
export const reviewDecisionSchema = z.object({
  decision: z.enum(["accepted", "request_more_evidence", "revision_requested", "rejected", "disputed"]),
  comment: z.string().max(2000).optional().nullable(),
  assessment_id: z.string().optional().nullable(),
});
export const registerSchema = z.object({ display_name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(128) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export function parseOrNull<T>(schema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}
