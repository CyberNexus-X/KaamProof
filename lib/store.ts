import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEvent, Assessment, Comment, Evidence, Invitation, Project, ProjectMember, ReviewDecision, Task } from "./types";
import { makeEvent } from "./activity";

// Demo users (demo mode only — no real credentials)
export const DEMO_OWNER = "demo-user-owner";
export const DEMO_PROVIDER = "demo-user-provider";
export const DEMO_REVIEWER = "demo-user-reviewer";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface Store {
  listProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  getMembers(projectId: string): Promise<ProjectMember[]>;
  createProject(p: Project, ownerId: string): Promise<Project>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project | null>;
  createTask(t: Task): Promise<Task>;
  listTasks(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  updateTask(id: string, patch: Partial<Task>): Promise<Task | null>;
  addEvidence(e: Evidence): Promise<Evidence>;
  listEvidence(taskId: string): Promise<Evidence[]>;
  addAssessment(a: Assessment): Promise<Assessment>;
  listAssessments(taskId: string): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | null>;
  addReviewDecision(d: ReviewDecision): Promise<ReviewDecision>;
  listReviewDecisions(taskId: string): Promise<ReviewDecision[]>;
  addComment(c: Comment): Promise<Comment>;
  listComments(projectId: string, taskId?: string): Promise<Comment[]>;
  addActivity(e: ActivityEvent): Promise<void>;
  listActivity(projectId: string): Promise<ActivityEvent[]>;
  createInvitation(inv: Invitation): Promise<Invitation>;
  getInvitation(id: string): Promise<Invitation | null>;
  acceptInvitation(id: string, userId: string): Promise<void>;
}

// ---- In-memory demo store, seeded with PRD §22 Bedroom Painting demo ----
function seed(): { projects: Project[]; members: ProjectMember[]; tasks: Task[]; evidence: Evidence[]; assessments: Assessment[]; decisions: ReviewDecision[]; comments: Comment[]; activity: ActivityEvent[]; invitations: Invitation[] } {
  const now = new Date().toISOString();
  const project: Project = { id: "demo-bedroom-painting", owner_id: DEMO_OWNER, name: "Bedroom Painting — Home Renovation", description: "Paint the bedroom walls in the agreed colour, with inspection photos of every wall and corner.", category: "Painting", site_label: "Bedroom, Home", status: "active", currency: "INR", created_at: now, updated_at: now };
  const task: Task = {
    id: "demo-task-paint-walls", project_id: project.id, title: "Paint the bedroom walls", status: "submitted_for_review",
    description: "Paint all agreed bedroom wall surfaces in the agreed colour.", assigned_to: DEMO_PROVIDER, current_version: 1,
    criteria: [
      { id: "criterion_1", text: "The agreed wall surfaces have been painted.", assessable_from_images: true },
      { id: "criterion_2", text: "No clearly visible unpainted areas remain in the submitted inspection views.", assessable_from_images: true },
      { id: "criterion_3", text: "The agreed paint colour is used, where it can be reasonably assessed from the available references and photographs.", assessable_from_images: true },
      { id: "criterion_4", text: "Required inspection views (all walls and corners) are submitted.", assessable_from_images: true },
    ],
    required_evidence: ["Photo of each wall", "Photo of each corner"], created_by: DEMO_OWNER, created_at: now, updated_at: now,
  };
  const evidence: Evidence[] = [
    { id: "evidence_1", project_id: project.id, task_id: task.id, uploader_id: DEMO_PROVIDER, storage_path: "demo/evidence_1", mime_type: "image/jpeg", file_size_bytes: 120000, caption: "North wall, painted", stage: "after", uploaded_at: now, processing_status: "ready", image_url: "https://picsum.photos/seed/kaamproof-wall1/800/600" },
    { id: "evidence_2", project_id: project.id, task_id: task.id, uploader_id: DEMO_PROVIDER, storage_path: "demo/evidence_2", mime_type: "image/jpeg", file_size_bytes: 135000, caption: "East wall, painted", stage: "after", uploaded_at: now, processing_status: "ready", image_url: "https://picsum.photos/seed/kaamproof-wall2/800/600" },
  ];
  return {
    projects: [project],
    members: [
      { id: "m1", project_id: project.id, user_id: DEMO_OWNER, role: "owner", invitation_status: "accepted", joined_at: now },
      { id: "m2", project_id: project.id, user_id: DEMO_PROVIDER, role: "provider", invitation_status: "accepted", joined_at: now },
    ],
    tasks: [task], evidence, assessments: [], decisions: [], comments: [],
    activity: [
      makeEvent(project.id, DEMO_OWNER, "project_created", "project", project.id, { name: project.name }),
      makeEvent(project.id, DEMO_OWNER, "task_created", "task", task.id, { title: task.title }),
      makeEvent(project.id, DEMO_PROVIDER, "evidence_submitted", "evidence", "evidence_1", {}),
      makeEvent(project.id, DEMO_PROVIDER, "evidence_submitted", "evidence", "evidence_2", {}),
    ],
    invitations: [],
  };
}

class DemoStore implements Store {
  private s = seed();
  async listProjects(userId: string) { return this.s.projects.filter((p) => this.s.members.some((m) => m.project_id === p.id && m.user_id === userId)); }
  async getProject(id: string) { return this.s.projects.find((p) => p.id === id) ?? null; }
  async getMembers(projectId: string) { return this.s.members.filter((m) => m.project_id === projectId); }
  async createProject(p: Project, ownerId: string) { this.s.projects.push(p); this.s.members.push({ id: `m_${Date.now()}`, project_id: p.id, user_id: ownerId, role: "owner", invitation_status: "accepted", joined_at: new Date().toISOString() }); return p; }
  async updateProject(id: string, patch: Partial<Project>) { const p = this.s.projects.find((x) => x.id === id); if (!p) return null; Object.assign(p, patch, { updated_at: new Date().toISOString() }); return p; }
  async createTask(t: Task) { this.s.tasks.push(t); return t; }
  async listTasks(projectId: string) { return this.s.tasks.filter((t) => t.project_id === projectId); }
  async getTask(id: string) { return this.s.tasks.find((t) => t.id === id) ?? null; }
  async updateTask(id: string, patch: Partial<Task>) { const t = this.s.tasks.find((x) => x.id === id); if (!t) return null; Object.assign(t, patch, { updated_at: new Date().toISOString() }); return t; }
  async addEvidence(e: Evidence) { this.s.evidence.push(e); return e; }
  async listEvidence(taskId: string) { return this.s.evidence.filter((e) => e.task_id === taskId); }
  async addAssessment(a: Assessment) { this.s.assessments.push(a); return a; }
  async listAssessments(taskId: string) { return this.s.assessments.filter((a) => a.task_id === taskId); }
  async getAssessment(id: string) { return this.s.assessments.find((a) => a.id === id) ?? null; }
  async addReviewDecision(d: ReviewDecision) { this.s.decisions.push(d); return d; }
  async listReviewDecisions(taskId: string) { return this.s.decisions.filter((d) => d.task_id === taskId); }
  async addComment(c: Comment) { this.s.comments.push(c); return c; }
  async listComments(projectId: string, taskId?: string) { return this.s.comments.filter((c) => c.project_id === projectId && (!taskId || c.task_id === taskId)); }
  async addActivity(e: ActivityEvent) { this.s.activity.unshift(e); }
  async listActivity(projectId: string) { return this.s.activity.filter((a) => a.project_id === projectId); }
  async createInvitation(inv: Invitation) { this.s.invitations.push(inv); return inv; }
  async getInvitation(id: string) { return this.s.invitations.find((i) => i.id === id) ?? null; }
  async acceptInvitation(id: string, userId: string) { const inv = this.s.invitations.find((i) => i.id === id); if (inv) { inv.accepted_at = new Date().toISOString(); this.s.members.push({ id: `m_${Date.now()}`, project_id: inv.project_id, user_id: userId, role: "provider", invitation_status: "accepted", joined_at: new Date().toISOString() }); } }
}
export function createDemoStore(): Store { return new DemoStore(); }

// ---- Supabase store (used only when Supabase env is configured) ----
// Tables match supabase/migrations/001_init.sql. Evidence files live in the
// private `evidence` bucket; only metadata + short-lived signed URLs are used.
class SupabaseStore implements Store {
  constructor(private db: SupabaseClient) {}
  private async rows<T>(q: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> { const { data, error } = await q; if (error) throw new Error(String(error)); return data ?? []; }
  async listProjects(userId: string) { const members = await this.rows<ProjectMember>(this.db.from("project_members").select("*").eq("user_id", userId).eq("invitation_status", "accepted")); const ids = members.map((m) => m.project_id); if (!ids.length) return []; return this.rows<Project>(this.db.from("projects").select("*").in("id", ids)); }
  async getProject(id: string) { const { data } = await this.db.from("projects").select("*").eq("id", id).single(); return data as Project | null; }
  async getMembers(projectId: string) { return this.rows<ProjectMember>(this.db.from("project_members").select("*").eq("project_id", projectId)); }
  async createProject(p: Project, ownerId: string) { const { error } = await this.db.from("projects").insert(p); if (error) throw new Error(String(error)); await this.db.from("project_members").insert({ project_id: p.id, user_id: ownerId, role: "owner", invitation_status: "accepted" }); return p; }
  async updateProject(id: string, patch: Partial<Project>) { const { data, error } = await this.db.from("projects").update(patch).eq("id", id).select().single(); if (error) throw new Error(String(error)); return data as Project; }
  async createTask(t: Task) { const { error } = await this.db.from("tasks").insert({ id: t.id, project_id: t.project_id, title: t.title, description: t.description, status: t.status, assigned_to: t.assigned_to, due_date: t.due_date, current_version: t.current_version, created_by: t.created_by }); if (error) throw new Error(String(error)); await this.db.from("task_versions").insert({ task_id: t.id, version_number: 1, title: t.title, description: t.description, completion_criteria: t.criteria, required_evidence: t.required_evidence, created_by: t.created_by }); return t; }
  async listTasks(projectId: string) { const rows = await this.rows<Record<string, unknown>>(this.db.from("tasks").select("*").eq("project_id", projectId)); return rows.map((r) => ({ ...r, criteria: [], required_evidence: [] } as unknown as Task)); }
  async getTask(id: string) { const { data } = await this.db.from("tasks").select("*").eq("id", id).single(); if (!data) return null; const versions = await this.rows<Record<string, unknown>>(this.db.from("task_versions").select("*").eq("task_id", id).order("version_number", { ascending: false }).limit(1)); const v = versions[0]; return { ...(data as unknown as Task), criteria: (v?.completion_criteria as Task["criteria"]) ?? [], required_evidence: (v?.required_evidence as string[]) ?? [] }; }
  async updateTask(id: string, patch: Partial<Task>) { const { data, error } = await this.db.from("tasks").update({ status: patch.status, title: patch.title, description: patch.description }).eq("id", id).select().single(); if (error) throw new Error(String(error)); return data as unknown as Task; }
  async addEvidence(e: Evidence) { const { error } = await this.db.from("evidence").insert(e); if (error) throw new Error(String(error)); return e; }
  async listEvidence(taskId: string) { return this.rows<Evidence>(this.db.from("evidence").select("*").eq("task_id", taskId)); }
  async addAssessment(a: Assessment) { const { error } = await this.db.from("assessments").insert(a); if (error) throw new Error(String(error)); return a; }
  async listAssessments(taskId: string) { return this.rows<Assessment>(this.db.from("assessments").select("*").eq("task_id", taskId)); }
  async getAssessment(id: string) { const { data } = await this.db.from("assessments").select("*").eq("id", id).single(); return data as Assessment | null; }
  async addReviewDecision(d: ReviewDecision) { const { error } = await this.db.from("review_decisions").insert(d); if (error) throw new Error(String(error)); return d; }
  async listReviewDecisions(taskId: string) { return this.rows<ReviewDecision>(this.db.from("review_decisions").select("*").eq("task_id", taskId)); }
  async addComment(c: Comment) { const { error } = await this.db.from("comments").insert(c); if (error) throw new Error(String(error)); return c; }
  async listComments(projectId: string, taskId?: string) { let q = this.db.from("comments").select("*").eq("project_id", projectId); if (taskId) q = q.eq("task_id", taskId); return this.rows<Comment>(q); }
  async addActivity(e: ActivityEvent) { await this.db.from("activity_events").insert(e); }
  async listActivity(projectId: string) { return this.rows<ActivityEvent>(this.db.from("activity_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false })); }
  async createInvitation(inv: Invitation) { const { error } = await this.db.from("invitations").insert(inv); if (error) throw new Error(String(error)); return inv; }
  async getInvitation(id: string) { const { data } = await this.db.from("invitations").select("*").eq("id", id).single(); return data as Invitation | null; }
  async acceptInvitation(id: string, userId: string) { const inv = await this.getInvitation(id); if (!inv) return; await this.db.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", id); await this.db.from("project_members").insert({ project_id: inv.project_id, user_id: userId, role: "provider", invitation_status: "accepted" }); }
}

const g = globalThis as unknown as { __kaamproofStore?: Store };
export function getStore(): Store {
  if (isDemoMode()) { if (!g.__kaamproofStore) g.__kaamproofStore = new DemoStore(); return g.__kaamproofStore; }
  const client = getSupabaseClient(); if (!client) throw new Error("Supabase is not configured");
  return new SupabaseStore(client);
}
