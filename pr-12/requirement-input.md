# Change requirement input — PR #12: Add Help & Feedback form (U-39)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/12
- **Author:** Bhargav-85
- **Branch:** `feature/help-feedback` → `main`
- **Compared:** `f862c7b9ff62`...`73c3c529b1d0`
- **Generated:** 2026-11-03T07:19:49.183Z (event: pull_request/opened)

## Description

## What

`/help` was a placeholder. It is now a working form for reporting a problem, an idea or a question (catalogue U-39).

- **Fields:** Kind (radio group: Problem, Idea, Question; none chosen at first), Area (select of 13 product areas), Subject (up to 80 characters), Details (at least 10 characters, judged trimmed).
- **Messages:** "Choose a kind.", "Choose an area.", "Enter a subject.", "Subject must be 80 characters or fewer.", "Enter some details.", "Details must be at least 10 characters." Focus moves to the first wrong field.
- **Result:** a status titled "Feedback sent" (`Your problem about Reports & exports was sent: "CSV export is empty".`) and a "Send more feedback" button for a blank form.
- **Reachable:** a "Help & Feedback" link under My Work in the sidebar (same for User and Admin), so a crawl can find it.
- **Nothing is stored or sent.** There is no inbox behind this test app.
- Leaving the page and returning by client-side navigation always shows a blank form (state resets when the page is hidden, as in `ForgotPasswordForm`), so a hidden copy never feeds a stale confirmation to `getByLabel`.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels and messages.

## Why this is useful for TCG

A form with a radio group, a native select, two text fields, exact boundaries (80/81, 9/10) and a confirmation sentence that echoes the input gives generated tests real pass/fail cases, and a new sidebar link for the crawl to find.

## Checked

- `npm run lint` and `npm run build` are clean.
- 53 browser checks (Playwright against `next start`) pass: signed-out gate, screen roles and names for both roles, every message and boundary, focus order, three sends, "Send more feedback", leaving and returning, a 390px-wide screen, and no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +221 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +20 / -0 |
| M | README.md | +7 / -0 |
| M | src/app/(app)/help/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +4 / -2 |
| A | src/features/help/HelpScreen.tsx | +135 / -0 |
| A | src/features/help/data.ts | +50 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 376b77d..c2291a3 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -149,6 +149,26 @@ departments (A-26, fixed in `src/config/departments.ts` for now). Code: `src/fea
 - **Nothing is saved.** The list lives in the page, so a full reload goes back to the five seeded rows; a client-side
   navigation away and back keeps what was added.
 
+## Help & Feedback (U-39)
+
+`/help` (all roles, sidebar link "Help & Feedback" under My Work) is a form for reporting a problem, an idea or a
+question. Code: `src/features/help/`.
+
+- Heading "Help & Feedback" (level 2). Fields: "Kind" (radio group: Problem, Idea, Question; none chosen at first),
+  "Area" (select: a prompt "Select an area" then Requirements input, Requirements analysis, Scenarios, Test cases,
+  Automation scripts, Script execution, Reports & exports, Projects, Inbox, Administration, Integrations, CI/CD
+  automation, Other; the same list for both roles), "Subject" (text) and "Details" (multi-line); button "Send feedback".
+- Messages under the fields: "Choose a kind.", "Choose an area.", "Enter a subject.", "Subject must be 80 characters or
+  fewer." (81+ fails, exactly 80 passes), "Enter some details.", "Details must be at least 10 characters." (9 fails,
+  exactly 10 passes). Subject and Details are judged trimmed, so spaces alone count as empty. Focus moves to the first
+  field that is wrong, in the order Kind, Area, Subject, Details.
+- A valid form is replaced by a status titled "Feedback sent": `Your <kind in lower case> about <area> was sent:
+  "<subject, trimmed>".` (for example `Your problem about Reports & exports was sent: "CSV export is empty".`), and a
+  button "Send more feedback" that brings back a blank form.
+- **Nothing is stored or sent**; there is no inbox or reference number. Leaving the page and coming back by client-side
+  navigation always shows a blank form (state is reset when the page is hidden, as in `ForgotPasswordForm`), unlike
+  Projects, which keeps what was added.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index ab16d57..ebeff39 100644
--- a/README.md
+++ b/README.md
@@ -82,6 +82,13 @@ project goes to the top of the list. **Nothing is saved**: a full reload returns
 project's status, the project page and tabs, and Admin-maintained departments are still to do. Code lives in
 `src/features/projects/`.
 
+## Help & Feedback (U-39)
+
+`/help` (sidebar: **Help & Feedback**, all roles) is a form with a **Kind** (Problem, Idea, Question), an **Area** (13
+product areas), a **Subject** (up to 80 characters) and **Details** (at least 10). **Send feedback** shows a "Feedback
+sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox behind this test app. Code lives in
+`src/features/help/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/help/page.tsx b/src/app/(app)/help/page.tsx
index da6e679..91721c3 100644
--- a/src/app/(app)/help/page.tsx
+++ b/src/app/(app)/help/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { HelpScreen } from "@/features/help/HelpScreen";
+
+export const metadata: Metadata = { title: "Help & Feedback" };
 
 export default function Page() {
-  return <PagePlaceholder route="/help" />;
+  return <HelpScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 04aadf6..2ebcdcd 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -254,10 +254,12 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/help",
     title: "Help & Feedback",
-    description: "Submit a problem, idea or question with an area picker.",
+    description:
+      "Send a problem, an idea or a question, filed under an area of the product (mock; nothing is stored or sent anywhere).",
     features: ["U-39"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
+    nav: { group: "My Work", label: "Help & Feedback" },
   },
   {
     path: "/profile",
diff --git a/src/features/help/HelpScreen.tsx b/src/features/help/HelpScreen.tsx
new file mode 100644
index 0000000..95d1c87
--- /dev/null
+++ b/src/features/help/HelpScreen.tsx
@@ -0,0 +1,135 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import { Alert, Button, Group, NativeSelect, Radio, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
+import {
+  BLANK_DRAFT,
+  FEEDBACK_AREAS,
+  FEEDBACK_KINDS,
+  validateFeedback,
+  type FeedbackArea,
+  type FeedbackDraft,
+  type FeedbackErrors,
+  type FeedbackKind,
+} from "./data";
+
+const AREA_OPTIONS = [{ value: "", label: "Select an area" }, ...FEEDBACK_AREAS.map((a) => ({ value: a, label: a }))];
+
+interface Sent {
+  kind: FeedbackKind;
+  area: FeedbackArea;
+  subject: string;
+}
+
+// Help & Feedback (U-39): report a problem, an idea or a question, filed under an area. There is no inbox behind this
+// test app, so sending only checks the form and confirms; nothing is stored.
+export function HelpScreen() {
+  const [draft, setDraft] = useState<FeedbackDraft>(BLANK_DRAFT);
+  const [errors, setErrors] = useState<FeedbackErrors>({});
+  const [sent, setSent] = useState<Sent | null>(null);
+  const firstKindRef = useRef<HTMLInputElement>(null);
+  const areaRef = useRef<HTMLSelectElement>(null);
+  const subjectRef = useRef<HTMLInputElement>(null);
+  const detailsRef = useRef<HTMLTextAreaElement>(null);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so wipe the form then: every visit starts blank instead of showing last
+  // visit's confirmation or a half-typed message.
+  useEffect(
+    () => () => {
+      setDraft(BLANK_DRAFT);
+      setErrors({});
+      setSent(null);
+    },
+    [],
+  );
+
+  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const found = validateFeedback(draft);
+    setErrors(found);
+    if (found.kind) return firstKindRef.current?.focus();
+    if (found.area) return areaRef.current?.focus();
+    if (found.subject) return subjectRef.current?.focus();
+    if (found.details) return detailsRef.current?.focus();
+    // validateFeedback guarantees a kind and an area before this runs
+    setSent({ kind: draft.kind as FeedbackKind, area: draft.area as FeedbackArea, subject: draft.subject.trim() });
+  }
+
+  function sendAnother() {
+    setDraft(BLANK_DRAFT);
+    setErrors({});
+    setSent(null);
+  }
+
+  return (
+    <Stack gap="md" maw={560}>
+      <Title order={2}>Help &amp; Feedback</Title>
+      <Text c="dimmed">
+        Tell us about a problem, an idea or a question, and pick the area it is about so it reaches the right people.
+      </Text>
+
+      {sent ? (
+        <Stack>
+          <Alert color="green" title="Feedback sent" role="status">
+            Your {sent.kind.toLowerCase()} about {sent.area} was sent: &quot;{sent.subject}&quot;.
+          </Alert>
+          <Group>
+            <Button variant="default" onClick={sendAnother}>
+              Send more feedback
+            </Button>
+          </Group>
+        </Stack>
+      ) : (
+        <form onSubmit={onSubmit} noValidate>
+          <Stack>
+            <Radio.Group
+              label="Kind"
+              name="kind"
+              value={draft.kind}
+              onChange={(value) => setDraft({ ...draft, kind: value as FeedbackKind })}
+              error={errors.kind}
+            >
+              <Group mt="xs">
+                {FEEDBACK_KINDS.map((kind, i) => (
+                  <Radio key={kind} ref={i === 0 ? firstKindRef : undefined} value={kind} label={kind} />
+                ))}
+              </Group>
+            </Radio.Group>
+            <NativeSelect
+              ref={areaRef}
+              label="Area"
+              name="area"
+              data={AREA_OPTIONS}
+              value={draft.area}
+              onChange={(e) => setDraft({ ...draft, area: e.currentTarget.value as FeedbackArea | "" })}
+              error={errors.area}
+            />
+            <TextInput
+              ref={subjectRef}
+              label="Subject"
+              name="subject"
+              autoComplete="off"
+              value={draft.subject}
+              onChange={(e) => setDraft({ ...draft, subject: e.currentTarget.value })}
+              error={errors.subject}
+            />
+            <Textarea
+              ref={detailsRef}
+              label="Details"
+              name="details"
+              autosize
+              minRows={4}
+              value={draft.details}
+              onChange={(e) => setDraft({ ...draft, details: e.currentTarget.value })}
+              error={errors.details}
+            />
+            <Group>
+              <Button type="submit">Send feedback</Button>
+            </Group>
+          </Stack>
+        </form>
+      )}
+    </Stack>
+  );
+}
diff --git a/src/features/help/data.ts b/src/features/help/data.ts
new file mode 100644
index 0000000..b5129db
--- /dev/null
+++ b/src/features/help/data.ts
@@ -0,0 +1,50 @@
+export const FEEDBACK_KINDS = ["Problem", "Idea", "Question"] as const;
+export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
+
+// Where in the product the feedback is about (U-39). Mirrors the pipeline stages and the sidebar entries.
+export const FEEDBACK_AREAS = [
+  "Requirements input",
+  "Requirements analysis",
+  "Scenarios",
+  "Test cases",
+  "Automation scripts",
+  "Script execution",
+  "Reports & exports",
+  "Projects",
+  "Inbox",
+  "Administration",
+  "Integrations",
+  "CI/CD automation",
+  "Other",
+] as const;
+export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];
+
+export const SUBJECT_MAX = 80;
+export const DETAILS_MIN = 10;
+
+// What the Help & Feedback form collects. `kind` and `area` are "" until one is chosen.
+export interface FeedbackDraft {
+  kind: FeedbackKind | "";
+  area: FeedbackArea | "";
+  subject: string;
+  details: string;
+}
+
+export type FeedbackErrors = Partial<Record<keyof FeedbackDraft, string>>;
+
+export const BLANK_DRAFT: FeedbackDraft = { kind: "", area: "", subject: "", details: "" };
+
+// Checks the form. Subject and details are compared trimmed, so spaces alone count as empty. Returns one message per
+// field that is wrong, or {} when the feedback can be sent.
+export function validateFeedback(draft: FeedbackDraft): FeedbackErrors {
+  const errors: FeedbackErrors = {};
+  if (!draft.kind) errors.kind = "Choose a kind.";
+  if (!draft.area) errors.area = "Choose an area.";
+  const subject = draft.subject.trim();
+  if (!subject) errors.subject = "Enter a subject.";
+  else if (subject.length > SUBJECT_MAX) errors.subject = `Subject must be ${SUBJECT_MAX} characters or fewer.`;
+  const details = draft.details.trim();
+  if (!details) errors.details = "Enter some details.";
+  else if (details.length < DETAILS_MIN) errors.details = `Details must be at least ${DETAILS_MIN} characters.`;
+  return errors;
+}
```
