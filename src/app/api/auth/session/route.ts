import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";

// Who is signed in, for the UI. The cookie is httpOnly, so the browser cannot read it itself. Pages and layouts do not
// read it either: that would make them dynamic and the Home startup screen would stop being prerendered.
export async function GET(request: NextRequest) {
  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
