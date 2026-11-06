# Merged change requirement input — Add Guide with pipeline accordion, standards and glossary (U-38)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/20
- **Author:** Bhargav-85
- **Merged into:** `main` (from `feature/guide`)
- **Compared:** `7d824b27ae5c`...`244af4ede5cb`
- **Generated:** 2026-11-06T11:20:04.468Z (event: push)

## Description

## What

`/guide` was a placeholder. It is now a working Guide screen (catalogue U-38; Shortcuts and the "What next?" menu are still to do): read-only help with three tabs.

- **Tabs:** a tab list named "Guide sections" with "Pipeline" (selected first), "Standards" and "Glossary". Arrow keys move between tabs and select them. Only the open tab's content is in the page, so nothing hidden can answer a locator.
- **Pipeline:** heading "Pipeline at a glance" and an accordion of the seven stages, named exactly as on the pipeline rail: Requirements Input, Requirements Analysis, Scenario Analyzer, Generate Test Cases, Generate Automation Scripts, Execute Scripts, Reports & Exports. Each is a button with `aria-expanded`, all closed at first. **Only one stage is open at a time**: opening another closes the open one, and clicking the open one closes it. The two optional stages start their text with "Optional.".
- **Standards:** ISO/IEC/IEEE 29148, ISO/IEC/IEEE 29119-4, ISTQB and IREB, as a term/definition list.
- **Glossary:** a box labelled "Search glossary", the line "Showing N of 9 terms" and nine terms in alphabetical order. The search matches the term or its meaning, ignoring case and surrounding spaces ("test" leaves five terms, "trace" leaves Traceability). With no match, `No terms match "zzz".` replaces the list.
- **Reachable:** a new "Guide" link under My Work in the sidebar, for both roles. The Get Started notes that said the Guide was still to do are corrected.
- **Nothing is saved.** Every visit starts on Pipeline with every stage closed and an empty search, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).

Docs: a new section in `README.md` and `CLAUDE.md` with the exact labels and counts.

## Why this is useful for TCG

It is the app's first page of ARIA tabs and its first accordion, the two control types a crawl is told to follow ("tabs, menus, tap to open"). A crawl reaches different content depending on which tab it opens, an accordion that closes its sibling gives a script a state to assert, and the glossary search adds a filter inside a tab.

## Merge safety

Branched from the current `main` (`ab6ffad`). No merge conflicts with `main`, and none with any other open branch (`feature/token-usage`, `feature/my-time`, `feature/compare-docs`, `feature/team-activity`), checked pair by pair. Merging all five in either of two opposite orders gives an identical tree. Docs are added before the Profile sections; the only other lines touched in shared files are this feature's own route entry and the Get Started "still to do" notes.

## Checked

- `eslint`, `tsc --noEmit` and `npm run build` are clean, on this branch and on all five open branches merged together.
- 47 browser checks (Playwright against `next dev`) pass, for both roles: the sidebar link, tab selection and arrow-key navigation, the seven stages in order, one open at a time, each glossary search case, leaving and returning by client-side navigation, and the signed-out redirect to `/login`. The accessibility tree shows a named tablist, `tab` roles with `selected`, and `button` roles with `expanded`.
- Not checked: a narrow (phone-width) screen, and `next start` rather than `next dev`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Commits (2)

- `244af4ede5cb` Merge pull request #20 from vamshiballa-adaps/feature/guide — Bhargav-85
- `9dd578ac24d9` Add Guide with pipeline accordion, standards and glossary (U-38) — Chinthalapudi Bhargav

## Files changed (6, +238 / -9)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +25 / -2 |
| M | README.md | +9 / -2 |
| M | src/app/(app)/guide/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +5 / -3 |
| A | src/features/guide/GuideScreen.tsx | +120 / -0 |
| A | src/features/guide/data.ts | +74 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index b522223..5976da2 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -222,8 +222,8 @@ went. Code: `src/features/token-usage/` (the rows are in `data.ts`). Still to do
 ## Get Started (U-38)
 
 `/get-started` (all roles, sidebar link "Get Started" under My Work, same for both roles) is a five-step tour with no
-data behind it. Code: `src/features/get-started/` (the steps are in `steps.ts`). Still to do: the Guide, Shortcuts
-and the "What next?" menu (also U-38).
+data behind it. Code: `src/features/get-started/` (the steps are in `steps.ts`). Still to do: Shortcuts and the "What
+next?" menu (also U-38); the Guide is its own page, below.
 
 - Heading "Get Started" (level 2); a progress bar named "Tour progress" (value 20, 40, 60, 80, 100) and the text "Step 1
   of 5" (a polite live region; "Tour finished" at the end); an ordered list of the steps, whose current item has
@@ -239,6 +239,29 @@ and the "What next?" menu (also U-38).
 - **Nothing is saved.** Every visit starts at step 1: a full reload, and also a client-side navigation away and back
   (state is reset when the page is hidden, as in `ForgotPasswordForm`), so a half-finished tour is not resumed.
 
+## Guide (U-38)
+
+`/guide` (all roles, sidebar link "Guide" under My Work, same for both roles) is read-only help with three tabs, and the
+app's one page of tabs and an accordion. Code: `src/features/guide/` (the text is in `data.ts`). Still to do: Shortcuts
+and the "What next?" menu (also U-38).
+
+- Heading "Guide" (level 2); a tab list named "Guide sections" with the tabs "Pipeline" (selected first), "Standards"
+  and "Glossary". Only the open tab's content is in the page (`keepMounted` is off), so nothing hidden can answer a
+  locator. Arrow keys move between tabs and select them.
+- **Pipeline:** heading "Pipeline at a glance" (level 3) and an accordion of the seven stages, named exactly as on the
+  pipeline rail (`src/config/pipeline.ts`): Requirements Input, Requirements Analysis, Scenario Analyzer, Generate Test
+  Cases, Generate Automation Scripts, Execute Scripts, Reports & Exports. Each is a button with `aria-expanded`, all
+  closed at first. **Only one is open at a time**: opening another closes the open one, and clicking the open one
+  closes it. The two optional stages start their text with "Optional.".
+- **Standards:** heading "Standards the platform follows" and a term/definition list: ISO/IEC/IEEE 29148, ISO/IEC/IEEE
+  29119-4, ISTQB, IREB.
+- **Glossary:** heading "Glossary", a box labelled "Search glossary", a polite line "Showing N of 9 terms" and nine terms
+  in alphabetical order (Assumption, Coverage, Incremental run, Readiness score, Requirement, Scenario, Test case, Test
+  type, Traceability). The search matches the term or its meaning, ignoring case and surrounding spaces (for example
+  "test" leaves five terms, "trace" leaves Traceability). Nothing matching: `No terms match "zzz".` replaces the list.
+- **Nothing is saved**, and every visit starts on Pipeline with every stage closed and an empty search: a full reload,
+  and also a client-side navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).
+
 ## Profile (U-40, U-44)
 
 `/profile` (all roles, sidebar link "Profile" under My Work) shows the signed-in account, lets the person edit their
diff --git a/README.md b/README.md
index 794e43c..150ee1f 100644
--- a/README.md
+++ b/README.md
@@ -108,8 +108,15 @@ up here. Nothing is saved. The top-up history is still to do. Code lives in `src
 `/get-started` (sidebar: **Get Started** under My Work, all roles) is a five-step tour of how a run goes from
 requirements to test results: Create a project, Add requirements, Review the analysis, Generate test cases, Run the
 scripts. **Back**, **Next** and **Finish** move through it, a progress bar and "Step N of 5" show where you are, and
-**Finish** shows "Tour complete" with **Start over**. Nothing is saved: every visit starts at step 1. The Guide and
-Shortcuts (also U-38) are still to do. Code lives in `src/features/get-started/`.
+**Finish** shows "Tour complete" with **Start over**. Nothing is saved: every visit starts at step 1. Shortcuts (also
+U-38) is still to do; the Guide is its own page, below. Code lives in `src/features/get-started/`.
+
+## Guide (U-38)
+
+`/guide` (sidebar: **Guide** under My Work, all roles) is read-only help with three tabs: **Pipeline** (an accordion of
+the seven stages, one open at a time), **Standards** (ISO/IEC/IEEE 29148 and 29119-4, ISTQB, IREB) and **Glossary** (nine
+terms with a search box). Nothing is saved: every visit starts on Pipeline with every stage closed. Code lives in
+`src/features/guide/`.
 
 ## Profile (U-40, U-44)
 
diff --git a/src/app/(app)/guide/page.tsx b/src/app/(app)/guide/page.tsx
index 9b8da92..76aec1a 100644
--- a/src/app/(app)/guide/page.tsx
+++ b/src/app/(app)/guide/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { GuideScreen } from "@/features/guide/GuideScreen";
+
+export const metadata: Metadata = { title: "Guide" };
 
 export default function Page() {
-  return <PagePlaceholder route="/guide" />;
+  return <GuideScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 509d61a..22869cb 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -241,7 +241,7 @@ export const ROUTES: RouteDef[] = [
     path: "/get-started",
     title: "Get Started",
     description:
-      "Orientation walkthrough: a five-step tour from requirements to test results (the Guide and Shortcuts are still to build).",
+      "Orientation walkthrough: a five-step tour from requirements to test results (Shortcuts and the What next menu are still to build).",
     features: ["U-38"],
     roles: "all",
     status: "in-progress",
@@ -250,10 +250,12 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/guide",
     title: "Guide",
-    description: "In-app guide of the pipeline and ISO / ISTQB / IREB standards.",
+    description:
+      "In-app guide with three tabs: the pipeline stage by stage (an accordion), the ISO / ISTQB / IREB standards, and a searchable glossary.",
     features: ["U-38"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
+    nav: { group: "My Work", label: "Guide" },
   },
   {
     path: "/help",
diff --git a/src/features/guide/GuideScreen.tsx b/src/features/guide/GuideScreen.tsx
new file mode 100644
index 0000000..a4c05c7
--- /dev/null
+++ b/src/features/guide/GuideScreen.tsx
@@ -0,0 +1,120 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import { Accordion, Box, Paper, Stack, Tabs, Text, TextInput, Title } from "@mantine/core";
+import { filterGlossary, GLOSSARY, GUIDE_STAGES, STANDARDS } from "./data";
+
+const FIRST_TAB = "pipeline";
+
+// Guide (U-38): the pipeline stage by stage, the standards behind it and a small glossary. Read-only content with three
+// controls worth testing: tabs, an accordion that keeps one stage open at a time, and a glossary search. All state lives
+// in this component only.
+export function GuideScreen() {
+  const [tab, setTab] = useState<string>(FIRST_TAB);
+  const [openStage, setOpenStage] = useState<string | null>(null);
+  const [query, setQuery] = useState("");
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so go back to the first tab, closed stages and an empty search then.
+  useEffect(
+    () => () => {
+      setTab(FIRST_TAB);
+      setOpenStage(null);
+      setQuery("");
+    },
+    [],
+  );
+
+  const terms = filterGlossary(GLOSSARY, query);
+
+  return (
+    <Stack gap="md" maw={760}>
+      <Title order={2}>Guide</Title>
+      <Text c="dimmed">How a run goes from requirements to test results, and the standards it follows.</Text>
+
+      {/* keepMounted off: only the open tab's content is in the page, so nothing hidden can answer a locator. */}
+      <Tabs value={tab} onChange={(value) => setTab(value ?? FIRST_TAB)} keepMounted={false}>
+        <Tabs.List aria-label="Guide sections">
+          <Tabs.Tab value="pipeline">Pipeline</Tabs.Tab>
+          <Tabs.Tab value="standards">Standards</Tabs.Tab>
+          <Tabs.Tab value="glossary">Glossary</Tabs.Tab>
+        </Tabs.List>
+
+        <Tabs.Panel value="pipeline" pt="md">
+          <Stack gap="sm">
+            <Title order={3}>Pipeline at a glance</Title>
+            <Text size="sm" c="dimmed">
+              Open a stage to read what it does. Only one stage is open at a time.
+            </Text>
+            <Accordion value={openStage} onChange={setOpenStage} variant="separated">
+              {GUIDE_STAGES.map((stage) => (
+                <Accordion.Item key={stage.value} value={stage.value}>
+                  <Accordion.Control>{stage.label}</Accordion.Control>
+                  <Accordion.Panel>{stage.summary}</Accordion.Panel>
+                </Accordion.Item>
+              ))}
+            </Accordion>
+          </Stack>
+        </Tabs.Panel>
+
+        <Tabs.Panel value="standards" pt="md">
+          <Stack gap="sm">
+            <Title order={3}>Standards the platform follows</Title>
+            <Paper withBorder p="md">
+              <Box component="dl" m={0}>
+                <Stack gap="md">
+                  {STANDARDS.map((s) => (
+                    <div key={s.name}>
+                      <Text component="dt" fw={600}>
+                        {s.name}
+                      </Text>
+                      <Text component="dd" m={0}>
+                        {s.text}
+                      </Text>
+                    </div>
+                  ))}
+                </Stack>
+              </Box>
+            </Paper>
+          </Stack>
+        </Tabs.Panel>
+
+        <Tabs.Panel value="glossary" pt="md">
+          <Stack gap="sm">
+            <Title order={3}>Glossary</Title>
+            <TextInput
+              label="Search glossary"
+              name="glossary-search"
+              autoComplete="off"
+              value={query}
+              onChange={(e) => setQuery(e.currentTarget.value)}
+            />
+            <Text size="sm" c="dimmed" aria-live="polite">
+              Showing {terms.length} of {GLOSSARY.length} terms
+            </Text>
+            {terms.length === 0 ? (
+              <Text>No terms match &quot;{query.trim()}&quot;.</Text>
+            ) : (
+              <Paper withBorder p="md">
+                <Box component="dl" m={0}>
+                  <Stack gap="md">
+                    {terms.map((t) => (
+                      <div key={t.term}>
+                        <Text component="dt" fw={600}>
+                          {t.term}
+                        </Text>
+                        <Text component="dd" m={0}>
+                          {t.meaning}
+                        </Text>
+                      </div>
+                    ))}
+                  </Stack>
+                </Box>
+              </Paper>
+            )}
+          </Stack>
+        </Tabs.Panel>
+      </Tabs>
+    </Stack>
+  );
+}
diff --git a/src/features/guide/data.ts b/src/features/guide/data.ts
new file mode 100644
index 0000000..9395d91
--- /dev/null
+++ b/src/features/guide/data.ts
@@ -0,0 +1,74 @@
+import { PIPELINE_STAGES } from "@/config/pipeline";
+
+// What the Guide (U-38) says about each stage. Keyed by the step number in config/pipeline.ts, so the accordion always
+// lists exactly the stages the pipeline rail does, under the same names.
+const STAGE_SUMMARY: Record<number, string> = {
+  1: "Supply the requirements: typed or dictated text, documents, Jira, Confluence, a crawl of a live application or a questionnaire. Any one source is enough to continue.",
+  2: "Scores the requirements for readiness against ISO/IEC/IEEE 29148 and lists findings by severity and dimension. The verdict is Ready (75 or more), Proceed with caution (50 to 74) or Not ready (below 50).",
+  3: "Turns the requirements into scenarios derived per ISO/IEC/IEEE 29119-4. Review them, filter by test type, edit, add or merge, and choose which test types to generate.",
+  4: "Expands each scenario into executable test cases, tracked live through seven steps from Parse to Done. The result is a table you can search and open row by row.",
+  5: "Optional. Converts the test cases into Playwright code: pick the suite, framework and mode, review each script, regenerate one and download a ZIP.",
+  6: "Optional. Runs the test cases against a target URL in a real browser, with a live video view, a step log and a CSV of results.",
+  7: "Per-run reporting across Summary, Documents, Conversation, Requirements, Scenarios, Test cases and Coverage, with PDF, CSV, Excel and Word exports.",
+};
+
+export interface GuideStage {
+  value: string; // accordion item value
+  label: string; // the stage's name, as on the pipeline rail
+  summary: string;
+}
+
+export const GUIDE_STAGES: GuideStage[] = PIPELINE_STAGES.map((s) => ({
+  value: `stage-${s.step}`,
+  label: s.label,
+  summary: STAGE_SUMMARY[s.step],
+}));
+
+export interface Standard {
+  name: string;
+  text: string;
+}
+
+export const STANDARDS: Standard[] = [
+  {
+    name: "ISO/IEC/IEEE 29148",
+    text: "Requirements engineering. Requirements Analysis scores each requirement for readiness against it and groups findings by dimension: Testability, Clarity, Consistency, Completeness, Atomicity and Identifiability.",
+  },
+  {
+    name: "ISO/IEC/IEEE 29119-4",
+    text: "Test techniques. The Scenario Analyzer derives scenarios with techniques such as equivalence partitioning, boundary value analysis and decision tables.",
+  },
+  {
+    name: "ISTQB",
+    text: "The testing glossary behind the terms used across the platform, such as test case, test condition and coverage.",
+  },
+  {
+    name: "IREB",
+    text: "The requirements engineering body of knowledge behind how requirements are elicited, written and checked.",
+  },
+];
+
+export interface GlossaryTerm {
+  term: string;
+  meaning: string;
+}
+
+// Alphabetical, as shown.
+export const GLOSSARY: GlossaryTerm[] = [
+  { term: "Assumption", meaning: "Something the analysis guessed about a requirement. You mark it True or Not true before scenarios are built." },
+  { term: "Coverage", meaning: "How many requirements have at least one scenario and one test case." },
+  { term: "Incremental run", meaning: "A run built on an earlier one, where only the changed requirements go through the pipeline again." },
+  { term: "Readiness score", meaning: "The score from Requirements Analysis. 75 or more means Ready." },
+  { term: "Requirement", meaning: "A statement of something the application must do or be, written so that it can be checked." },
+  { term: "Scenario", meaning: "A situation, derived from one or more requirements, that a test should cover." },
+  { term: "Test case", meaning: "Steps, test data and an expected result that verify one scenario." },
+  { term: "Test type", meaning: "A category such as functional, boundary or negative that tags a scenario." },
+  { term: "Traceability", meaning: "The link from each test case back to the requirement it checks." },
+];
+
+// Matches the term or its meaning, ignoring case and surrounding spaces.
+export function filterGlossary(terms: GlossaryTerm[], query: string): GlossaryTerm[] {
+  const q = query.trim().toLowerCase();
+  if (!q) return terms;
+  return terms.filter((t) => t.term.toLowerCase().includes(q) || t.meaning.toLowerCase().includes(q));
+}
```
