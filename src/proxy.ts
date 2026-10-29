import { NextResponse, type NextRequest } from "next/server";
import { AUTH_PATHS, ROUTES } from "@/config/routes";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { canAccess } from "@/lib/role";

// Route gating at the edge (S-02), in front of every page. It only ever reads the session cookie: pages and layouts
// never do, so they stay prerendered.
//
//   - signed in, opening /login          -> Dashboard
//   - signed out                         -> /login (the auth screens themselves stay open)
//   - signed in, role too low for a page -> the "Access denied" page, served at the same URL. The status stays 200: a
//     proxy rewrite cannot set one, and Next's forbidden() (which can) is still experimental.
//
// Signing in is mandatory by default. AUTH_REQUIRED=false opens the app to signed-out visitors instead (with the role
// from NEXT_PUBLIC_DEV_ROLE). It is read on every request, so it is a runtime setting: change it on the host, no
// rebuild. Only the exact value "false" opens the app; unset or anything else keeps sign-in mandatory.

// "/projects/[id]" -> /^\/projects\/[^/]+\/?$/
const PATTERNS = ROUTES.map((route) => ({
  route,
  re: new RegExp(`^${route.path.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`),
}));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (session && pathname === "/login") {
    return redirectTo(request, "/");
  }

  if (!session) {
    const authRequired = process.env.AUTH_REQUIRED !== "false";
    if (authRequired && !AUTH_PATHS.includes(pathname)) return redirectTo(request, "/login");
    return NextResponse.next();
  }

  const match = PATTERNS.find((p) => p.re.test(pathname));
  if (match && !canAccess(session.role, match.route.roles)) {
    const url = request.nextUrl.clone();
    url.pathname = "/access-denied";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

// Pages only: not the API routes, Next's own files or the static assets in /public.
export const config = {
  matcher: ["/((?!api/|_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
