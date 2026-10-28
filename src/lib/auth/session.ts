import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "./types";

// Server-side only (proxy and route handlers). Stand-in for the signed session cookie the Go BFF will issue (S-01):
// the cookie carries the user and role, signed so the role cannot be edited by hand. Nothing here is a user store.

export const SESSION_COOKIE = "tcg_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

interface Payload extends SessionUser {
  exp: number; // unix seconds
}

function sign(body: string): string {
  const secret = process.env.AUTH_SECRET || "dev-only-secret-change-me";
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken(user: SessionUser, nowMs = Date.now()): string {
  const payload: Payload = { ...user, exp: Math.floor(nowMs / 1000) + SESSION_MAX_AGE_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** The user in a session cookie value, or null if it is missing, forged, malformed or expired. */
export function readSessionToken(token: string | undefined, nowMs = Date.now()): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, sig] = parts;

  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<Payload>;
    if (typeof p.exp !== "number" || p.exp * 1000 < nowMs) return null;
    if (typeof p.email !== "string" || typeof p.name !== "string") return null;
    if (p.role !== "admin" && p.role !== "user") return null;
    return { email: p.email, name: p.name, role: p.role };
  } catch {
    return null;
  }
}
