import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

// Ends the session. Always 200, signed in or not.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
