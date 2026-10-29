# Merged change requirement input — Make sign-in mandatory: signed-out visitors land on /login first

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/5
- **Author:** Bhargav-85
- **Merged into:** `main` (from `feature/login-required`)
- **Compared:** `854bf74bc9fd`...`10c371ebd89e`
- **Generated:** 2026-10-29T04:12:52.446Z (event: push)

## Description

AUTH_REQUIRED now defaults to on. A signed-out visit to any page, including "/", redirects to /login; only the auth screens, /api/auth/* and static assets stay open. AUTH_REQUIRED=false opens the app again (runtime setting, no rebuild); unset or any other value keeps sign-in mandatory.

Docs updated to match (CLAUDE.md, README, .env.example, the Home startup cases now begin after a sign-in).

## Commits (2)

- `10c371ebd89e` Merge pull request #5 from vamshiballa-adaps/feature/login-required — Bhargav-85
- `73e15daf1259` Make sign-in mandatory: signed-out visitors land on /login first — Priyanka Priyadarshani

## Files changed (6, +44 / -24)

| Status | File | Lines |
| --- | --- | --- |
| M | .env.example | +4 / -4 |
| M | CLAUDE.md | +20 / -11 |
| M | README.md | +8 / -4 |
| M | docs/failed-cases/home-screen-startup.md | +6 / -0 |
| M | src/config/routes.ts | +1 / -1 |
| M | src/proxy.ts | +5 / -4 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/.env.example b/.env.example
index 0fe8972..2f4a6dc 100644
--- a/.env.example
+++ b/.env.example
@@ -4,10 +4,10 @@ NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
 # Dev-only: which tenant role the UI renders as until real auth lands (admin | user)
 NEXT_PUBLIC_DEV_ROLE=admin
 
-# Mock sign-in (S-01). Signed out, the app is open and the role above applies. These two are server-side runtime
-# settings: change them on the host, no rebuild. See README.md, "Sign in (mock auth)".
-# AUTH_REQUIRED=true      send signed-out visitors to /login
-# AUTH_SECRET=            signs the session cookie; set a long random value on any deployed copy (the default is public)
+# Mock sign-in (S-01). Signing in is mandatory: signed-out visitors are sent to /login first. These two are server-side
+# runtime settings: change them on the host, no rebuild. See README.md, "Sign in (mock auth)".
+# AUTH_REQUIRED=false     open the app to signed-out visitors (the role above then applies); anything else keeps sign-in mandatory
+# AUTH_SECRET=            signs the cookie; set a long random value on any deployed copy (the default is public)
 
 # Home screen's simulated cold start ("Application loading" + startup log). On by default; "off" skips it (a warm
 # deployment). Timings are in ms. See docs/failed-cases/home-screen-startup.md.
diff --git a/CLAUDE.md b/CLAUDE.md
index d284cff..deb1349 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -9,8 +9,8 @@ The TCG backend (Go orchestration, Python core, the real AI Hub frontend) lives
 (`c:\Users\ChinthalapudiBhargav\aihub`). Work in this repo is front-end only; do not edit `aihub` from here.
 
 Today most pages are still `PagePlaceholder`s built from `TCG_BRD_Feature_Catalogue.md` (see `README.md` for layout).
-Sign-in is a mock with built-in accounts (see "Sign in" below); signed out, the role is the build-time
-`NEXT_PUBLIC_DEV_ROLE`.
+Sign-in is a mock with built-in accounts and is mandatory: the first screen a visitor sees is `/login` (see "Sign in"
+below).
 
 ## How each TCG feature touches this app
 
@@ -44,8 +44,9 @@ Sign-in is a mock with built-in accounts (see "Sign in" below); signed out, the
 - **Reachability.** TCG's crawler and Execute Scripts block private, loopback and link-local addresses (an SSRF guard,
   with a `CRAWL_ALLOWED_HOSTS` allowlist). Do not assume `localhost` or LAN URLs work; plan on a publicly reachable
   deployment, and ask the user if that is not possible.
-- Signed in, the role comes from the account (`admin@tcg.test` or `user@tcg.test`), so one deployment shows both roles.
-  Signed out it is the build-time `NEXT_PUBLIC_DEV_ROLE`.
+- Signing in is mandatory, and the role comes from the account (`admin@tcg.test` or `user@tcg.test`), so one deployment
+  shows both roles. Every test must start with a login. Only with `AUTH_REQUIRED=false` can a signed-out visitor in, with
+  the build-time `NEXT_PUBLIC_DEV_ROLE`.
 
 ## Home screen startup sequence (deliberate)
 
@@ -59,7 +60,9 @@ TC-006). Don't remove or retime it without reading that file.
 - The screen is a sibling of the app shell, not inside `<main>`. While it is up, CSS hides the shell from the
   accessibility tree (a hidden ancestor would hide the screen from TCG's snapshots too) and hides Next's route announcer
   host so the loading alert is the only `role=alert`.
-- Only Home, only a full load. Other routes and client-side navigation are unaffected.
+- Only Home, only a full load. Other routes and client-side navigation are unaffected. Sign-in is mandatory, so a
+  signed-out visit to `/` goes to `/login` first; the sequence plays on the full load of `/` that follows a sign-in (or on
+  a plain load of `/` when signed in already, or when the deployment has `AUTH_REQUIRED=false`).
 - `NEXT_PUBLIC_STARTUP_SEQUENCE=off` skips it (a warm deployment); `NEXT_PUBLIC_STARTUP_STEP_MS` and
   `NEXT_PUBLIC_STARTUP_HOLD_MS` retime it. These are build-time, so redeploy after changing them.
 - The Render logo is a placeholder (`public/render-logo.svg`), not Render's official asset.
@@ -86,15 +89,21 @@ the last three, field errors under the inputs for the first three):
 Behaviour a test can rely on:
 
 - A successful sign-in always lands on the Dashboard (A-24), by a full page load, so the Home startup screen plays first.
-- The header then shows the person's name, a role badge and a "Sign out" button; signed out it shows a "Sign in" link.
-  "Sign out" goes to `/login`. Email matching ignores case and surrounding spaces.
+- The header then shows the person's name, a role badge and a "Sign out" button. "Sign out" goes to `/login`. Email
+  matching ignores case and surrounding spaces. (The header's "Sign in" link only shows when `AUTH_REQUIRED=false` lets a
+  signed-out visitor see the shell.)
 - A signed-in person opening `/login` is sent to the Dashboard.
 - A role too low for a page gets an "Access denied" page at that same URL (status 200, because a proxy rewrite cannot
   set one). Admin-only: `/administration`, `/integrations`, `/cicd-automation`.
-- By default the app is open when signed out. `AUTH_REQUIRED=true` (a runtime setting on the host, no rebuild) sends
-  signed-out visitors to `/login` instead; the auth screens, `/api/auth/*` and static assets stay open. Turning it on
-  makes any test that reaches a page without signing in first land on `/login`, so run Execute Scripts with
-  credentials.
+- **Signing in is mandatory.** A signed-out visitor who opens any page (including `/`) is redirected to `/login`; the
+  auth screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/set-password`), `/api/auth/*` and static
+  assets stay open. So a crawl or test that reaches a page without signing in first lands on `/login`: run Execute
+  Scripts, and the crawl's optional login, with credentials. The Home startup cases in
+  `docs/failed-cases/home-screen-startup.md` now begin after a sign-in (the sign-in is a full load of `/`, so the
+  startup screen still plays).
+- `AUTH_REQUIRED=false` (a runtime setting on the host, no rebuild) reverts to an open app for signed-out visitors, who
+  get the build-time `NEXT_PUBLIC_DEV_ROLE`. Only the exact value `false` does that; unset or anything else keeps
+  sign-in mandatory.
 
 Code: `src/app/(auth)/login/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
 `src/lib/auth/`, and `src/proxy.ts` (route gating). Pages and layouts never read the cookie: that would make them
diff --git a/README.md b/README.md
index 7449b8a..e7daddf 100644
--- a/README.md
+++ b/README.md
@@ -28,7 +28,7 @@ npm run dev                  # http://localhost:3000
 | `src/app/api/auth/…`, `src/lib/auth/`, `src/proxy.ts` | Mock sign-in: login/logout/session endpoints, the signed session cookie, route gating. See "Sign in (mock auth)". |
 | `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle, who's signed in. |
 | `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
-| `src/lib/role.ts` | Tenant roles + `canAccess`. Signed out, `NEXT_PUBLIC_DEV_ROLE=admin\|user` is the role; signed in, the account's role wins. |
+| `src/lib/role.ts` | Tenant roles + `canAccess`. Signed in, the account's role wins; `NEXT_PUBLIC_DEV_ROLE=admin\|user` only applies when `AUTH_REQUIRED=false` lets a signed-out visitor in. |
 | `src/lib/api/client.ts` | Fetch wrapper for the Go BFF (`NEXT_PUBLIC_API_BASE_URL`). |
 | `src/theme.ts` | Mantine theme. Both light and dark must work. |
 
@@ -54,6 +54,10 @@ the Go BFF's signed session cookie.
 | User | `user@tcg.test` | `User#1234` | Signs in as user (no Administration, Integrations, CI/CD Automation) |
 | Locked | `locked@tcg.test` | `Locked#123` | Refused: "This account is locked. Contact your workspace admin." |
 
+**Signing in is mandatory:** a signed-out visitor who opens any page is sent to `/login` first, and only a successful
+sign-in gets them into the app. Only the auth screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`,
+`/set-password`), `/api/auth/*` and static assets are open signed out.
+
 Other outcomes: "Enter your email address.", "Enter a valid email address.", "Enter your password.", and "Invalid email
 or password." for a wrong password or unknown email. A successful sign-in always lands on the Dashboard (A-24). The
 header then shows the person's name, role and **Sign out**; the sidebar follows their role.
@@ -62,9 +66,9 @@ header then shows the person's name, role and **Sign out**; the sidebar follows
   never read the cookie, so they stay prerendered.
 - **Gating (`src/proxy.ts`):** a signed-in role too low for a page sees "Access denied" at that URL (status 200); a
   signed-in person opening `/login` goes to the Dashboard.
-- **Settings** (`.env.example`): `AUTH_REQUIRED=true` redirects signed-out visitors to `/login`. It is a runtime setting
-  (no rebuild) and off by default, so the app stays open. `AUTH_SECRET` signs the cookie; set a long random value on
-  any deployed copy.
+- **Settings** (`.env.example`): `AUTH_REQUIRED=false` opens the app to signed-out visitors (the role is then
+  `NEXT_PUBLIC_DEV_ROLE`); unset, or any other value, keeps sign-in mandatory. It is a runtime setting (no rebuild).
+  `AUTH_SECRET` signs the cookie; set a long random value on any deployed copy.
 - **Not secure:** the passwords are printed on the sign-in screen. Don't put real data behind it.
 
 ## PR diff → requirement input
diff --git a/docs/failed-cases/home-screen-startup.md b/docs/failed-cases/home-screen-startup.md
index 219d957..3f6164d 100644
--- a/docs/failed-cases/home-screen-startup.md
+++ b/docs/failed-cases/home-screen-startup.md
@@ -8,6 +8,12 @@ TCG if exact text is needed.
 local production build with Playwright, using role and accessible-name locators and TCG's 3-second retry window. **Not
 yet re-run through TCG**, so rerun the cases to confirm.
 
+**Update: sign-in is now mandatory.** These cases were recorded when a signed-out visitor could open `/` directly. A
+signed-out load of `/` now redirects to `/login`, so each case has to start by signing in (for example `admin@tcg.test` /
+`Admin#123`). The sign-in is a full page load of `/`, so the startup screen plays right after it and the checks below
+still apply from that point. To run the cases exactly as recorded, with no login first, deploy with
+`AUTH_REQUIRED=false`.
+
 ## Result
 
 - 12 test cases, 43 steps: **31 passed, 12 failed**.
diff --git a/src/config/routes.ts b/src/config/routes.ts
index b99856f..4d8129e 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -289,7 +289,7 @@ export const ROUTES: RouteDef[] = [
     path: "/login",
     title: "Sign in",
     description:
-      "Email and password against the built-in demo accounts (mock; no backend yet). A signed-in person always lands on the Dashboard.",
+      "First screen for a signed-out visitor: email and password against the built-in demo accounts (mock; no backend yet). A signed-in person always lands on the Dashboard.",
     features: ["S-01"],
     roles: "all",
     status: "in-progress",
diff --git a/src/proxy.ts b/src/proxy.ts
index e506915..548f8b4 100644
--- a/src/proxy.ts
+++ b/src/proxy.ts
@@ -7,12 +7,13 @@ import { canAccess } from "@/lib/role";
 // never do, so they stay prerendered.
 //
 //   - signed in, opening /login          -> Dashboard
-//   - signed out, AUTH_REQUIRED=true     -> /login (the auth screens themselves stay open)
+//   - signed out                         -> /login (the auth screens themselves stay open)
 //   - signed in, role too low for a page -> the "Access denied" page, served at the same URL. The status stays 200: a
 //     proxy rewrite cannot set one, and Next's forbidden() (which can) is still experimental.
 //
-// AUTH_REQUIRED is read on every request, so it is a runtime setting: change it on the host, no rebuild. It is off by
-// default, so a signed-out visitor still gets the app (with the role from NEXT_PUBLIC_DEV_ROLE).
+// Signing in is mandatory by default. AUTH_REQUIRED=false opens the app to signed-out visitors instead (with the role
+// from NEXT_PUBLIC_DEV_ROLE). It is read on every request, so it is a runtime setting: change it on the host, no
+// rebuild. Only the exact value "false" opens the app; unset or anything else keeps sign-in mandatory.
 
 // "/projects/[id]" -> /^\/projects\/[^/]+\/?$/
 const PATTERNS = ROUTES.map((route) => ({
@@ -29,7 +30,7 @@ export function proxy(request: NextRequest) {
   }
 
   if (!session) {
-    const authRequired = process.env.AUTH_REQUIRED === "true";
+    const authRequired = process.env.AUTH_REQUIRED !== "false";
     if (authRequired && !AUTH_PATHS.includes(pathname)) return redirectTo(request, "/login");
     return NextResponse.next();
   }
```
