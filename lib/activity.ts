import type { ActivityEvent } from "./types";
export function makeEvent(project_id: string, actor_id: string | null, event_type: string, entity_type: string, entity_id: string, metadata: Record<string, unknown> = {}): ActivityEvent {
  return { id: `evt_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`, project_id, actor_id, event_type, entity_type, entity_id, metadata, created_at: new Date().toISOString() };
}
export const EVENT_LABELS: Record<string, string> = {
  project_created: "Project created", participant_invited: "Participant invited", participant_accepted: "Invitation accepted",
  task_created: "Task created", task_updated: "Task updated", criteria_changed: "Completion criteria changed",
  evidence_submitted: "Evidence submitted", assessment_completed: "AI assessment completed", assessment_failed: "AI assessment failed",
  review_decision: "Review decision recorded", task_accepted: "Task accepted", task_rejected: "Task rejected",
  project_closed: "Project closed", project_archived: "Project archived", comment_added: "Comment added",
};
