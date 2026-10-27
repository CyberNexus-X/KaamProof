import { EVENT_LABELS } from "@/lib/activity";
import type { ActivityEvent } from "@/lib/types";
export default function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (!events.length) return <p className="text-sm text-slate-500">No activity yet.</p>;
  return <ol className="space-y-3">{events.map((e) => (<li key={e.id} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-sm font-medium">{EVENT_LABELS[e.event_type] ?? e.event_type}</p><p className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}{e.actor_id ? ` · ${e.actor_id}` : ""} · {e.entity_type}/{e.entity_id}</p></li>))}</ol>;
}
