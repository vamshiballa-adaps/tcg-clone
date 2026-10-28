# Change requirement input — PR #4: Add login: mock sign-in, signed session cookie, role-gated routes

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/4
- **Author:** Bhargav-85
- **Branch:** `feature/login` → `main`
- **Compared:** `cd540bab8b4a`...`c9658e3f06d3`
- **Generated:** 2026-10-28T06:08:34.681Z (event: pull_request/opened)

## Description

/login is a real flow against three built-in accounts (admin, user, locked). There is no backend or user store yet, so this stands in for the Go BFF's signed session cookie (S-01).

- sign-in screen: labelled Email/Password, field validation, distinct messages for wrong credentials and a locked account; success always lands on the Dashboard (A-24), by a full page load
- /api/auth/{login,logout,session}: HMAC-signed httpOnly SameSite=Lax cookie (8h); a forged or edited cookie is rejected
- header shows the signed-in name, role and Sign out (Sign in when signed out); the sidebar follows the session's role
- src/proxy.ts (route gating at the edge, S-02): a role too low for a page gets an Access denied page at the same URL; a signed-in visit to /login goes to the Dashboard; AUTH_REQUIRED=true sends signed-out visitors to /login. That is a runtime setting and off by default, so existing flows and the Home startup cases are unaffected
- pages and layouts never read the cookie, so they stay prerendered

Checked against production builds with Playwright: 53/53 in the default mode and 61/61 with AUTH_REQUIRED=true, no console or hydration errors, and the earlier Home startup suite unchanged (25/27, same two known items). lint, tsc and build pass. Not secure by design: the passwords are printed on the sign-in screen.

## Files changed (16, +489 / -16)

| Status | File | Lines |
| --- | --- | --- |
| M | .env.example | +5 / -0 |
| M | CLAUDE.md | +44 / -3 |
| M | README.md | +30 / -7 |
| A | src/app/(app)/access-denied/page.tsx | +19 / -0 |
| M | src/app/(auth)/login/page.tsx | +5 / -2 |
| A | src/app/api/auth/login/route.ts | +37 / -0 |
| A | src/app/api/auth/logout/route.ts | +9 / -0 |
| A | src/app/api/auth/session/route.ts | +9 / -0 |
| A | src/components/auth/LoginForm.tsx | +128 / -0 |
| A | src/components/auth/useSession.ts | +27 / -0 |
| M | src/components/shell/AppShellLayout.tsx | +33 / -3 |
| A | src/config/demo-users.ts | +17 / -0 |
| M | src/config/routes.ts | +17 / -1 |
| A | src/lib/auth/session.ts | +45 / -0 |
| A | src/lib/auth/types.ts | +8 / -0 |
| A | src/proxy.ts | +56 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/.env.example b/.env.example
index 9eb6e4d..0fe8972 100644
--- a/.env.example
+++ b/.env.example
@@ -4,6 +4,11 @@ NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
 # Dev-only: which tenant role the UI renders as until real auth lands (admin | user)
 NEXT_PUBLIC_DEV_ROLE=admin
 
+# Mock sign-in (S-01). Signed out, the app is open and the role above applies. These two are server-side runtime
+# settings: change them on the host, no rebuild. See README.md, "Sign in (mock auth)".
+# AUTH_REQUIRED=true      send signed-out visitors to /login
+# AUTH_SECRET=            signs the session cookie; set a long random value on any deployed copy (the default is public)
+
 # Home screen's simulated cold start ("Application loading" + startup log). On by default; "off" skips it (a warm
 # deployment). Timings are in ms. See docs/failed-cases/home-screen-startup.md.
 # NEXT_PUBLIC_STARTUP_SEQUENCE=off
diff --git a/CLAUDE.md b/CLAUDE.md
index 1cff01f..d284cff 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -8,8 +8,9 @@ point of the repo is to exercise and improve TCG's crawl, script-generation, scr
 The TCG backend (Go orchestration, Python core, the real AI Hub frontend) lives in a separate repo, `aihub`
 (`c:\Users\ChinthalapudiBhargav\aihub`). Work in this repo is front-end only; do not edit `aihub` from here.
 
-Today the pages are still `PagePlaceholder`s built from `TCG_BRD_Feature_Catalogue.md` (see `README.md` for layout). The
-user/admin role is faked at build time by `NEXT_PUBLIC_DEV_ROLE`; there is no real auth yet (S-01).
+Today most pages are still `PagePlaceholder`s built from `TCG_BRD_Feature_Catalogue.md` (see `README.md` for layout).
+Sign-in is a mock with built-in accounts (see "Sign in" below); signed out, the role is the build-time
+`NEXT_PUBLIC_DEV_ROLE`.
 
 ## How each TCG feature touches this app
 
@@ -43,7 +44,8 @@ user/admin role is faked at build time by `NEXT_PUBLIC_DEV_ROLE`; there is no re
 - **Reachability.** TCG's crawler and Execute Scripts block private, loopback and link-local addresses (an SSRF guard,
   with a `CRAWL_ALLOWED_HOSTS` allowlist). Do not assume `localhost` or LAN URLs work; plan on a publicly reachable
   deployment, and ask the user if that is not possible.
-- Both roles can't be shown by one build, because the role comes from the build-time `NEXT_PUBLIC_DEV_ROLE`.
+- Signed in, the role comes from the account (`admin@tcg.test` or `user@tcg.test`), so one deployment shows both roles.
+  Signed out it is the build-time `NEXT_PUBLIC_DEV_ROLE`.
 
 ## Home screen startup sequence (deliberate)
 
@@ -62,6 +64,45 @@ TC-006). Don't remove or retime it without reading that file.
   `NEXT_PUBLIC_STARTUP_HOLD_MS` retime it. These are build-time, so redeploy after changing them.
 - The Render logo is a placeholder (`public/render-logo.svg`), not Render's official asset.
 
+## Sign in (mock auth)
+
+`/login` is a real flow against three built-in accounts. There is no backend or user store, so this stands in for the Go
+BFF's signed session cookie (S-01). The accounts are printed on the sign-in screen and live in `src/config/demo-users.ts`.
+
+| Account | Email | Password | What happens |
+| --- | --- | --- | --- |
+| Admin | `admin@tcg.test` | `Admin#123` | Signs in as admin: full sidebar |
+| User | `user@tcg.test` | `User#1234` | Signs in as user: no Administration, Integrations or CI/CD Automation |
+| Locked | `locked@tcg.test` | `Locked#123` | Refused, even with the right password |
+
+Fields are labelled "Email" and "Password"; the button is "Sign in". Exact messages (an alert titled "Can't sign in" for
+the last three, field errors under the inputs for the first three):
+
+- empty email: "Enter your email address."; malformed: "Enter a valid email address."; empty password: "Enter your password."
+- wrong password or unknown email: "Invalid email or password." (the same text for both)
+- locked account with the right password: "This account is locked. Contact your workspace admin." (a wrong password on it
+  gives the generic message above)
+
+Behaviour a test can rely on:
+
+- A successful sign-in always lands on the Dashboard (A-24), by a full page load, so the Home startup screen plays first.
+- The header then shows the person's name, a role badge and a "Sign out" button; signed out it shows a "Sign in" link.
+  "Sign out" goes to `/login`. Email matching ignores case and surrounding spaces.
+- A signed-in person opening `/login` is sent to the Dashboard.
+- A role too low for a page gets an "Access denied" page at that same URL (status 200, because a proxy rewrite cannot
+  set one). Admin-only: `/administration`, `/integrations`, `/cicd-automation`.
+- By default the app is open when signed out. `AUTH_REQUIRED=true` (a runtime setting on the host, no rebuild) sends
+  signed-out visitors to `/login` instead; the auth screens, `/api/auth/*` and static assets stay open. Turning it on
+  makes any test that reaches a page without signing in first land on `/login`, so run Execute Scripts with
+  credentials.
+
+Code: `src/app/(auth)/login/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
+`src/lib/auth/`, and `src/proxy.ts` (route gating). Pages and layouts never read the cookie: that would make them
+dynamic and the Home startup screen would stop being prerendered, so the UI asks `/api/auth/session` after load.
+
+Not secure by design: the passwords are public, and the session cookie is signed with `AUTH_SECRET` (a public default
+if unset). Never put real data behind it.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index b9ec3b0..7449b8a 100644
--- a/README.md
+++ b/README.md
@@ -24,10 +24,11 @@ npm run dev                  # http://localhost:3000
 | `src/config/routes.ts` | **Screen registry.** Every screen from the catalogue: path, title, feature IDs (U-xx / A-xx / S-xx), min role, status, pipeline stage, sidebar entry. |
 | `src/config/pipeline.ts` | The 7 pipeline stages. |
 | `src/app/(app)/…` | Authenticated screens inside the app shell (sidebar: My Work / My Insights / My Organization). |
-| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). |
-| `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle. |
+| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). Only login is built (mock). |
+| `src/app/api/auth/…`, `src/lib/auth/`, `src/proxy.ts` | Mock sign-in: login/logout/session endpoints, the signed session cookie, route gating. See "Sign in (mock auth)". |
+| `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle, who's signed in. |
 | `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
-| `src/lib/role.ts` | Tenant roles + `canAccess`. `NEXT_PUBLIC_DEV_ROLE=admin\|user` fakes the role until real auth (S-01) lands. |
+| `src/lib/role.ts` | Tenant roles + `canAccess`. Signed out, `NEXT_PUBLIC_DEV_ROLE=admin\|user` is the role; signed in, the account's role wins. |
 | `src/lib/api/client.ts` | Fetch wrapper for the Go BFF (`NEXT_PUBLIC_API_BASE_URL`). |
 | `src/theme.ts` | Mantine theme. Both light and dark must work. |
 
@@ -42,6 +43,30 @@ already work.
 3. Set `status` to `"in-progress"`, then `"done"` when merged.
 4. Need a new screen? Add it to `routes.ts` **and** create its `page.tsx`.
 
+## Sign in (mock auth)
+
+`/login` signs in against three built-in accounts (S-01). There is no backend or user store yet, so this stands in for
+the Go BFF's signed session cookie.
+
+| Account | Email | Password | Result |
+| --- | --- | --- | --- |
+| Admin | `admin@tcg.test` | `Admin#123` | Signs in as admin |
+| User | `user@tcg.test` | `User#1234` | Signs in as user (no Administration, Integrations, CI/CD Automation) |
+| Locked | `locked@tcg.test` | `Locked#123` | Refused: "This account is locked. Contact your workspace admin." |
+
+Other outcomes: "Enter your email address.", "Enter a valid email address.", "Enter your password.", and "Invalid email
+or password." for a wrong password or unknown email. A successful sign-in always lands on the Dashboard (A-24). The
+header then shows the person's name, role and **Sign out**; the sidebar follows their role.
+
+- **Session:** a signed, httpOnly cookie (`tcg_session`, 8 hours). The UI asks `/api/auth/session`; pages and layouts
+  never read the cookie, so they stay prerendered.
+- **Gating (`src/proxy.ts`):** a signed-in role too low for a page sees "Access denied" at that URL (status 200); a
+  signed-in person opening `/login` goes to the Dashboard.
+- **Settings** (`.env.example`): `AUTH_REQUIRED=true` redirects signed-out visitors to `/login`. It is a runtime setting
+  (no rebuild) and off by default, so the app stays open. `AUTH_SECRET` signs the cookie; set a long random value on
+  any deployed copy.
+- **Not secure:** the passwords are printed on the sign-in screen. Don't put real data behind it.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
@@ -67,10 +92,8 @@ merged changes can filter on it (or delete the `pull_request:` trigger from the
 whatever ingests requirements (e.g. the Inputs Registry API once it exists) and the branch/artifact keep working as a
 fallback.
 
-> Smoke test: this line was added in a throwaway PR to check that the workflow runs when a change is merged to
-> `main`. Safe to delete.
-
 ## Not included yet (by design)
 
-Auth/session, real RBAC capabilities, API integration, data fetching/state library, tests, build/lint CI, and the platform
+Real auth/session (a user store, signup and password flows, the BFF's session cookie; sign-in above is a mock), real
+RBAC capabilities, API integration, data fetching/state library, tests, build/lint CI, and the platform
 `/admin` surface (P-xx). Add these as their features come up.
diff --git a/src/app/(app)/access-denied/page.tsx b/src/app/(app)/access-denied/page.tsx
new file mode 100644
index 0000000..51f3f8a
--- /dev/null
+++ b/src/app/(app)/access-denied/page.tsx
@@ -0,0 +1,19 @@
+import type { Metadata } from "next";
+import Link from "next/link";
+import { Stack, Text, Title } from "@mantine/core";
+
+export const metadata: Metadata = { title: "Access denied" };
+
+// The proxy rewrites to this page when a signed-in role cannot open the page that was asked for, so the address bar
+// still shows the page they tried. The status is 200 (see proxy.ts).
+export default function Page() {
+  return (
+    <Stack gap="sm">
+      <Title order={2}>Access denied</Title>
+      <Text>Your role can&apos;t open this page. Ask a workspace admin if you need access.</Text>
+      <Link href="/" style={{ color: "var(--mantine-color-anchor)" }}>
+        Back to Dashboard
+      </Link>
+    </Stack>
+  );
+}
diff --git a/src/app/(auth)/login/page.tsx b/src/app/(auth)/login/page.tsx
index 0d471f4..8eaabaa 100644
--- a/src/app/(auth)/login/page.tsx
+++ b/src/app/(auth)/login/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { LoginForm } from "@/components/auth/LoginForm";
+
+export const metadata: Metadata = { title: "Sign in" };
 
 export default function Page() {
-  return <PagePlaceholder route="/login" />;
+  return <LoginForm />;
 }
diff --git a/src/app/api/auth/login/route.ts b/src/app/api/auth/login/route.ts
new file mode 100644
index 0000000..652ed2a
--- /dev/null
+++ b/src/app/api/auth/login/route.ts
@@ -0,0 +1,37 @@
+import { NextResponse } from "next/server";
+import { DEMO_USERS } from "@/config/demo-users";
+import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth/session";
+
+// Mock sign-in. 200 sets the session cookie; 400 malformed body; 401 wrong email or password (the same answer for
+// both, so it does not reveal which accounts exist); 423 right credentials but the account is locked.
+export async function POST(request: Request) {
+  let body: unknown;
+  try {
+    body = await request.json();
+  } catch {
+    return NextResponse.json({ error: "bad_request" }, { status: 400 });
+  }
+  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
+  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
+    return NextResponse.json({ error: "bad_request" }, { status: 400 });
+  }
+
+  const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
+  if (!user || user.password !== password) {
+    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
+  }
+  if (user.locked) {
+    return NextResponse.json({ error: "account_locked" }, { status: 423 });
+  }
+
+  const sessionUser = { email: user.email, name: user.name, role: user.role };
+  const response = NextResponse.json({ user: sessionUser });
+  response.cookies.set(SESSION_COOKIE, createSessionToken(sessionUser), {
+    httpOnly: true,
+    sameSite: "lax",
+    secure: process.env.NODE_ENV === "production",
+    path: "/",
+    maxAge: SESSION_MAX_AGE_SECONDS,
+  });
+  return response;
+}
diff --git a/src/app/api/auth/logout/route.ts b/src/app/api/auth/logout/route.ts
new file mode 100644
index 0000000..c8a2029
--- /dev/null
+++ b/src/app/api/auth/logout/route.ts
@@ -0,0 +1,9 @@
+import { NextResponse } from "next/server";
+import { SESSION_COOKIE } from "@/lib/auth/session";
+
+// Ends the session. Always 200, signed in or not.
+export async function POST() {
+  const response = NextResponse.json({ ok: true });
+  response.cookies.delete(SESSION_COOKIE);
+  return response;
+}
diff --git a/src/app/api/auth/session/route.ts b/src/app/api/auth/session/route.ts
new file mode 100644
index 0000000..8289180
--- /dev/null
+++ b/src/app/api/auth/session/route.ts
@@ -0,0 +1,9 @@
+import { NextResponse, type NextRequest } from "next/server";
+import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
+
+// Who is signed in, for the UI. The cookie is httpOnly, so the browser cannot read it itself. Pages and layouts do not
+// read it either: that would make them dynamic and the Home startup screen would stop being prerendered.
+export async function GET(request: NextRequest) {
+  const user = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
+  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
+}
diff --git a/src/components/auth/LoginForm.tsx b/src/components/auth/LoginForm.tsx
new file mode 100644
index 0000000..d874f96
--- /dev/null
+++ b/src/components/auth/LoginForm.tsx
@@ -0,0 +1,128 @@
+"use client";
+
+import { useRef, useState } from "react";
+import Link from "next/link";
+import { Alert, Anchor, Button, List, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
+import { DEMO_USERS } from "@/config/demo-users";
+
+const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+
+interface FieldErrors {
+  email?: string;
+  password?: string;
+}
+
+// The sign-in screen (S-01). Checks the two fields itself first, then asks /api/auth/login. Success always lands on the
+// Dashboard (A-24), by a full page load so the session cookie is in place for the first request.
+export function LoginForm() {
+  const [email, setEmail] = useState("");
+  const [password, setPassword] = useState("");
+  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
+  const [formError, setFormError] = useState<string | null>(null);
+  const [submitting, setSubmitting] = useState(false);
+  const emailRef = useRef<HTMLInputElement>(null);
+  const passwordRef = useRef<HTMLInputElement>(null);
+
+  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setFormError(null);
+
+    const trimmed = email.trim();
+    const errors: FieldErrors = {};
+    if (!trimmed) errors.email = "Enter your email address.";
+    else if (!EMAIL_RE.test(trimmed)) errors.email = "Enter a valid email address.";
+    if (!password) errors.password = "Enter your password.";
+    setFieldErrors(errors);
+    if (errors.email) return emailRef.current?.focus();
+    if (errors.password) return passwordRef.current?.focus();
+
+    setSubmitting(true);
+    try {
+      const res = await fetch("/api/auth/login", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ email: trimmed, password }),
+      });
+      if (res.ok) {
+        // A full page load on purpose, not router.push: the next request starts with the new session cookie and the
+        // Home startup screen plays as it does on any fresh load. Stay in the submitting state until the page changes.
+        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
+        window.location.assign("/");
+        return;
+      }
+      setFormError(
+        res.status === 401
+          ? "Invalid email or password."
+          : res.status === 423
+            ? "This account is locked. Contact your workspace admin."
+            : "Something went wrong. Try again.",
+      );
+    } catch {
+      setFormError("Something went wrong. Try again.");
+    }
+    setSubmitting(false);
+  }
+
+  return (
+    <Stack gap="lg">
+      <Stack gap={4}>
+        <Title order={1}>Sign in</Title>
+        <Text c="dimmed">Use the account your workspace admin set up for you.</Text>
+      </Stack>
+
+      <form onSubmit={onSubmit} noValidate>
+        <Stack>
+          {formError && (
+            <Alert color="red" title="Can't sign in">
+              {formError}
+            </Alert>
+          )}
+          <TextInput
+            ref={emailRef}
+            label="Email"
+            name="email"
+            type="email"
+            autoComplete="username"
+            value={email}
+            onChange={(e) => setEmail(e.currentTarget.value)}
+            error={fieldErrors.email}
+          />
+          <TextInput
+            ref={passwordRef}
+            label="Password"
+            name="password"
+            type="password"
+            autoComplete="current-password"
+            value={password}
+            onChange={(e) => setPassword(e.currentTarget.value)}
+            error={fieldErrors.password}
+          />
+          <Button type="submit" loading={submitting}>
+            Sign in
+          </Button>
+        </Stack>
+      </form>
+
+      <Anchor component={Link} href="/forgot-password" size="sm">
+        Forgot password?
+      </Anchor>
+
+      <Paper withBorder p="md">
+        <Text size="sm" fw={600}>
+          Demo accounts
+        </Text>
+        <Text size="xs" c="dimmed" mb="xs">
+          This is a test app. These accounts are built in.
+        </Text>
+        <List size="xs" listStyleType="none" spacing={4} aria-label="Demo accounts">
+          {DEMO_USERS.map((u) => (
+            <List.Item key={u.email}>
+              {u.locked ? "Locked account (always refused)" : u.role === "admin" ? "Admin" : "User"}: {u.email} /{" "}
+              {u.password}
+            </List.Item>
+          ))}
+        </List>
+      </Paper>
+    </Stack>
+  );
+}
diff --git a/src/components/auth/useSession.ts b/src/components/auth/useSession.ts
new file mode 100644
index 0000000..6da33fa
--- /dev/null
+++ b/src/components/auth/useSession.ts
@@ -0,0 +1,27 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import type { SessionUser } from "@/lib/auth/types";
+
+// undefined: not known yet. null: nobody is signed in. Asked of /api/auth/session after the page has loaded, because
+// the session cookie is httpOnly and pages do not read it (see that route).
+export function useSession(): SessionUser | null | undefined {
+  const [session, setSession] = useState<SessionUser | null | undefined>(undefined);
+
+  useEffect(() => {
+    let cancelled = false;
+    fetch("/api/auth/session", { cache: "no-store" })
+      .then((res) => (res.ok ? res.json() : { user: null }))
+      .then((data: { user: SessionUser | null }) => {
+        if (!cancelled) setSession(data.user ?? null);
+      })
+      .catch(() => {
+        if (!cancelled) setSession(null);
+      });
+    return () => {
+      cancelled = true;
+    };
+  }, []);
+
+  return session;
+}
diff --git a/src/components/shell/AppShellLayout.tsx b/src/components/shell/AppShellLayout.tsx
index 76ddb28..7e8837b 100644
--- a/src/components/shell/AppShellLayout.tsx
+++ b/src/components/shell/AppShellLayout.tsx
@@ -1,16 +1,31 @@
 "use client";
 
-import { Suspense } from "react";
+import { Suspense, useState } from "react";
 import Link from "next/link";
-import { AppShell, Badge, Burger, Group, Title } from "@mantine/core";
+import { AppShell, Badge, Burger, Button, Group, Text, Title } from "@mantine/core";
 import { useDisclosure } from "@mantine/hooks";
+import { useSession } from "@/components/auth/useSession";
 import { getDevRole } from "@/lib/role";
 import { SidebarNav } from "./SidebarNav";
 import { ThemeToggle } from "./ThemeToggle";
 
 export function AppShellLayout({ children }: { children: React.ReactNode }) {
   const [opened, { toggle }] = useDisclosure();
-  const role = getDevRole();
+  const [signingOut, setSigningOut] = useState(false);
+  const session = useSession();
+  // A signed-in person's own role wins; otherwise the stand-in role from NEXT_PUBLIC_DEV_ROLE.
+  const role = session?.role ?? getDevRole();
+
+  async function signOut() {
+    setSigningOut(true);
+    try {
+      await fetch("/api/auth/logout", { method: "POST" });
+    } finally {
+      // Full page load on purpose: nothing from the signed-in session is left in the page.
+      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
+      window.location.assign("/login");
+    }
+  }
 
   return (
     <AppShell
@@ -28,6 +43,21 @@ export function AppShellLayout({ children }: { children: React.ReactNode }) {
           </Group>
           <Group>
             <Badge variant="light">{role}</Badge>
+            {session && (
+              <>
+                <Text size="sm" visibleFrom="sm">
+                  {session.name}
+                </Text>
+                <Button variant="default" size="xs" onClick={signOut} loading={signingOut}>
+                  Sign out
+                </Button>
+              </>
+            )}
+            {session === null && (
+              <Button component={Link} href="/login" variant="default" size="xs">
+                Sign in
+              </Button>
+            )}
             <ThemeToggle />
           </Group>
         </Group>
diff --git a/src/config/demo-users.ts b/src/config/demo-users.ts
new file mode 100644
index 0000000..f62db0c
--- /dev/null
+++ b/src/config/demo-users.ts
@@ -0,0 +1,17 @@
+import type { Role } from "@/lib/role";
+
+// Built-in accounts for the mock sign-in (S-01). There is no user store behind this app yet: /api/auth/login checks
+// against this list, and the sign-in screen prints it so a tester knows what to type. Test app only.
+export interface DemoUser {
+  email: string; // lower case
+  password: string;
+  name: string;
+  role: Role;
+  locked?: boolean; // right credentials, but the account is refused
+}
+
+export const DEMO_USERS: DemoUser[] = [
+  { email: "admin@tcg.test", password: "Admin#123", name: "Alex Admin", role: "admin" },
+  { email: "user@tcg.test", password: "User#1234", name: "Uma User", role: "user" },
+  { email: "locked@tcg.test", password: "Locked#123", name: "Lee Locked", role: "user", locked: true },
+];
diff --git a/src/config/routes.ts b/src/config/routes.ts
index e045c12..b99856f 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -275,9 +275,25 @@ export const ROUTES: RouteDef[] = [
     roles: "all",
     status: "todo",
   },
+  {
+    path: "/access-denied",
+    title: "Access denied",
+    description: "Shown, at the address that was asked for, when a signed-in role cannot open that page.",
+    features: ["S-02"],
+    roles: "all",
+    status: "done",
+  },
 
   // ---- Auth (S-01) ----
-  { path: "/login", title: "Sign in", description: "Login flow.", features: ["S-01"], roles: "all", status: "todo" },
+  {
+    path: "/login",
+    title: "Sign in",
+    description:
+      "Email and password against the built-in demo accounts (mock; no backend yet). A signed-in person always lands on the Dashboard.",
+    features: ["S-01"],
+    roles: "all",
+    status: "in-progress",
+  },
   { path: "/signup", title: "Sign up", description: "Signup flow.", features: ["S-01"], roles: "all", status: "todo" },
   {
     path: "/forgot-password",
diff --git a/src/lib/auth/session.ts b/src/lib/auth/session.ts
new file mode 100644
index 0000000..d3f074b
--- /dev/null
+++ b/src/lib/auth/session.ts
@@ -0,0 +1,45 @@
+import { createHmac, timingSafeEqual } from "node:crypto";
+import type { SessionUser } from "./types";
+
+// Server-side only (proxy and route handlers). Stand-in for the signed session cookie the Go BFF will issue (S-01):
+// the cookie carries the user and role, signed so the role cannot be edited by hand. Nothing here is a user store.
+
+export const SESSION_COOKIE = "tcg_session";
+export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
+
+interface Payload extends SessionUser {
+  exp: number; // unix seconds
+}
+
+function sign(body: string): string {
+  const secret = process.env.AUTH_SECRET || "dev-only-secret-change-me";
+  return createHmac("sha256", secret).update(body).digest("base64url");
+}
+
+export function createSessionToken(user: SessionUser, nowMs = Date.now()): string {
+  const payload: Payload = { ...user, exp: Math.floor(nowMs / 1000) + SESSION_MAX_AGE_SECONDS };
+  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
+  return `${body}.${sign(body)}`;
+}
+
+/** The user in a session cookie value, or null if it is missing, forged, malformed or expired. */
+export function readSessionToken(token: string | undefined, nowMs = Date.now()): SessionUser | null {
+  if (!token) return null;
+  const parts = token.split(".");
+  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
+  const [body, sig] = parts;
+
+  const expected = Buffer.from(sign(body));
+  const given = Buffer.from(sig);
+  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
+
+  try {
+    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<Payload>;
+    if (typeof p.exp !== "number" || p.exp * 1000 < nowMs) return null;
+    if (typeof p.email !== "string" || typeof p.name !== "string") return null;
+    if (p.role !== "admin" && p.role !== "user") return null;
+    return { email: p.email, name: p.name, role: p.role };
+  } catch {
+    return null;
+  }
+}
diff --git a/src/lib/auth/types.ts b/src/lib/auth/types.ts
new file mode 100644
index 0000000..1c65bca
--- /dev/null
+++ b/src/lib/auth/types.ts
@@ -0,0 +1,8 @@
+import type { Role } from "@/lib/role";
+
+// What the UI knows about the signed-in person. Safe to import from client code.
+export interface SessionUser {
+  email: string;
+  name: string;
+  role: Role;
+}
diff --git a/src/proxy.ts b/src/proxy.ts
new file mode 100644
index 0000000..e506915
--- /dev/null
+++ b/src/proxy.ts
@@ -0,0 +1,56 @@
+import { NextResponse, type NextRequest } from "next/server";
+import { AUTH_PATHS, ROUTES } from "@/config/routes";
+import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
+import { canAccess } from "@/lib/role";
+
+// Route gating at the edge (S-02), in front of every page. It only ever reads the session cookie: pages and layouts
+// never do, so they stay prerendered.
+//
+//   - signed in, opening /login          -> Dashboard
+//   - signed out, AUTH_REQUIRED=true     -> /login (the auth screens themselves stay open)
+//   - signed in, role too low for a page -> the "Access denied" page, served at the same URL. The status stays 200: a
+//     proxy rewrite cannot set one, and Next's forbidden() (which can) is still experimental.
+//
+// AUTH_REQUIRED is read on every request, so it is a runtime setting: change it on the host, no rebuild. It is off by
+// default, so a signed-out visitor still gets the app (with the role from NEXT_PUBLIC_DEV_ROLE).
+
+// "/projects/[id]" -> /^\/projects\/[^/]+\/?$/
+const PATTERNS = ROUTES.map((route) => ({
+  route,
+  re: new RegExp(`^${route.path.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`),
+}));
+
+export function proxy(request: NextRequest) {
+  const { pathname } = request.nextUrl;
+  const session = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
+
+  if (session && pathname === "/login") {
+    return redirectTo(request, "/");
+  }
+
+  if (!session) {
+    const authRequired = process.env.AUTH_REQUIRED === "true";
+    if (authRequired && !AUTH_PATHS.includes(pathname)) return redirectTo(request, "/login");
+    return NextResponse.next();
+  }
+
+  const match = PATTERNS.find((p) => p.re.test(pathname));
+  if (match && !canAccess(session.role, match.route.roles)) {
+    const url = request.nextUrl.clone();
+    url.pathname = "/access-denied";
+    return NextResponse.rewrite(url);
+  }
+  return NextResponse.next();
+}
+
+function redirectTo(request: NextRequest, pathname: string) {
+  const url = request.nextUrl.clone();
+  url.pathname = pathname;
+  url.search = "";
+  return NextResponse.redirect(url);
+}
+
+// Pages only: not the API routes, Next's own files or the static assets in /public.
+export const config = {
+  matcher: ["/((?!api/|_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
+};
```
