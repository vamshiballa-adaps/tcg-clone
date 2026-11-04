# Change requirement input — PR #16: Add Get Started tour (U-38)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/16
- **Author:** Bhargav-85
- **Branch:** `feature/get-started` → `main`
- **Compared:** `0c8ecac466f0`...`673bdc1406d9`
- **Generated:** 2026-11-04T05:17:06.171Z (event: pull_request/opened)

## Description

## What

`/get-started` was a placeholder. It is now a working five-step tour of how a run goes from requirements to test results (catalogue U-38).

- **Steps:** Create a project, Add requirements, Review the analysis, Generate test cases, Run the scripts. Each has a heading (level 3) and a short text.
- **Controls:** **Back** (disabled on step 1), **Next**, and **Finish** in place of Next on step 5. The step list is not clickable, so those buttons are the only way through.
- **Where you are:** a progress bar named "Tour progress" (20, 40, 60, 80, 100), the text "Step 1 of 5", and an ordered list with the current step marked `aria-current="step"`.
- **End:** **Finish** shows a status "Tour complete" (`You have seen all 5 steps. You can start over any time.`) and a **Start over** button.
- **Reachable:** a "Get Started" link under My Work in the sidebar, for both roles, so a crawl can find it.
- **Nothing is saved.** Every visit starts at step 1, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).
- The panel has no links on purpose: a link named like a sidebar item ("Projects") would make `getByRole("link", { name: "Projects" })` match twice on this page. The list uses short nouns and the panel uses verb phrases, so no text appears twice.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels and texts.

## Why this is useful for TCG

A multi-step flow where the same button changes (Next, then Finish), a button that is disabled on the first step, a progress bar with ARIA values and a result that depends on the path taken give generated tests real pass/fail cases beyond single forms.

## Checked

- `npm run lint` and `npm run build` are clean.
- 40 browser checks (Playwright against `next start`) pass: signed-out gate, both roles, every step's heading, text, progress and buttons, Back, Finish, Start over, leaving and returning, a full reload, keyboard Enter, a 390px-wide screen, and no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +160 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +20 / -0 |
| M | README.md | +8 / -0 |
| M | src/app/(app)/get-started/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +4 / -2 |
| A | src/features/get-started/GetStartedScreen.tsx | +86 / -0 |
| A | src/features/get-started/steps.ts | +37 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 2174aef..5414dba 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -195,6 +195,26 @@ real top-ups and a history (Token Usage, U-35, is a separate screen).
 - Statuses have a "Dismiss" button. **Nothing is saved**: a full reload returns to 100,000 / 62,400 / 37,600. A
   client-side navigation away and back keeps an admin's new allowance but drops last visit's status.
 
+## Get Started (U-38)
+
+`/get-started` (all roles, sidebar link "Get Started" under My Work, same for both roles) is a five-step tour with no
+data behind it. Code: `src/features/get-started/` (the steps are in `steps.ts`). Still to do: the Guide, Shortcuts
+and the "What next?" menu (also U-38).
+
+- Heading "Get Started" (level 2); a progress bar named "Tour progress" (value 20, 40, 60, 80, 100) and the text "Step 1
+  of 5" (a polite live region; "Tour finished" at the end); an ordered list of the steps, whose current item has
+  `aria-current="step"`.
+- The list is not clickable; **Back**, **Next** and **Finish** are the only controls. Steps (list name, then the panel
+  heading, level 3): Project / "Create a project", Requirements / "Add requirements", Analysis / "Review the analysis",
+  Test cases / "Generate test cases", Scripts / "Run the scripts". The list says the short noun and the panel the verb
+  phrase on purpose, so no text appears twice, and the panel has no links (a link named like a sidebar item would
+  make `getByRole("link", { name: "Projects" })` match twice).
+- Step 1: "Back" is disabled. Steps 1 to 4: "Next". Step 5: "Finish" replaces "Next". "Finish" replaces the panel with
+  a status "Tour complete": "You have seen all 5 steps. You can start over any time." and a button "Start over" (back to
+  step 1).
+- **Nothing is saved.** Every visit starts at step 1: a full reload, and also a client-side navigation away and back
+  (state is reset when the page is hidden, as in `ForgotPasswordForm`), so a half-finished tour is not resumed.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index 9f652b5..a4ac6d6 100644
--- a/README.md
+++ b/README.md
@@ -96,6 +96,14 @@ sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox be
 a **user** gets **Request tokens** (amount and reason; nothing moves). **Nothing is saved**: a full reload returns to the
 seeded numbers. Other plan content is still to do. Code lives in `src/features/plan/`.
 
+## Get Started (U-38)
+
+`/get-started` (sidebar: **Get Started** under My Work, all roles) is a five-step tour of how a run goes from
+requirements to test results: Create a project, Add requirements, Review the analysis, Generate test cases, Run the
+scripts. **Back**, **Next** and **Finish** move through it, a progress bar and "Step N of 5" show where you are, and
+**Finish** shows "Tour complete" with **Start over**. Nothing is saved: every visit starts at step 1. The Guide and
+Shortcuts (also U-38) are still to do. Code lives in `src/features/get-started/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/get-started/page.tsx b/src/app/(app)/get-started/page.tsx
index ef1b760..cdd36bf 100644
--- a/src/app/(app)/get-started/page.tsx
+++ b/src/app/(app)/get-started/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { GetStartedScreen } from "@/features/get-started/GetStartedScreen";
+
+export const metadata: Metadata = { title: "Get Started" };
 
 export default function Page() {
-  return <PagePlaceholder route="/get-started" />;
+  return <GetStartedScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index dc05aeb..f77aaae 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -238,10 +238,12 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/get-started",
     title: "Get Started",
-    description: "Orientation walkthrough.",
+    description:
+      "Orientation walkthrough: a five-step tour from requirements to test results (the Guide and Shortcuts are still to build).",
     features: ["U-38"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
+    nav: { group: "My Work", label: "Get Started" },
   },
   {
     path: "/guide",
diff --git a/src/features/get-started/GetStartedScreen.tsx b/src/features/get-started/GetStartedScreen.tsx
new file mode 100644
index 0000000..c8551ba
--- /dev/null
+++ b/src/features/get-started/GetStartedScreen.tsx
@@ -0,0 +1,86 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import { Alert, Box, Button, Group, Paper, Progress, Stack, Text, Title } from "@mantine/core";
+import { TOUR_STEPS } from "./steps";
+
+const LAST = TOUR_STEPS.length - 1;
+
+// Get Started (U-38): a five-step tour of how a run goes from requirements to test results. Back, Next and Finish move
+// through it; the step list is not clickable, so those buttons are the only way. Nothing is saved: the tour starts at
+// step 1 on every visit.
+export function GetStartedScreen() {
+  const [index, setIndex] = useState(0);
+  const [finished, setFinished] = useState(false);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so go back to the start then: every visit begins at step 1 instead of
+  // wherever the last one stopped.
+  useEffect(
+    () => () => {
+      setIndex(0);
+      setFinished(false);
+    },
+    [],
+  );
+
+  const step = TOUR_STEPS[index];
+  const position = finished ? TOUR_STEPS.length : index + 1;
+
+  function startOver() {
+    setIndex(0);
+    setFinished(false);
+  }
+
+  return (
+    <Stack gap="md" maw={640}>
+      <Title order={2}>Get Started</Title>
+      <Text c="dimmed">A five-step tour of how a run goes from requirements to test results.</Text>
+
+      <Progress value={(position / TOUR_STEPS.length) * 100} aria-label="Tour progress" />
+      <Text size="sm" aria-live="polite">
+        {finished ? "Tour finished" : `Step ${position} of ${TOUR_STEPS.length}`}
+      </Text>
+
+      <Box component="ol" m={0} pl="lg">
+        {TOUR_STEPS.map((s, i) => (
+          <li key={s.label} aria-current={!finished && i === index ? "step" : undefined}>
+            <Text span fw={!finished && i === index ? 700 : 400} c={!finished && i === index ? undefined : "dimmed"}>
+              {s.label}
+            </Text>
+          </li>
+        ))}
+      </Box>
+
+      {finished ? (
+        <Stack>
+          <Alert color="green" title="Tour complete" role="status">
+            You have seen all {TOUR_STEPS.length} steps. You can start over any time.
+          </Alert>
+          <Group>
+            <Button variant="default" onClick={startOver}>
+              Start over
+            </Button>
+          </Group>
+        </Stack>
+      ) : (
+        <Paper withBorder p="md">
+          <Stack gap="sm">
+            <Title order={3}>{step.title}</Title>
+            <Text>{step.text}</Text>
+            <Group justify="space-between" mt="xs">
+              <Button variant="default" onClick={() => setIndex(index - 1)} disabled={index === 0}>
+                Back
+              </Button>
+              {index < LAST ? (
+                <Button onClick={() => setIndex(index + 1)}>Next</Button>
+              ) : (
+                <Button onClick={() => setFinished(true)}>Finish</Button>
+              )}
+            </Group>
+          </Stack>
+        </Paper>
+      )}
+    </Stack>
+  );
+}
diff --git a/src/features/get-started/steps.ts b/src/features/get-started/steps.ts
new file mode 100644
index 0000000..c67cc68
--- /dev/null
+++ b/src/features/get-started/steps.ts
@@ -0,0 +1,37 @@
+export interface TourStep {
+  /** Short name in the step list. */
+  label: string;
+  /** Heading of the step panel. */
+  title: string;
+  text: string;
+}
+
+// The walkthrough on Get Started (U-38): how a run goes from requirements to test results, in the order the pipeline
+// runs (see config/pipeline.ts). The list uses short nouns and the panel uses verb phrases, so no text appears twice.
+export const TOUR_STEPS: TourStep[] = [
+  {
+    label: "Project",
+    title: "Create a project",
+    text: "Projects hold your runs and documents. Open Projects in the sidebar and choose New project.",
+  },
+  {
+    label: "Requirements",
+    title: "Add requirements",
+    text: "Start a run, name it, pick its project and add your requirements: a document, a Jira issue or a crawl of your app.",
+  },
+  {
+    label: "Analysis",
+    title: "Review the analysis",
+    text: "TCG scores the requirements for readiness and lists findings by severity. Fix what matters before you go on.",
+  },
+  {
+    label: "Test cases",
+    title: "Generate test cases",
+    text: "TCG turns the scenarios into test cases, each written as plain steps such as login, navigate and verify.",
+  },
+  {
+    label: "Scripts",
+    title: "Run the scripts",
+    text: "Optionally turn the test cases into Playwright scripts and run them against your app, with a live view of the browser.",
+  },
+];
```
