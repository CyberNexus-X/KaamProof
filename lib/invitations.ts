import { createHash, randomBytes } from "crypto";
export function createInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") };
}
export function hashToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export function isInvitationExpired(expiresAt: string, now = new Date()): boolean { return new Date(expiresAt).getTime() <= now.getTime(); }
export function invitationExpiry(days = 7): string { return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(); }
