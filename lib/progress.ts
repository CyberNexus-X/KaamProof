import type { Task } from "./types";
// PRD §5.10: progress = accepted / total applicable * 100. Blocked and
// non-applicable tasks are excluded from the denominator, never counted as done.
// This is task-completion progress, NOT workmanship quality or financial completion.
export function taskProgress(tasks: Task[]): { accepted: number; applicable: number; blocked: number; percent: number } {
  const applicable = tasks.filter((t) => t.status !== "blocked");
  const accepted = applicable.filter((t) => t.status === "accepted_by_customer").length;
  const blocked = tasks.length - applicable.length;
  const percent = applicable.length === 0 ? 0 : Math.round((accepted / applicable.length) * 100);
  return { accepted, applicable: applicable.length, blocked, percent };
}
