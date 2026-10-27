// PRD §5.2 / §5.4 statuses — descriptive labels only, never a bare "Verified".
export const PROJECT_STATUSES = ["draft", "active", "awaiting_review", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const TASK_STATUSES = [
  "not_started", "in_progress", "submitted_for_review", "needs_more_evidence",
  "revision_requested", "reviewed", "accepted_by_customer", "rejected_by_customer", "blocked",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Role = "owner" | "provider" | "reviewer";
export type EvidenceStage = "before" | "during" | "after" | "supporting";
export type AssessmentOverall = "supported" | "not_supported" | "potential_discrepancy" | "insufficient_evidence" | "not_assessable";
export type CriterionFinding = "supported_by_evidence" | "not_visibly_supported" | "potential_discrepancy" | "insufficient_evidence" | "not_assessable";
export type ReviewDecisionValue = "accepted" | "request_more_evidence" | "revision_requested" | "rejected" | "disputed";
export type AssessmentStatus = "queued" | "processing" | "completed" | "failed";

export interface Profile { id: string; display_name: string; business_name?: string | null; avatar_path?: string | null; }
export interface Project {
  id: string; owner_id: string; name: string; description: string; category: string;
  site_label?: string | null; planned_start_date?: string | null; expected_completion_date?: string | null;
  status: ProjectStatus; currency?: string | null; created_at: string; updated_at: string; closed_at?: string | null;
}
export interface ProjectMember { id: string; project_id: string; user_id: string; role: Role; invitation_status: string; joined_at?: string | null; }
export interface Invitation {
  id: string; project_id: string; inviter_id: string; invitee_email?: string | null; invitee_user_id?: string | null;
  token_hash: string; expires_at: string; accepted_at?: string | null; revoked_at?: string | null;
}
export interface Criterion { id: string; text: string; assessable_from_images: boolean }
export interface Task {
  id: string; project_id: string; title: string; description: string; status: TaskStatus;
  assigned_to?: string | null; due_date?: string | null; current_version: number;
  criteria: Criterion[]; required_evidence: string[]; created_by: string; created_at: string; updated_at: string;
}
export interface Evidence {
  id: string; project_id: string; task_id: string; uploader_id: string; storage_path: string;
  mime_type: string; file_size_bytes: number; caption?: string | null; stage: EvidenceStage;
  user_claimed_capture_at?: string | null; uploaded_at: string; processing_status: string;
  image_url?: string | null; // demo-only preview; in Supabase mode this is a short-lived signed URL, never a public URL
}
export interface AssessmentCriterionResult {
  criterion_id: string; finding: CriterionFinding; explanation: string; evidence_ids: string[]; limitations: string[];
}
export interface Assessment {
  id: string; project_id: string; task_id: string; task_version_id?: string | null; status: AssessmentStatus;
  overall_finding: AssessmentOverall; model_provider: string; model_identifier: string; prompt_version: string;
  input_evidence_ids: string[]; criteria: AssessmentCriterionResult[]; missing_evidence: string[];
  limitations: string[]; recommended_next_action: string; error_code?: string | null;
  created_at: string; completed_at?: string | null;
}
export interface ReviewDecision {
  id: string; project_id: string; task_id: string; assessment_id?: string | null; reviewer_id: string;
  decision: ReviewDecisionValue; comment?: string | null; created_at: string;
}
export interface Comment { id: string; project_id: string; task_id?: string | null; assessment_id?: string | null; author_id: string; body: string; created_at: string; }
export interface ActivityEvent {
  id: string; project_id: string; actor_id?: string | null; event_type: string; entity_type: string;
  entity_id: string; metadata: Record<string, unknown>; created_at: string;
}
export interface Notification { id: string; recipient_id: string; project_id?: string | null; event_type: string; payload: Record<string, unknown>; read_at?: string | null; created_at: string; }

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started", in_progress: "In progress", submitted_for_review: "Submitted for review",
  needs_more_evidence: "Needs more evidence", revision_requested: "Revision requested", reviewed: "Reviewed",
  accepted_by_customer: "Accepted by customer", rejected_by_customer: "Rejected by customer", blocked: "Blocked",
};
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft", active: "Active", awaiting_review: "Awaiting review", completed: "Completed", archived: "Archived",
};
// Allowed task transitions (PRD §5.4/§5.8). Human acceptance is never set by AI.
export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  not_started: ["in_progress", "blocked"],
  in_progress: ["submitted_for_review", "blocked", "not_started"],
  submitted_for_review: ["needs_more_evidence", "revision_requested", "reviewed", "blocked"],
  needs_more_evidence: ["in_progress", "submitted_for_review"],
  revision_requested: ["in_progress", "submitted_for_review"],
  reviewed: ["accepted_by_customer", "rejected_by_customer", "needs_more_evidence", "revision_requested"],
  accepted_by_customer: [],
  rejected_by_customer: ["in_progress", "submitted_for_review"],
  blocked: ["not_started", "in_progress"],
};
export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}
