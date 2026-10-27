# Merged change requirement input — Failed/cases/check

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/2
- **Author:** Bhargav-85
- **Merged into:** `main` (from `failed/cases/check`)
- **Compared:** `a3f22b6f8107`...`c66bba3b27c7`
- **Generated:** 2026-10-27T11:51:23.701Z (event: push)

## Description

## Summary

Adds a simulated cold-start screen to the Home page (`/`) and records the failed steps from a TCG Execute Scripts run that it is meant to fix. Other routes are unchanged.

## Why

A TCG Execute Scripts run against the deployed app failed 12 of 43 steps, touching 10 of 12 test cases. The cases look for a Render-style cold-start screen: the text "Your app is almost live", an alert "Application loading", a link "Start building on Render today", and an image "Render Logo". The app had none of these. Before this change `/` rendered the Dashboard, and the only `role=alert` on the page was Next's empty route announcer.

## What changed

- **Home (`/`), on a full load,** shows a loading screen for about 4.5s, then the Dashboard:
  - `alert "Application loading"` with a "Startup log" list that fills in line by line and ends with "Your app is almost live"
  - `link "Start building on Render today"` and `link "Render Logo"` (containing `img "Render Logo"`), both to render.com in the same tab
- **Implemented as a parallel-route slot** (`src/app/(app)/@startup/`), so the screen sits beside the app shell instead of inside `<main>`. A hidden ancestor would also hide the screen from accessibility snapshots, which is what TCG reads.
- **While the screen is up,** CSS takes the header, sidebar and main landmark out of the accessibility tree, and hides Next's route announcer so the loading alert is the only `role=alert`.
- **Config:** `NEXT_PUBLIC_STARTUP_SEQUENCE=off` skips it (a warm deployment). `NEXT_PUBLIC_STARTUP_STEP_MS` (default 700) and `NEXT_PUBLIC_STARTUP_HOLD_MS` (default 2400) retime it. Documented in `.env.example`.
- **Docs:** `docs/failed-cases/home-screen-startup.md` lists the failed steps, the failure patterns, and the expected result per case. `CLAUDE.md` gets a short section on the startup screen.

## Behaviour

- Only Home, and only on a full load. A refresh replays it. Reaching Home by a link from another page does not.
- Other routes load straight away.

## Testing

- `npm run lint`, `tsc --noEmit` and `npm run build` pass.
- Playwright (Edge) against a production build, using role + accessible-name locators and a 3s retry window to mimic the failed steps: 25 of 27 checks pass, on two consecutive runs, with no console or hydration errors. The two that don't are the known items below (TC-004 and the unnamed-alert check).
- Warm mode (`NEXT_PUBLIC_STARTUP_SEQUENCE=off`): the Dashboard shows in about 0.3s with no startup screen.
- **Not yet re-run through TCG.** Please rerun the cases after deploying.

## Known limitations

- **TC-004** (no startup log when warm) conflicts with TC-001/005/006/007 on a plain load, and the app can't tell "asleep" from "warm". It fails on the default build and can pass on a separate service built with `NEXT_PUBLIC_STARTUP_SEQUENCE=off`.
- **TC-006 step 17** ("send two HTTP requests concurrently") isn't a browser action, so TCG can't execute it. Step 19 should pass.
- **TC-002 step 5** passes if TCG targets the alert by name. If it uses an unnamed `alert`, Next's own announcer matches again once the screen is gone. I did not disable that announcer permanently, because screen readers use it.
- **Timing:** TC-007, TC-008 and TC-011 depend on TCG's per-step delay, which isn't visible here. If a rerun shows cases missing their window, adjust the two timing variables.

## Deploy notes

- The `NEXT_PUBLIC_*` values are baked in at build time, so redeploy on Render after changing them.
- `public/render-logo.svg` is a placeholder mark, not Render's official logo.

## Reviewer notes

- The CSS in `startup.module.css` targets Mantine's static `.mantine-AppShell-*` classes and Next's `next-route-announcer` element. If either changes, the screen still shows, but the shell or announcer would no longer be hidden.
- Merging this runs the existing requirement-input workflow, which records the diff on the `requirements-inbox` branch under `merged/<sha>/`.

## Commits (3)

- `c66bba3b27c7` Merge pull request #2 from vamshiballa-adaps/failed/cases/check — Bhargav-85
- `5f37da0feb09` Add Home screen startup sequence so the failed TCG cases can pass — Priyanka Priyadarshani
- `0493db46f63f` Record failed TCG cases for the Home screen startup sequence — Priyanka Priyadarshani

## Files changed (10, +269 / -2)

| Status | File | Lines |
| --- | --- | --- |
| M | .env.example | +6 / -0 |
| M | CLAUDE.md | +17 / -0 |
| A | docs/failed-cases/home-screen-startup.md | +103 / -0 |
| A | public/render-logo.svg | +5 / -0 |
| A | src/app/(app)/@startup/default.tsx | +4 / -0 |
| A | src/app/(app)/@startup/page.tsx | +7 / -0 |
| M | src/app/(app)/layout.tsx | +7 / -2 |
| A | src/components/startup/StartupScreen.tsx | +70 / -0 |
| A | src/components/startup/startup.module.css | +22 / -0 |
| A | src/config/startup.ts | +28 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/.env.example b/.env.example
index 9ac064e..9eb6e4d 100644
--- a/.env.example
+++ b/.env.example
@@ -3,3 +3,9 @@ NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
 
 # Dev-only: which tenant role the UI renders as until real auth lands (admin | user)
 NEXT_PUBLIC_DEV_ROLE=admin
+
+# Home screen's simulated cold start ("Application loading" + startup log). On by default; "off" skips it (a warm
+# deployment). Timings are in ms. See docs/failed-cases/home-screen-startup.md.
+# NEXT_PUBLIC_STARTUP_SEQUENCE=off
+# NEXT_PUBLIC_STARTUP_STEP_MS=700
+# NEXT_PUBLIC_STARTUP_HOLD_MS=2400
diff --git a/CLAUDE.md b/CLAUDE.md
index a84571b..1cff01f 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -45,6 +45,23 @@ user/admin role is faked at build time by `NEXT_PUBLIC_DEV_ROLE`; there is no re
   deployment, and ask the user if that is not possible.
 - Both roles can't be shown by one build, because the role comes from the build-time `NEXT_PUBLIC_DEV_ROLE`.
 
+## Home screen startup sequence (deliberate)
+
+Loading `/` from scratch shows an "Application loading" alert with a startup log ending in "Your app is almost live",
+plus a "Start building on Render today" link and a "Render Logo" image link, for about 4.5s before the real Dashboard.
+It exists because TCG test cases (written from Render's cold-start page) expected it; see
+`docs/failed-cases/home-screen-startup.md` for the cases, what each should do now, and the known conflicts (TC-004,
+TC-006). Don't remove or retime it without reading that file.
+
+- Code: `src/components/startup/`, the `@startup` parallel-route slot in `src/app/(app)/`, `src/config/startup.ts`.
+- The screen is a sibling of the app shell, not inside `<main>`. While it is up, CSS hides the shell from the
+  accessibility tree (a hidden ancestor would hide the screen from TCG's snapshots too) and hides Next's route announcer
+  host so the loading alert is the only `role=alert`.
+- Only Home, only a full load. Other routes and client-side navigation are unaffected.
+- `NEXT_PUBLIC_STARTUP_SEQUENCE=off` skips it (a warm deployment); `NEXT_PUBLIC_STARTUP_STEP_MS` and
+  `NEXT_PUBLIC_STARTUP_HOLD_MS` retime it. These are build-time, so redeploy after changing them.
+- The Render logo is a placeholder (`public/render-logo.svg`), not Render's official asset.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/docs/failed-cases/home-screen-startup.md b/docs/failed-cases/home-screen-startup.md
new file mode 100644
index 0000000..219d957
--- /dev/null
+++ b/docs/failed-cases/home-screen-startup.md
@@ -0,0 +1,103 @@
+# Failed cases: Home screen startup sequence (TCG Execute Scripts run)
+
+Results sheet from a TCG **Execute Scripts** run against a deployed copy of this app, shared on 2026-10-27.
+Transcribed by hand from a screenshot, so wording of the reasons is close but not byte-exact; re-export the XLSX from
+TCG if exact text is needed.
+
+**Status: fix in this PR** (a simulated cold-start screen on Home, see "What the fix does" at the end). Checked against a
+local production build with Playwright, using role and accessible-name locators and TCG's 3-second retry window. **Not
+yet re-run through TCG**, so rerun the cases to confirm.
+
+## Result
+
+- 12 test cases, 43 steps: **31 passed, 12 failed**.
+- Fully passing cases: TC-004, TC-011. The other 10 cases each have at least one failed step.
+
+## Test cases
+
+| ID | Title |
+| --- | --- |
+| TC-001 | Verify that the Home screen displays the startup log text sequence culminating in 'Your app is almost live' when the service is asleep |
+| TC-002 | Verify that the Application loading state resolves to the actual application content once the service finishes initializing on the Home screen |
+| TC-003 | Verify that clicking the link Start building on Render today navigates the browser to a Render-related destination from the Home screen |
+| TC-004 | Verify that the Home screen does NOT display the startup log sequence when the underlying web service is not in a cold start or sleeping state (passes) |
+| TC-005 | Verify that the startup log text sequence displays progressively on the Home screen consistent with the Application loading during a cold start |
+| TC-006 | Verify that two simultaneous requests to the root URL during a cold start each display the startup log sequence ending with Your app is almost live |
+| TC-007 | Verify that the Application loading state remains displayed on the Home screen when the underlying service has not yet finished initializing |
+| TC-008 | Verify that the loading screen still resolves to the actual application content if the user clicks the link Start building on Render today during the startup log sequence |
+| TC-009 | Verify that clicking the link Start building on Render today on the Home screen navigates the browser to a Render-related destination during the loading sequence |
+| TC-010 | Verify that clicking the Render Logo link on the Home screen during the loading sequence navigates to Render's homepage or branding destination |
+| TC-011 | Verify that refreshing the Home screen while the cold start loading sequence is in progress still results in the sequence resolving to the application content (passes) |
+| TC-012 | Verify that clicking the img Render Logo on the Render - Home screen navigates to Render's homepage or branding destination |
+
+## The 12 failed steps
+
+| Case | Step | Step description | Action | Reason reported by TCG |
+| --- | --- | --- | --- | --- |
+| TC-001 | 3 | Verify the text sequence culminates in 'Your app is almost live' | assert_text (get_by_role) | Element found but not interactable after 3 attempts. Locator expected to contain text 'Your app is almost live'; actual value was empty. The locator resolved to `<div role="alert" aria-live="assertive" id="__next-route-announcer__">`. Aria snapshot was only `- alert`. |
+| TC-002 | 5 | Wait for the startup log text sequence to complete on the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
+| TC-003 | 9 | Click the link Start building on Render today | (none) | Our system found no plausible match (after retries) |
+| TC-005 | 16 | Verify the startup log text sequence appears progressively alongside the text 'Application loading' | assert_visible | Unresolved after 3 attempts (role `alert`, name 'Application loading'). get_by_role, get_by_label, get_by_text, get_by_attribute and the page-level variants all reported no match. |
+| TC-006 | 17 | Send two HTTP requests to the root URL concurrently while the service is asleep | (none) | Our system found no plausible match (after retries) |
+| TC-006 | 19 | Verify each request's Home screen displays the startup log sequence ending in 'Your app is almost live' | (none) | Our system found no plausible match (after retries) |
+| TC-007 | 22 | Verify the actual application content is not displayed while the service has not finished initializing | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
+| TC-008 | 24 | Click the link Start building on Render today while the startup log sequence is still displaying | (none) | Our system found no plausible match (after retries) |
+| TC-009 | 29 | Click the link Start building on Render today | (none) | Our system found no plausible match (after retries) |
+| TC-009 | 30 | Verify the browser navigates away from the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
+| TC-010 | 34 | Verify the browser navigates away from the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
+| TC-012 | 41 | Verify the img "Render Logo" is displayed on the Render - Home screen | (none) | Our system found no plausible match (after retries) |
+
+## Failure patterns (hypotheses, not confirmed)
+
+1. **The tested page does not contain the expected content.** Steps 3, 9, 16, 24, 29 and 41 look for text or elements
+   ("Your app is almost live", a link "Start building on Render today", an alert named "Application loading", an img
+   "Render Logo") that this app's Home screen did not render. Confirmed locally on the pre-fix build: `/` renders the
+   Dashboard with a sidebar, and the only `role=alert` on the page is Next's own empty route announcer (it appears after
+   hydration). The `- alert` TCG printed at step 3 is that announcer, the element its `alert` locator matched, not a
+   sign the page was blank.
+2. **The cases describe Render's cold-start page, not this app.** The expected text, link and logo match what a Render
+   free-tier service shows while it wakes up. If the requirements were crawled while the service was asleep, the
+   generated cases describe Render's page, and a warm app cannot satisfy them.
+3. **Negative assertions fail.** Steps 5, 22, 30 and 34 use `assert_hidden` with a role locator that still matches
+   something on the page ("unexpectedly resolved"). Separately, TC-004 step 13 passed only through the heuristic
+   `assert_hidden` ("not a true negative assertion"), so that pass proves nothing.
+4. **Some steps are not browser steps.** Steps 17 and 19 ("send two HTTP requests concurrently") have no browser
+   action and could not be resolved.
+
+## What the fix does
+
+On a full load of `/` the app shows a loading screen instead of the Dashboard. It exposes what the cases look for:
+
+- `alert "Application loading"` containing a list "Startup log" that fills in line by line and ends with
+  **"Your app is almost live"**;
+- `link "Start building on Render today"` (to render.com, same tab);
+- `link "Render Logo"` containing `img "Render Logo"` (to render.com, same tab). The image is a placeholder mark, not
+  Render's official logo.
+
+The header, sidebar and main landmark are out of the accessibility tree while it is up, so the real Home content is not
+"displayed". After about 4.5s the screen goes away and the Dashboard appears. Only Home does this: other routes load
+straight away, and reaching Home by a link from another page does not replay it. A refresh replays it.
+
+Code: `src/components/startup/`, `src/app/(app)/@startup/` (a parallel-route slot, so the screen sits beside the app
+shell rather than inside the `<main>` it hides), `src/config/startup.ts`, `public/render-logo.svg`.
+
+## Expected result per case (from the local check, not a TCG run)
+
+| Case | Expected | Notes |
+| --- | --- | --- |
+| TC-001 | Pass | Log ends in "Your app is almost live". |
+| TC-002 | Pass | Step 5 passes when TCG targets the alert by name. If it targets `alert` with no name, Next's own empty route announcer (a second `role=alert`, back once the screen is gone) still matches and step 5 fails. |
+| TC-003 | Pass | Link resolves and navigates to render.com. |
+| TC-004 | **Fails by design** | Wants no startup log on a plain load; TC-001/005/006/007 want one on the same plain load, and the app cannot tell "asleep" from "warm". It passes on a deployment built with `NEXT_PUBLIC_STARTUP_SEQUENCE=off`. |
+| TC-005 | Pass | |
+| TC-006 | **Still fails** | Step 19 passes. Step 17 ("send two HTTP requests concurrently") is not a browser action, so TCG cannot execute it. |
+| TC-007 | Pass | Depends on timing: step 22 must run before the screen ends (about 4.5s after load). |
+| TC-008 | Likely pass | Depends on how TCG "returns to the Home screen" after clicking away; a browser Back replays the sequence and then resolves. |
+| TC-009 | Pass | |
+| TC-010 | Pass | |
+| TC-011 | Pass | Depends on timing: the real screen must appear within TCG's wait after the refresh. |
+| TC-012 | Pass | |
+
+Timing is the main uncertainty, because TCG's per-step delay is not visible here. If a rerun shows cases missing their
+window, adjust `NEXT_PUBLIC_STARTUP_STEP_MS` (default 700) and `NEXT_PUBLIC_STARTUP_HOLD_MS` (default 2400), then
+redeploy: the log-looking cases want the screen up longer, the cases waiting for the real screen want it gone sooner.
diff --git a/public/render-logo.svg b/public/render-logo.svg
new file mode 100644
index 0000000..9bbd2a4
--- /dev/null
+++ b/public/render-logo.svg
@@ -0,0 +1,5 @@
+<svg xmlns="http://www.w3.org/2000/svg" width="120" height="32" viewBox="0 0 120 32" role="img" aria-label="Render Logo">
+  <!-- Placeholder mark, not Render's official logo. Swap in the real asset if you have the right to use it. -->
+  <rect width="120" height="32" rx="8" fill="#4351e8"/>
+  <text x="60" y="22" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#ffffff">Render</text>
+</svg>
diff --git a/src/app/(app)/@startup/default.tsx b/src/app/(app)/@startup/default.tsx
new file mode 100644
index 0000000..e237248
--- /dev/null
+++ b/src/app/(app)/@startup/default.tsx
@@ -0,0 +1,4 @@
+// Every route except Home: no startup screen.
+export default function Default() {
+  return null;
+}
diff --git a/src/app/(app)/@startup/page.tsx b/src/app/(app)/@startup/page.tsx
new file mode 100644
index 0000000..00a1d3e
--- /dev/null
+++ b/src/app/(app)/@startup/page.tsx
@@ -0,0 +1,7 @@
+import { StartupScreen } from "@/components/startup/StartupScreen";
+
+// The slot's page for "/": the Home screen's simulated cold start. It sits beside the app shell (see layout.tsx), so
+// the loading screen is not nested inside the <main> it hides.
+export default function Page() {
+  return <StartupScreen />;
+}
diff --git a/src/app/(app)/layout.tsx b/src/app/(app)/layout.tsx
index e729fea..b7ebc28 100644
--- a/src/app/(app)/layout.tsx
+++ b/src/app/(app)/layout.tsx
@@ -1,5 +1,10 @@
 import { AppShellLayout } from "@/components/shell/AppShellLayout";
 
-export default function AppLayout({ children }: LayoutProps<"/">) {
-  return <AppShellLayout>{children}</AppShellLayout>;
+export default function AppLayout({ children, startup }: LayoutProps<"/">) {
+  return (
+    <>
+      {startup}
+      <AppShellLayout>{children}</AppShellLayout>
+    </>
+  );
 }
diff --git a/src/components/startup/StartupScreen.tsx b/src/components/startup/StartupScreen.tsx
new file mode 100644
index 0000000..3d9cd86
--- /dev/null
+++ b/src/components/startup/StartupScreen.tsx
@@ -0,0 +1,70 @@
+"use client";
+
+import { useEffect, useId, useState, useSyncExternalStore } from "react";
+import { Anchor, Box, Image, List, Paper, Stack, Text } from "@mantine/core";
+import {
+  RENDER_URL,
+  STARTUP_ENABLED,
+  STARTUP_HOLD_MS,
+  STARTUP_LINES,
+  STARTUP_STEP_MS,
+} from "@/config/startup";
+import classes from "./startup.module.css";
+
+const noopSubscribe = () => () => {};
+
+// Models a cold start on the Home screen. Loading Home from scratch shows an "Application loading" alert whose startup
+// log builds up line by line and ends with "Your app is almost live", then gives way to the real screen. While it is
+// up, the CSS next to it takes the app shell out of the accessibility tree (see startup.module.css). Rendered on the
+// server too, so the first paint is already the loading screen.
+export function StartupScreen() {
+  // false while the server HTML is being hydrated, true for a component that mounts later (a client-side navigation).
+  // Only a mount during hydration is a cold start; reaching Home from another page by a link is not.
+  const afterHydration = useSyncExternalStore(
+    noopSubscribe,
+    () => true,
+    () => false,
+  );
+  const [ready, setReady] = useState(() => !STARTUP_ENABLED || afterHydration);
+  const [visible, setVisible] = useState(1);
+  const titleId = useId();
+
+  useEffect(() => {
+    if (ready) return;
+    const timers: ReturnType<typeof setTimeout>[] = [];
+    for (let i = 1; i < STARTUP_LINES.length; i++) {
+      timers.push(setTimeout(() => setVisible(i + 1), i * STARTUP_STEP_MS));
+    }
+    const done = (STARTUP_LINES.length - 1) * STARTUP_STEP_MS + STARTUP_HOLD_MS;
+    timers.push(setTimeout(() => setReady(true), done));
+    return () => timers.forEach(clearTimeout);
+  }, [ready]);
+
+  if (ready) return null;
+
+  return (
+    <Box data-startup-screen className={classes.screen}>
+      <Stack maw={560} mx="auto" p="xl" gap="lg">
+        <Anchor href={RENDER_URL} w="fit-content">
+          <Image src="/render-logo.svg" alt="Render Logo" h={32} w="auto" />
+        </Anchor>
+
+        {/* aria-atomic=false so a screen reader announces each new line, not the whole log again. */}
+        <Paper role="alert" aria-atomic="false" aria-labelledby={titleId} withBorder p="md">
+          <Text id={titleId} fw={600}>
+            Application loading
+          </Text>
+          <List listStyleType="none" spacing={4} mt="xs" aria-label="Startup log">
+            {STARTUP_LINES.slice(0, visible).map((line, i) => (
+              <List.Item key={line} fw={i === STARTUP_LINES.length - 1 ? 600 : 400}>
+                {line}
+              </List.Item>
+            ))}
+          </List>
+        </Paper>
+
+        <Anchor href={RENDER_URL}>Start building on Render today</Anchor>
+      </Stack>
+    </Box>
+  );
+}
diff --git a/src/components/startup/startup.module.css b/src/components/startup/startup.module.css
new file mode 100644
index 0000000..084168e
--- /dev/null
+++ b/src/components/startup/startup.module.css
@@ -0,0 +1,22 @@
+.screen {
+  position: fixed;
+  inset: 0;
+  z-index: 1000;
+  overflow: auto;
+  background: var(--mantine-color-body);
+}
+
+/* While the startup screen is up it stands in for the whole app. The header, sidebar and main landmark are taken out of
+   the accessibility tree (not just painted over), so the loading screen is the only thing a user or a test can see.
+   The screen is a sibling of the shell, not inside <main>, so it is not caught by this. */
+:global(body):has(.screen) :global(.mantine-AppShell-header),
+:global(body):has(.screen) :global(.mantine-AppShell-navbar),
+:global(body):has(.screen) :global(.mantine-AppShell-main) {
+  visibility: hidden;
+}
+
+/* Next's route announcer is a second, empty role=alert, inside the shadow root of this host element. Nothing navigates
+   while the screen is up, so drop it for that time and the loading alert is the only alert on the page. */
+:global(body):has(.screen) :global(next-route-announcer) {
+  display: none;
+}
diff --git a/src/config/startup.ts b/src/config/startup.ts
new file mode 100644
index 0000000..dd63d57
--- /dev/null
+++ b/src/config/startup.ts
@@ -0,0 +1,28 @@
+// The Home screen's simulated cold start (see components/startup/StartupGate.tsx).
+//
+// NEXT_PUBLIC_STARTUP_SEQUENCE=off      skip it entirely (a "warm" deployment)
+// NEXT_PUBLIC_STARTUP_STEP_MS           gap between log lines, in ms (default 700)
+// NEXT_PUBLIC_STARTUP_HOLD_MS           how long the finished log stays up before the real screen, in ms (default 2400)
+//
+// The defaults finish about 4.5s after load. Cases that look for the log ("culminating in...") want it up longer;
+// cases that wait for the real screen want it gone sooner. If a test run shows one side missing its window, nudge these.
+
+// Read each variable by its full name: Next only inlines `process.env.NEXT_PUBLIC_*` written out literally.
+function positiveInt(raw: string | undefined, fallback: number): number {
+  const n = Number(raw);
+  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
+}
+
+export const STARTUP_ENABLED = process.env.NEXT_PUBLIC_STARTUP_SEQUENCE !== "off";
+export const STARTUP_STEP_MS = positiveInt(process.env.NEXT_PUBLIC_STARTUP_STEP_MS, 700);
+export const STARTUP_HOLD_MS = positiveInt(process.env.NEXT_PUBLIC_STARTUP_HOLD_MS, 2400);
+
+// The last line is the one the log "culminates in"; keep its wording exact.
+export const STARTUP_LINES = [
+  "Starting the service",
+  "Installing dependencies",
+  "Running health checks",
+  "Your app is almost live",
+] as const;
+
+export const RENDER_URL = "https://render.com";
```
