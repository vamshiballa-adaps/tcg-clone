# Change requirement input — PR #21: Add Compare Docs with a computed version diff (U-28)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/21
- **Author:** Bhargav-85
- **Branch:** `feature/compare-docs` → `main`
- **Compared:** `ab6ffadbf077`...`294adbdc695f`
- **Generated:** 2026-11-05T04:41:02.397Z (event: pull_request/opened)

## Description

## What

`/utilities/compare-docs` was a placeholder. It is now a working Compare Docs screen (catalogue U-28; there is no AI-written report yet): pick a document and two of its versions and read what changed.

- **Form:** selects "Document" (a prompt "Select a document", then Payments Gateway Requirements, Customer Portal Requirements, Mobile Onboarding Requirements), "From version" and "To version" (a prompt "Select a version", then v1, v2, v3), and a button **Compare versions**. Nothing is chosen at first and no report shows.
- **Validation:** "Choose a document.", "Choose a starting version.", "Choose an ending version.", "Choose two different versions." (the same version twice) and "The starting version must be older than the ending version." (for example v3 to v1; these two show under To version). Focus goes to the first wrong field, in the order Document, From, To.
- **Report:** a section "Comparison report" with `<document>: <from> to <to>`, a status "N added, N removed, N modified." and three lists under the headings "Added (N)", "Removed (N)" and "Modified (N)", each item `R<n>: <text>` (a modified one shows "Before:" and "After:"), or "None." when a list is empty. Passages are matched by reference (R1, R2, ...). When nothing differs the status reads "0 added, 0 removed, 0 modified." and "No differences between these versions." replaces the three lists.
- **The report always matches the selection:** changing any select removes it.
- **Figures a test can rely on:** Payments Gateway v1 to v3 is "2 added, 1 removed, 2 modified." (R5 and R6 added, R3 removed, R2 and R4 modified); v1 to v2 is "1 added, 0 removed, 1 modified."; v2 to v3 is "1 added, 1 removed, 1 modified.". Customer Portal v2 to v3 has no differences, and v1 to v3 is "0 added, 0 removed, 1 modified.". Mobile Onboarding v1 to v3 is "2 added, 1 removed, 1 modified.".
- **Reachable:** the existing "Compare Docs" link under My Work, for both roles (same for both).
- **Nothing is saved.** Every visit starts blank, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).

Docs: a new section in `README.md` and `CLAUDE.md` with the exact labels, messages and figures.

## Why this is useful for TCG

Three dependent selects, a rule between two of them (different, and the first older), an output that is computed from the selection rather than canned, and three different "empty" outcomes (an empty list, no differences at all, and no report) give generated tests real pass and fail cases. It is also the app's first read-only result that disappears when its inputs change.

## Merge safety

Branched from the current `main` (`ab6ffad`). No merge conflicts with `main`, and none with any other open branch (`feature/token-usage`, `feature/my-time`, `feature/guide`, `feature/team-activity`), checked pair by pair. Merging all five in either of two opposite orders gives an identical tree. Docs are added before the Help & Feedback sections; the only other shared-file lines touched are this feature's own route entry.

## Checked

- `eslint`, `tsc --noEmit` and `npm run build` are clean, on this branch and on all five open branches merged together.
- 49 browser checks (Playwright against `next dev`) pass, for both roles: the option lists, all five messages and their focus, every document and version pair above, the empty and "no differences" outcomes, the report being removed when a select changes, leaving and returning by client-side navigation, and the signed-out redirect to `/login`.
- Not checked: a narrow (phone-width) screen, and `next start` rather than `next dev`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +361 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +26 / -0 |
| M | README.md | +8 / -0 |
| M | src/app/(app)/utilities/compare-docs/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +3 / -2 |
| A | src/features/compare-docs/CompareDocsScreen.tsx | +176 / -0 |
| A | src/features/compare-docs/data.ts | +143 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 394bcc9..870928f 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -149,6 +149,32 @@ departments (A-26, fixed in `src/config/departments.ts` for now). Code: `src/fea
 - **Nothing is saved.** The list lives in the page, so a full reload goes back to the five seeded rows; a client-side
   navigation away and back keeps what was added.
 
+## Compare Docs (U-28)
+
+`/utilities/compare-docs` (all roles, sidebar link "Compare Docs" under My Work, same for both roles) shows what changed
+between two versions of a document. Code: `src/features/compare-docs/` (the documents and the comparison are in
+`data.ts`). Still to do: the AI-written report and real documents; the versions are seeded and the changes are computed
+by passage reference, so there is no model behind it.
+
+- Heading "Compare Docs" (level 2); section "Compare two versions" (level 3) with selects "Document" (a prompt "Select a
+  document", then Payments Gateway Requirements, Customer Portal Requirements, Mobile Onboarding Requirements), "From
+  version" and "To version" (a prompt "Select a version", then v1, v2, v3) and a button "Compare versions". Nothing is
+  chosen at first and no report shows.
+- Messages under the fields: "Choose a document.", "Choose a starting version.", "Choose an ending version.", "Choose two
+  different versions." (the same version twice) and "The starting version must be older than the ending version." (v3 to
+  v1; the last two show under To version). Focus goes to the first wrong field, in the order Document, From, To.
+- A valid form shows a section "Comparison report" (level 3): `<document>: <from> to <to>`, a status "N added, N removed, N
+  modified." and three lists under level 4 headings "Added (N)", "Removed (N)" and "Modified (N)", each `R<n>: <text>`
+  (a modified one shows "Before:" and "After:"), or "None." when empty. Passages are matched by reference (R1, R2, ...).
+  When nothing differs the status reads "0 added, 0 removed, 0 modified." and "No differences between these versions."
+  replaces the three lists. **Changing any select removes the report**, so it always matches what is chosen.
+- What a test can rely on: Payments Gateway v1 to v3 is "2 added, 1 removed, 2 modified." (R5 and R6 added, R3 removed,
+  R2 and R4 modified); v1 to v2 is "1 added, 0 removed, 1 modified."; v2 to v3 is "1 added, 1 removed, 1 modified.".
+  Customer Portal v2 to v3 has no differences; v1 to v3 is "0 added, 0 removed, 1 modified.". Mobile Onboarding v1 to v3
+  is "2 added, 1 removed, 1 modified.".
+- **Nothing is saved**, and every visit starts blank: a full reload, and also a client-side navigation away and back
+  (state is reset when the page is hidden, as in `ForgotPasswordForm`).
+
 ## Help & Feedback (U-39)
 
 `/help` (all roles, sidebar link "Help & Feedback" under My Work) is a form for reporting a problem, an idea or a
diff --git a/README.md b/README.md
index 4fe8183..d100143 100644
--- a/README.md
+++ b/README.md
@@ -82,6 +82,14 @@ project goes to the top of the list. **Nothing is saved**: a full reload returns
 project's status, the project page and tabs, and Admin-maintained departments are still to do. Code lives in
 `src/features/projects/`.
 
+## Compare Docs (U-28)
+
+`/utilities/compare-docs` (sidebar: **Compare Docs** under My Work, all roles) compares two versions of a document: pick
+a **Document**, a **From version** and a **To version** (v1 to v3) and **Compare versions** lists the passages that were
+added, removed and modified, matched by reference (R1, R2, ...). The documents are seeded and the changes are computed,
+so there is no AI report yet. The two versions must differ and the first must be older. Nothing is saved. Code lives in
+`src/features/compare-docs/`.
+
 ## Help & Feedback (U-39)
 
 `/help` (sidebar: **Help & Feedback**, all roles) is a form with a **Kind** (Problem, Idea, Question), an **Area** (13
diff --git a/src/app/(app)/utilities/compare-docs/page.tsx b/src/app/(app)/utilities/compare-docs/page.tsx
index b97064f..233cbb1 100644
--- a/src/app/(app)/utilities/compare-docs/page.tsx
+++ b/src/app/(app)/utilities/compare-docs/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { CompareDocsScreen } from "@/features/compare-docs/CompareDocsScreen";
+
+export const metadata: Metadata = { title: "Compare Docs" };
 
 export default function Page() {
-  return <PagePlaceholder route="/utilities/compare-docs" />;
+  return <CompareDocsScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 8e0ed2c..a27b255 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -155,10 +155,11 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/utilities/compare-docs",
     title: "Compare Docs",
-    description: "Diff two versions of one document with an AI report of added, removed and modified passages.",
+    description:
+      "Pick a document and two of its versions and read the added, removed and modified passages (seeded versions, matched by reference; no AI report yet, nothing is saved).",
     features: ["U-28"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
     nav: { group: "My Work", label: "Compare Docs" },
   },
 
diff --git a/src/features/compare-docs/CompareDocsScreen.tsx b/src/features/compare-docs/CompareDocsScreen.tsx
new file mode 100644
index 0000000..1d99195
--- /dev/null
+++ b/src/features/compare-docs/CompareDocsScreen.tsx
@@ -0,0 +1,176 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import { Button, Group, List, NativeSelect, Paper, Stack, Text, Title } from "@mantine/core";
+import {
+  BLANK_DRAFT,
+  diffVersions,
+  DOCUMENTS,
+  isEmptyDiff,
+  validateCompare,
+  VERSIONS,
+  type CompareDraft,
+  type CompareErrors,
+  type Diff,
+  type Version,
+} from "./data";
+
+const DOCUMENT_OPTIONS = [{ value: "", label: "Select a document" }, ...DOCUMENTS.map((d) => ({ value: d.name, label: d.name }))];
+const VERSION_OPTIONS = [{ value: "", label: "Select a version" }, ...VERSIONS.map((v) => ({ value: v, label: v }))];
+
+interface Report {
+  document: string;
+  from: Version;
+  to: Version;
+  diff: Diff;
+}
+
+// Compare Docs (U-28): pick a document and two of its versions and read what was added, removed and modified between
+// them. The versions are seeded and the passages are matched by reference (R1, R2, ...); nothing is sent anywhere. The
+// report always matches what is selected: changing a selection removes it. State lives in this component only.
+export function CompareDocsScreen() {
+  const [draft, setDraft] = useState<CompareDraft>(BLANK_DRAFT);
+  const [errors, setErrors] = useState<CompareErrors>({});
+  const [report, setReport] = useState<Report | null>(null);
+  const documentRef = useRef<HTMLSelectElement>(null);
+  const fromRef = useRef<HTMLSelectElement>(null);
+  const toRef = useRef<HTMLSelectElement>(null);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so wipe the form and the report then: every visit starts blank.
+  useEffect(
+    () => () => {
+      setDraft(BLANK_DRAFT);
+      setErrors({});
+      setReport(null);
+    },
+    [],
+  );
+
+  function change(next: CompareDraft) {
+    setDraft(next);
+    setReport(null);
+  }
+
+  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const found = validateCompare(draft);
+    setErrors(found);
+    if (found.document) return documentRef.current?.focus();
+    if (found.from) return fromRef.current?.focus();
+    if (found.to) return toRef.current?.focus();
+    // validateCompare guarantees a document and two versions before this runs
+    const doc = DOCUMENTS.find((d) => d.name === draft.document);
+    if (!doc) return;
+    const from = draft.from as Version;
+    const to = draft.to as Version;
+    setReport({ document: doc.name, from, to, diff: diffVersions(doc.versions[from], doc.versions[to]) });
+  }
+
+  return (
+    <Stack gap="md" maw={760}>
+      <Title order={2}>Compare Docs</Title>
+      <Text c="dimmed">See what changed between two versions of a document.</Text>
+
+      <Paper withBorder p="md">
+        <Stack gap="sm">
+          <Title order={3}>Compare two versions</Title>
+          <form onSubmit={onSubmit} noValidate>
+            <Stack gap="sm">
+              <Group align="flex-start">
+                <NativeSelect
+                  ref={documentRef}
+                  label="Document"
+                  name="document"
+                  data={DOCUMENT_OPTIONS}
+                  value={draft.document}
+                  onChange={(e) => change({ ...draft, document: e.currentTarget.value })}
+                  error={errors.document}
+                />
+                <NativeSelect
+                  ref={fromRef}
+                  label="From version"
+                  name="from-version"
+                  data={VERSION_OPTIONS}
+                  value={draft.from}
+                  onChange={(e) => change({ ...draft, from: e.currentTarget.value as Version | "" })}
+                  error={errors.from}
+                />
+                <NativeSelect
+                  ref={toRef}
+                  label="To version"
+                  name="to-version"
+                  data={VERSION_OPTIONS}
+                  value={draft.to}
+                  onChange={(e) => change({ ...draft, to: e.currentTarget.value as Version | "" })}
+                  error={errors.to}
+                />
+              </Group>
+              <Group>
+                <Button type="submit">Compare versions</Button>
+              </Group>
+            </Stack>
+          </form>
+        </Stack>
+      </Paper>
+
+      {report && (
+        <Paper withBorder p="md">
+          <Stack gap="sm">
+            <Title order={3}>Comparison report</Title>
+            <Text fw={500}>
+              {report.document}: {report.from} to {report.to}
+            </Text>
+            <Text role="status">
+              {report.diff.added.length} added, {report.diff.removed.length} removed, {report.diff.modified.length} modified.
+            </Text>
+            {isEmptyDiff(report.diff) ? (
+              <Text>No differences between these versions.</Text>
+            ) : (
+              <>
+                <Title order={4}>Added ({report.diff.added.length})</Title>
+                {report.diff.added.length === 0 ? (
+                  <Text>None.</Text>
+                ) : (
+                  <List>
+                    {report.diff.added.map((x) => (
+                      <List.Item key={x.ref}>
+                        {x.ref}: {x.text}
+                      </List.Item>
+                    ))}
+                  </List>
+                )}
+                <Title order={4}>Removed ({report.diff.removed.length})</Title>
+                {report.diff.removed.length === 0 ? (
+                  <Text>None.</Text>
+                ) : (
+                  <List>
+                    {report.diff.removed.map((x) => (
+                      <List.Item key={x.ref}>
+                        {x.ref}: {x.text}
+                      </List.Item>
+                    ))}
+                  </List>
+                )}
+                <Title order={4}>Modified ({report.diff.modified.length})</Title>
+                {report.diff.modified.length === 0 ? (
+                  <Text>None.</Text>
+                ) : (
+                  <List>
+                    {report.diff.modified.map((x) => (
+                      <List.Item key={x.ref}>
+                        <Text fw={600}>{x.ref}</Text>
+                        <Text>Before: {x.before}</Text>
+                        <Text>After: {x.after}</Text>
+                      </List.Item>
+                    ))}
+                  </List>
+                )}
+              </>
+            )}
+          </Stack>
+        </Paper>
+      )}
+    </Stack>
+  );
+}
diff --git a/src/features/compare-docs/data.ts b/src/features/compare-docs/data.ts
new file mode 100644
index 0000000..4ad7b6a
--- /dev/null
+++ b/src/features/compare-docs/data.ts
@@ -0,0 +1,143 @@
+export const VERSIONS = ["v1", "v2", "v3"] as const;
+export type Version = (typeof VERSIONS)[number];
+
+// A passage is one referenced statement of a document ("R2"). Passages are matched across versions by that reference.
+export interface Passage {
+  ref: string;
+  text: string;
+}
+
+export interface SeedDocument {
+  name: string;
+  versions: Record<Version, Passage[]>;
+}
+
+const p = (ref: string, text: string): Passage => ({ ref, text });
+
+// Three documents, three versions each. They are chosen so every kind of result can be reached:
+//  - Payments Gateway: v1 to v3 has added, removed and modified passages; v1 to v2 only added and modified; v2 to v3
+//    all three kinds again.
+//  - Customer Portal: v2 and v3 are identical, so that pair has no differences.
+//  - Mobile Onboarding: a passage is reworded, one removed and a new one added in the same step.
+export const DOCUMENTS: SeedDocument[] = [
+  {
+    name: "Payments Gateway Requirements",
+    versions: {
+      v1: [
+        p("R1", "A customer can pay by card."),
+        p("R2", "A payment over 500 needs a second confirmation."),
+        p("R3", "A failed payment is retried once."),
+        p("R4", "Receipts are emailed within 5 minutes."),
+      ],
+      v2: [
+        p("R1", "A customer can pay by card."),
+        p("R2", "A payment over 1,000 needs a second confirmation."),
+        p("R3", "A failed payment is retried once."),
+        p("R4", "Receipts are emailed within 5 minutes."),
+        p("R5", "A customer can pay by bank transfer."),
+      ],
+      v3: [
+        p("R1", "A customer can pay by card."),
+        p("R2", "A payment over 1,000 needs a second confirmation."),
+        p("R4", "Receipts are emailed within 1 minute."),
+        p("R5", "A customer can pay by bank transfer."),
+        p("R6", "Refunds are issued to the original payment method."),
+      ],
+    },
+  },
+  {
+    name: "Customer Portal Requirements",
+    versions: {
+      v1: [
+        p("R1", "A user can sign in with email and password."),
+        p("R2", "A session ends after 30 minutes of inactivity."),
+        p("R3", "A user can update their display name."),
+      ],
+      v2: [
+        p("R1", "A user can sign in with email and password."),
+        p("R2", "A session ends after 15 minutes of inactivity."),
+        p("R3", "A user can update their display name."),
+      ],
+      v3: [
+        p("R1", "A user can sign in with email and password."),
+        p("R2", "A session ends after 15 minutes of inactivity."),
+        p("R3", "A user can update their display name."),
+      ],
+    },
+  },
+  {
+    name: "Mobile Onboarding Requirements",
+    versions: {
+      v1: [p("R1", "A new user sees a welcome screen."), p("R2", "A new user can skip the tutorial.")],
+      v2: [
+        p("R1", "A new user sees a welcome screen."),
+        p("R2", "A new user can skip the tutorial."),
+        p("R3", "A new user chooses a language on first launch."),
+      ],
+      v3: [
+        p("R1", "A new user sees a welcome screen with the product name."),
+        p("R3", "A new user chooses a language on first launch."),
+        p("R4", "A new user can turn on notifications."),
+      ],
+    },
+  },
+];
+
+export interface Modified {
+  ref: string;
+  before: string;
+  after: string;
+}
+
+export interface Diff {
+  added: Passage[];
+  removed: Passage[];
+  modified: Modified[];
+}
+
+// Compares two versions of a document by passage reference: in "to" only is added, in "from" only is removed, in both
+// with different text is modified. Each list is in reference order.
+export function diffVersions(from: Passage[], to: Passage[]): Diff {
+  const before = new Map(from.map((x) => [x.ref, x.text]));
+  const after = new Map(to.map((x) => [x.ref, x.text]));
+  const byRef = (a: { ref: string }, b: { ref: string }) => a.ref.localeCompare(b.ref, "en", { numeric: true });
+  return {
+    added: to.filter((x) => !before.has(x.ref)).sort(byRef),
+    removed: from.filter((x) => !after.has(x.ref)).sort(byRef),
+    modified: to
+      .filter((x) => before.has(x.ref) && before.get(x.ref) !== x.text)
+      .map((x) => ({ ref: x.ref, before: before.get(x.ref) as string, after: x.text }))
+      .sort(byRef),
+  };
+}
+
+export function isEmptyDiff(d: Diff): boolean {
+  return d.added.length === 0 && d.removed.length === 0 && d.modified.length === 0;
+}
+
+// What the compare form collects. Every field is "" until chosen.
+export interface CompareDraft {
+  document: string;
+  from: Version | "";
+  to: Version | "";
+}
+
+export type CompareErrors = Partial<Record<keyof CompareDraft, string>>;
+
+export const BLANK_DRAFT: CompareDraft = { document: "", from: "", to: "" };
+
+// One message per field that is wrong, or {} when the comparison can run. Two different versions are needed, and the
+// starting one must be the older (v1 is older than v2, and so on); both of those are reported on the ending version.
+export function validateCompare(draft: CompareDraft): CompareErrors {
+  const errors: CompareErrors = {};
+  if (!draft.document) errors.document = "Choose a document.";
+  if (!draft.from) errors.from = "Choose a starting version.";
+  if (!draft.to) errors.to = "Choose an ending version.";
+  if (draft.from && draft.to) {
+    if (draft.from === draft.to) errors.to = "Choose two different versions.";
+    else if (VERSIONS.indexOf(draft.from) > VERSIONS.indexOf(draft.to)) {
+      errors.to = "The starting version must be older than the ending version.";
+    }
+  }
+  return errors;
+}
```
