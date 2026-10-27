"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Badge, Field, inputClass } from "@/components/ui";
import TaskCard from "@/components/TaskCard";
import ActivityTimeline from "@/components/ActivityTimeline";
import ReportView from "@/components/ReportView";
import type { ActivityEvent, Assessment, Evidence, Project, ProjectMember, ReviewDecision, Task } from "@/lib/types";
import { taskProgress } from "@/lib/progress";

type Tab = "overview" | "tasks" | "evidence" | "activity" | "participants" | "report";
export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<{ project: Project; members: ProjectMember[]; tasks: Task[]; activity: ActivityEvent[] } | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]); const [assessments, setAssessments] = useState<Assessment[]>([]); const [decisions, setDecisions] = useState<ReviewDecision[]>([]);
  const [error, setError] = useState(""); const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [crit, setCrit] = useState(""); const [inviteEmail, setInviteEmail] = useState(""); const [inviteMsg, setInviteMsg] = useState("");
  async function load() {
    const r = await fetch(`/api/projects/${params.projectId}`); if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error || "Project not found."); return; }
    const j = await r.json(); setData(j);
    const ev: Evidence[] = []; const as: Assessment[] = []; const de: ReviewDecision[] = [];
    for (const t of j.tasks as Task[]) { const tr = await fetch(`/api/tasks/${t.id}`); if (tr.ok) { const tj = await tr.json(); ev.push(...tj.evidence); as.push(...tj.assessments); de.push(...tj.decisions); } }
    setEvidence(ev); setAssessments(as); setDecisions(de);
  }
  useEffect(() => { load(); }, []);
  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return <p>Loading…</p>;
  const pr = taskProgress(data.tasks);
  async function addTask(e: React.FormEvent) { e.preventDefault(); const criteria = crit.split("\n").map((s) => s.trim()).filter(Boolean).map((text, i) => ({ id: `criterion_${i + 1}`, text, assessable_from_images: true })); const res = await fetch(`/api/projects/${params.projectId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description: desc, criteria, required_evidence: [] }) }); if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || "Could not create task."); return; } setTitle(""); setDesc(""); setCrit(""); load(); }
  async function invite(e: React.FormEvent) { e.preventDefault(); const res = await fetch(`/api/projects/${params.projectId}/invitations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitee_email: inviteEmail }) }); if (!res.ok) { const j = await res.json().catch(() => ({})); setInviteMsg(j.error || "Invite failed."); return; } const j = await res.json(); setInviteMsg(`Invitation created (expires ${j.invitation.expires_at}). In demo mode the invite token is: ${j.token}`); setInviteEmail(""); load(); }
  async function closeProject() { const res = await fetch(`/api/projects/${params.projectId}/close`, { method: "POST" }); if (res.ok) load(); else { const j = await res.json().catch(() => ({})); setError(j.error || "Could not close project."); } }
  const tabs: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "tasks", label: "Tasks" }, { id: "evidence", label: "Evidence" }, { id: "activity", label: "Activity" }, { id: "participants", label: "Participants" }, { id: "report", label: "Report" }];
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">{data.project.name}</h1><p className="text-slate-600">{data.project.description}</p><p className="mt-1 text-sm"><Badge>{data.project.status}</Badge> · Task completion progress: <strong>{pr.percent}%</strong> ({pr.accepted} of {pr.applicable} applicable tasks accepted{pr.blocked ? `, ${pr.blocked} blocked excluded` : ""})</p></div>
      <nav className="flex flex-wrap gap-2">{tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-sm ${tab === t.id ? "bg-teal-700 text-white" : "bg-white border"}`}>{t.label}</button>))}</nav>
      {tab === "overview" && (<Card><h2 className="font-semibold">What needs attention?</h2><ul className="mt-2 space-y-1 text-sm"><li>Tasks awaiting review: {data.tasks.filter((t) => ["submitted_for_review", "reviewed"].includes(t.status)).length}</li><li>Tasks needing more evidence: {data.tasks.filter((t) => t.status === "needs_more_evidence").length}</li><li>Accepted tasks: {pr.accepted}</li><li>Recent activity: {data.activity[0] ? `${data.activity[0].event_type} — ${new Date(data.activity[0].created_at).toLocaleString()}` : "none"}</li></ul><div className="mt-3"><Button onClick={closeProject}>Close project (owner only)</Button><p className="mt-1 text-xs text-slate-500">Closing is an explicit owner decision. AI never closes a project. Unresolved tasks remain visible in the report.</p></div></Card>)}
      {tab === "tasks" && (<div className="space-y-3">{data.tasks.map((t) => <TaskCard key={t.id} task={t} />)}<Card><h2 className="font-semibold">Add task</h2><form onSubmit={addTask} className="mt-3 space-y-3"><Field label="Task title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass()} /></Field><Field label="Description"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={inputClass()} rows={2} /></Field><Field label="Completion criteria (one per line)"><textarea value={crit} onChange={(e) => setCrit(e.target.value)} className={inputClass()} rows={3} placeholder={"All agreed walls are painted.\nNo unpainted areas remain in inspection views."} /></Field><Button type="submit">Add task</Button></form></Card></div>)}
      {tab === "evidence" && (<Card><h2 className="font-semibold">All evidence in this project</h2>{evidence.length === 0 ? <p className="mt-2 text-sm text-slate-500">No evidence yet.</p> : <ul className="mt-2 space-y-2">{evidence.map((e) => (<li key={e.id} className="text-sm">{e.stage} · {e.caption ?? "(no caption)"} · <Link href={`/tasks/${e.task_id}`}>open task →</Link>{e.image_url && <span className="block mt-1">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={e.image_url} alt={e.caption ?? "Evidence"} className="max-h-48 rounded-xl" /></span>}</li>))}</ul>}</Card>)}
      {tab === "activity" && <ActivityTimeline events={data.activity} />}
      {tab === "participants" && (<div className="space-y-3"><Card><h2 className="font-semibold">Participants</h2><ul className="mt-2 space-y-1 text-sm">{data.members.map((m) => <li key={m.id}>{m.user_id} — {m.role} ({m.invitation_status})</li>)}</ul></Card><Card><h2 className="font-semibold">Invite a participant</h2><form onSubmit={invite} className="mt-3 space-y-3"><Field label="Invitee email"><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={inputClass()} /></Field><Button type="submit">Send invitation</Button>{inviteMsg && <p className="text-sm break-all">{inviteMsg}</p>}</form><p className="mt-2 text-xs text-slate-500">Invitations use an expiring, single-use token; only its hash is stored. The invitee must sign in before seeing private project data.</p></Card></div>)}
      {tab === "report" && <ReportView project={data.project} tasks={data.tasks} evidence={evidence} assessments={assessments} decisions={decisions} />}
    </div>
  );
}
