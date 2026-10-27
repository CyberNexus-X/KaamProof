import { NextRequest } from "next/server";
import { isDemoMode, DEMO_OWNER, getSupabaseClient } from "./store";
// Demo mode: the demo owner is the acting user unless x-demo-user is set to the
// demo provider (used by the demo UI to switch roles). Real mode: Supabase
// Bearer token is verified server-side; no key ever reaches the client.
export async function getSessionUser(req: NextRequest): Promise<{ id: string; email?: string } | null> {
  if (isDemoMode()) {
    const role = req.headers.get("x-demo-user");
    if (role === "provider") return { id: "demo-user-provider", email: "provider@demo.kaamproof" };
    if (role === "reviewer") return { id: "demo-user-reviewer", email: "reviewer@demo.kaamproof" };
    return { id: DEMO_OWNER, email: "owner@demo.kaamproof" };
  }
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const client = getSupabaseClient(); if (!client) return null;
  const { data, error } = await client.auth.getUser(auth.slice(7));
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}
export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
// PRD §11.6 error mapping helper
export const ERR = { bad: 400, unauth: 401, forbidden: 403, notfound: 404, conflict: 409, toolarge: 413, unsupported: 415, invalid: 422, ratelimit: 429, server: 500, unavailable: 503 };
