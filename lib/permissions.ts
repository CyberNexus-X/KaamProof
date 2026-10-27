import type { ProjectMember, Role } from "./types";
export function getRole(members: ProjectMember[], userId: string): Role | null {
  return members.find((m) => m.user_id === userId && m.invitation_status === "accepted")?.role ?? null;
}
export function isMember(members: ProjectMember[], userId: string): boolean { return getRole(members, userId) !== null; }
export function isOwner(members: ProjectMember[], userId: string): boolean { return getRole(members, userId) === "owner"; }
export function canViewProject(members: ProjectMember[], userId: string): boolean { return isMember(members, userId); }
export function canEditProject(members: ProjectMember[], userId: string): boolean { return isOwner(members, userId); }
export function canInvite(members: ProjectMember[], userId: string): boolean { return isOwner(members, userId); }
export function canSubmitEvidence(members: ProjectMember[], userId: string): boolean {
  const r = getRole(members, userId); return r === "owner" || r === "provider";
}
export function canReview(members: ProjectMember[], userId: string): boolean {
  const r = getRole(members, userId); return r === "owner" || r === "reviewer";
}
export function canCloseProject(members: ProjectMember[], userId: string): boolean { return isOwner(members, userId); }
