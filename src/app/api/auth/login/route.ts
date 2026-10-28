import { NextResponse } from "next/server";
import { DEMO_USERS } from "@/config/demo-users";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth/session";

// Mock sign-in. 200 sets the session cookie; 400 malformed body; 401 wrong email or password (the same answer for
// both, so it does not reveal which accounts exist); 423 right credentials but the account is locked.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  if (user.locked) {
    return NextResponse.json({ error: "account_locked" }, { status: 423 });
  }

  const sessionUser = { email: user.email, name: user.name, role: user.role };
  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set(SESSION_COOKIE, createSessionToken(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
