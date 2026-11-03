# Merged change requirement input — Add Projects list with search and New project (U-24, first slice)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/7
- **Author:** Bhargav-85
- **Merged into:** `main` (from `feature/projects-list`)
- **Compared:** `92913a8f90f1`...`f862c7b9ff62`
- **Generated:** 2026-11-03T06:42:04.275Z (event: push)

## Description

/projects is no longer a placeholder. It lists five seeded projects in a table with a "Search projects" box (name, code, department or creator) and a "New project" dialog: name (50 characters, unique ignoring case), department, code, status and description, with a message per rule. A created project goes to the top of the list with the signed-in person as creator.

Nothing is saved: the list lives in the page, so a full reload returns to the seeded rows. Edit, the later status change, the project page and tabs, and Admin-maintained departments are still to do.

Two accessibility fixes found by probing the aria snapshot: the header cells get scope="col" (a bare <th> was exposed as an ordinary cell), and the status badges stop capitalising so the screen matches the DOM text.

## Commits (3)

- `f862c7b9ff62` Merge pull request #7 from vamshiballa-adaps/feature/projects-list — Bhargav-85
- `b1c07403e353` Merge main into feature/projects-list — Chinthalapudi Bhargav
- `58526f3718d6` Add Projects list with search and New project (U-24, first slice) — Priyanka Priyadarshani

## Files changed (8, +387 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +26 / -0 |
| M | README.md | +8 / -0 |
| M | src/app/(app)/projects/page.tsx | +5 / -2 |
| A | src/config/departments.ts | +5 / -0 |
| M | src/config/routes.ts | +2 / -2 |
| A | src/features/projects/NewProjectForm.tsx | +99 / -0 |
| A | src/features/projects/ProjectsScreen.tsx | +117 / -0 |
| A | src/features/projects/data.ts | +125 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 13da4a6..376b77d 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -41,6 +41,9 @@ below).
   login flow with a role-gated UI, since TCG's steps usually start with "Login ...".
 - **Never give two different destructive actions the same label**, and expect TCG never to click destructive-named
   controls during a crawl.
+- **Check the accessibility tree, not only the markup.** A bare `<th>` in the Projects table showed up as an ordinary
+  `cell` until it got `scope="col"`, and Mantine's `Badge` capitalises with CSS, so the screen said "ACTIVE" while the DOM
+  said "Active" (set `tt="none"`). Probe with `locator.ariaSnapshot()` after building a table or a badge.
 - **Keep names from colliding with a field's label.** Playwright's `getByLabel("Email")` is a case-insensitive substring
   match, so an alert titled "Check your email" also matched it. Also, after a client-side navigation Next keeps the
   previous page in the DOM, hidden: role locators skip it, but `getByLabel` still counts it, and its state comes back
@@ -123,6 +126,29 @@ dynamic and the Home startup screen would stop being prerendered, so the UI asks
 Not secure by design: the passwords are public, and the session cookie is signed with `AUTH_SECRET` (a public default
 if unset). Never put real data behind it.
 
+## Projects (U-24, first slice)
+
+`/projects` (all roles) lists the projects runs and documents are filed under. Built: the list, search, and New project.
+Still to do: edit, changing status afterwards (U-42), the project's own page and tabs (U-45), Admin-maintained
+departments (A-26, fixed in `src/config/departments.ts` for now). Code: `src/features/projects/`.
+
+- Heading "Projects"; button "New project"; search box labelled "Search projects" (matches name, code, department or
+  creator, ignoring case and surrounding spaces); a plain line "Showing N of M projects"; "No projects match "xyz"."
+  replaces the table when nothing matches.
+- Table named "Projects" with column headers Name, Code, Department, Created by, Inputs, Outputs, Runs, Last activity,
+  Status. Five seeded rows, newest first: Payments Gateway (PAY, Engineering, Alex Admin, Active), Customer Portal (CPT,
+  Product, Uma User, Active), Mobile Onboarding (MOB, QA, Uma User, Active), Legacy Billing (LBL, Finance, Sam Rivera,
+  On hold), 2024 Audit Prep (AUD, Finance, Alex Admin, Archived). There is no delete anywhere (the catalogue has none).
+- "New project" opens a dialog named "New project": Name, Department (select; Engineering, Finance, Product, QA), Code,
+  Status (select; Active default, On hold, Archived), Description; buttons "Create project" and "Cancel". Messages under
+  the fields: "Enter a project name.", "Project name must be 50 characters or fewer." (51+ fails, exactly 50 passes), "A
+  project with this name already exists." (trimmed, case-insensitive, so "payments gateway" clashes), "Choose a
+  department.", "Enter a project code.". Code and Description are not checked beyond that.
+- A valid form closes the dialog, puts the project first (creator is the signed-in person, 0 inputs/outputs/runs, "Just
+  now") and shows a status "Project created": `"<name>" was added to the list.` (button "Dismiss").
+- **Nothing is saved.** The list lives in the page, so a full reload goes back to the five seeded rows; a client-side
+  navigation away and back keeps what was added.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index 745e6bc..ab16d57 100644
--- a/README.md
+++ b/README.md
@@ -74,6 +74,14 @@ header then shows the person's name, role and **Sign out**; the sidebar follows
   `AUTH_SECRET` signs the cookie; set a long random value on any deployed copy.
 - **Not secure:** the passwords are printed on the sign-in screen. Don't put real data behind it.
 
+## Projects (U-24, first slice)
+
+`/projects` lists five seeded projects with a **Search projects** box (name, code, department or creator) and a **New
+project** dialog: name (up to 50 characters, unique ignoring case), department, code, status, description. A created
+project goes to the top of the list. **Nothing is saved**: a full reload returns to the seeded list. Edit, changing a
+project's status, the project page and tabs, and Admin-maintained departments are still to do. Code lives in
+`src/features/projects/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/projects/page.tsx b/src/app/(app)/projects/page.tsx
index 6e0dff9..fea52ac 100644
--- a/src/app/(app)/projects/page.tsx
+++ b/src/app/(app)/projects/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { ProjectsScreen } from "@/features/projects/ProjectsScreen";
+
+export const metadata: Metadata = { title: "Projects" };
 
 export default function Page() {
-  return <PagePlaceholder route="/projects" />;
+  return <ProjectsScreen />;
 }
diff --git a/src/config/departments.ts b/src/config/departments.ts
new file mode 100644
index 0000000..4446136
--- /dev/null
+++ b/src/config/departments.ts
@@ -0,0 +1,5 @@
+// The departments a project can be filed under (A-26). The catalogue has Admins maintain this list in Administration;
+// until that screen exists it is fixed here.
+export const DEPARTMENTS = ["Engineering", "Finance", "Product", "QA"] as const;
+
+export type Department = (typeof DEPARTMENTS)[number];
diff --git a/src/config/routes.ts b/src/config/routes.ts
index d4137ce..04aadf6 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -118,10 +118,10 @@ export const ROUTES: RouteDef[] = [
     path: "/projects",
     title: "Projects",
     description:
-      "Flat list that runs and documents are filed under. Create/edit with department, code and status (Active, On hold, Archived).",
+      "Flat list that runs and documents are filed under. Search and New project (name, department, code, status, description) are built; edit and the status change are still to do. Projects added in the browser are not saved.",
     features: ["U-24", "U-42", "A-26"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
     nav: { group: "My Work", label: "Projects" },
   },
   {
diff --git a/src/features/projects/NewProjectForm.tsx b/src/features/projects/NewProjectForm.tsx
new file mode 100644
index 0000000..694ff96
--- /dev/null
+++ b/src/features/projects/NewProjectForm.tsx
@@ -0,0 +1,99 @@
+"use client";
+
+import { useRef, useState } from "react";
+import { Button, Group, NativeSelect, Stack, Textarea, TextInput } from "@mantine/core";
+import { DEPARTMENTS } from "@/config/departments";
+import {
+  PROJECT_STATUSES,
+  validateDraft,
+  type DraftErrors,
+  type Project,
+  type ProjectDraft,
+  type ProjectStatus,
+} from "./data";
+
+const BLANK: ProjectDraft = { name: "", department: "", code: "", status: "Active", description: "" };
+
+const DEPARTMENT_OPTIONS = [{ value: "", label: "Select a department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))];
+
+interface Props {
+  existing: Project[];
+  onCreate: (draft: ProjectDraft) => void;
+  onCancel: () => void;
+}
+
+// The body of the New project dialog (U-24). It sits inside the Modal, which unmounts it on close, so every opening
+// starts from a blank form.
+export function NewProjectForm({ existing, onCreate, onCancel }: Props) {
+  const [draft, setDraft] = useState<ProjectDraft>(BLANK);
+  const [errors, setErrors] = useState<DraftErrors>({});
+  const nameRef = useRef<HTMLInputElement>(null);
+  const departmentRef = useRef<HTMLSelectElement>(null);
+  const codeRef = useRef<HTMLInputElement>(null);
+
+  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const found = validateDraft(draft, existing);
+    setErrors(found);
+    if (found.name) return nameRef.current?.focus();
+    if (found.department) return departmentRef.current?.focus();
+    if (found.code) return codeRef.current?.focus();
+    onCreate(draft);
+  }
+
+  return (
+    <form onSubmit={onSubmit} noValidate>
+      <Stack>
+        <TextInput
+          ref={nameRef}
+          label="Name"
+          name="name"
+          autoComplete="off"
+          data-autofocus
+          value={draft.name}
+          onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
+          error={errors.name}
+        />
+        <NativeSelect
+          ref={departmentRef}
+          label="Department"
+          name="department"
+          data={DEPARTMENT_OPTIONS}
+          value={draft.department}
+          onChange={(e) => setDraft({ ...draft, department: e.currentTarget.value as ProjectDraft["department"] })}
+          error={errors.department}
+        />
+        <TextInput
+          ref={codeRef}
+          label="Code"
+          name="code"
+          autoComplete="off"
+          value={draft.code}
+          onChange={(e) => setDraft({ ...draft, code: e.currentTarget.value })}
+          error={errors.code}
+        />
+        <NativeSelect
+          label="Status"
+          name="status"
+          data={[...PROJECT_STATUSES]}
+          value={draft.status}
+          onChange={(e) => setDraft({ ...draft, status: e.currentTarget.value as ProjectStatus })}
+        />
+        <Textarea
+          label="Description"
+          name="description"
+          autosize
+          minRows={2}
+          value={draft.description}
+          onChange={(e) => setDraft({ ...draft, description: e.currentTarget.value })}
+        />
+        <Group justify="flex-end">
+          <Button variant="default" onClick={onCancel}>
+            Cancel
+          </Button>
+          <Button type="submit">Create project</Button>
+        </Group>
+      </Stack>
+    </form>
+  );
+}
diff --git a/src/features/projects/ProjectsScreen.tsx b/src/features/projects/ProjectsScreen.tsx
new file mode 100644
index 0000000..f211f67
--- /dev/null
+++ b/src/features/projects/ProjectsScreen.tsx
@@ -0,0 +1,117 @@
+"use client";
+
+import { useState } from "react";
+import { Alert, Badge, Button, Group, Modal, Stack, Table, Text, TextInput, Title } from "@mantine/core";
+import { useDisclosure } from "@mantine/hooks";
+import { useSession } from "@/components/auth/useSession";
+import { NewProjectForm } from "./NewProjectForm";
+import { matchesQuery, SEED_PROJECTS, type Project, type ProjectDraft, type ProjectStatus } from "./data";
+
+const STATUS_COLOR: Record<ProjectStatus, string> = { Active: "green", "On hold": "yellow", Archived: "gray" };
+
+const COLUMNS = ["Name", "Code", "Department", "Created by", "Inputs", "Outputs", "Runs", "Last activity", "Status"];
+
+// The Projects list (U-24, U-42, A-26): search, and a New project dialog. Editing, the status change and the project's
+// own tabs (U-45) are still to build. The list lives in this component only, so a full reload goes back to the seed.
+export function ProjectsScreen() {
+  const session = useSession();
+  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
+  const [query, setQuery] = useState("");
+  const [created, setCreated] = useState<string | null>(null);
+  const [dialogOpen, { open: openDialog, close: closeDialog }] = useDisclosure(false);
+
+  const shown = projects.filter((p) => matchesQuery(p, query));
+
+  function onCreate(draft: ProjectDraft) {
+    const name = draft.name.trim();
+    const project: Project = {
+      id: crypto.randomUUID(),
+      name,
+      code: draft.code.trim(),
+      // validateDraft guarantees a department before this runs
+      department: draft.department as Project["department"],
+      creator: session?.name ?? "You",
+      description: draft.description.trim(),
+      inputs: 0,
+      outputs: 0,
+      runs: 0,
+      lastActivity: "Just now",
+      status: draft.status,
+    };
+    setProjects([project, ...projects]);
+    setCreated(name);
+    closeDialog();
+  }
+
+  return (
+    <Stack gap="md">
+      <Group justify="space-between" align="flex-start">
+        <Title order={2}>Projects</Title>
+        <Button onClick={openDialog}>New project</Button>
+      </Group>
+      <Text c="dimmed">The projects your runs and documents are filed under.</Text>
+
+      {created && (
+        <Alert color="green" title="Project created" role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setCreated(null)}>
+          &quot;{created}&quot; was added to the list.
+        </Alert>
+      )}
+
+      <TextInput
+        label="Search projects"
+        placeholder="Name, code, department or creator"
+        type="search"
+        value={query}
+        onChange={(e) => setQuery(e.currentTarget.value)}
+      />
+      <Text size="sm" c="dimmed">
+        Showing {shown.length} of {projects.length} projects
+      </Text>
+
+      {shown.length === 0 ? (
+        <Text>No projects match &quot;{query.trim()}&quot;.</Text>
+      ) : (
+        <Table.ScrollContainer minWidth={820}>
+          <Table withTableBorder striped aria-label="Projects">
+            <Table.Thead>
+              <Table.Tr>
+                {COLUMNS.map((column) => (
+                  // scope="col" is what makes the browser expose these as column headers: a bare <th> in this table
+                  // showed up in the accessibility tree as an ordinary cell.
+                  <Table.Th key={column} scope="col">
+                    {column}
+                  </Table.Th>
+                ))}
+              </Table.Tr>
+            </Table.Thead>
+            <Table.Tbody>
+              {shown.map((p) => (
+                <Table.Tr key={p.id}>
+                  <Table.Td>{p.name}</Table.Td>
+                  <Table.Td>{p.code}</Table.Td>
+                  <Table.Td>{p.department}</Table.Td>
+                  <Table.Td>{p.creator}</Table.Td>
+                  <Table.Td>{p.inputs}</Table.Td>
+                  <Table.Td>{p.outputs}</Table.Td>
+                  <Table.Td>{p.runs}</Table.Td>
+                  <Table.Td>{p.lastActivity}</Table.Td>
+                  <Table.Td>
+                    {/* tt="none": Badge capitalises by default, so the screen would say "ACTIVE" while the page text and the
+                        accessibility tree say "Active", and a test reading the screen would disagree with one reading the DOM. */}
+                    <Badge color={STATUS_COLOR[p.status]} variant="light" tt="none">
+                      {p.status}
+                    </Badge>
+                  </Table.Td>
+                </Table.Tr>
+              ))}
+            </Table.Tbody>
+          </Table>
+        </Table.ScrollContainer>
+      )}
+
+      <Modal opened={dialogOpen} onClose={closeDialog} title="New project">
+        <NewProjectForm existing={projects} onCreate={onCreate} onCancel={closeDialog} />
+      </Modal>
+    </Stack>
+  );
+}
diff --git a/src/features/projects/data.ts b/src/features/projects/data.ts
new file mode 100644
index 0000000..164c0fd
--- /dev/null
+++ b/src/features/projects/data.ts
@@ -0,0 +1,125 @@
+import type { Department } from "@/config/departments";
+
+export const PROJECT_STATUSES = ["Active", "On hold", "Archived"] as const;
+export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
+
+export const NAME_MAX = 50;
+
+export interface Project {
+  id: string;
+  name: string;
+  code: string;
+  department: Department;
+  creator: string;
+  description: string;
+  inputs: number;
+  outputs: number;
+  runs: number;
+  lastActivity: string;
+  status: ProjectStatus;
+}
+
+// What the New project form collects. `department` is "" until one is chosen.
+export interface ProjectDraft {
+  name: string;
+  department: Department | "";
+  code: string;
+  status: ProjectStatus;
+  description: string;
+}
+
+export type DraftErrors = Partial<Record<"name" | "department" | "code", string>>;
+
+// The list every visit starts with, newest activity first. Fixed text (not dates) so the screen reads the same on any
+// day. Projects added in the browser are not saved: a full reload goes back to exactly this list.
+export const SEED_PROJECTS: Project[] = [
+  {
+    id: "seed-pay",
+    name: "Payments Gateway",
+    code: "PAY",
+    department: "Engineering",
+    creator: "Alex Admin",
+    description: "Card and wallet payments for the storefront.",
+    inputs: 6,
+    outputs: 18,
+    runs: 11,
+    lastActivity: "Today",
+    status: "Active",
+  },
+  {
+    id: "seed-cpt",
+    name: "Customer Portal",
+    code: "CPT",
+    department: "Product",
+    creator: "Uma User",
+    description: "Self-service account area for customers.",
+    inputs: 3,
+    outputs: 9,
+    runs: 5,
+    lastActivity: "Yesterday",
+    status: "Active",
+  },
+  {
+    id: "seed-mob",
+    name: "Mobile Onboarding",
+    code: "MOB",
+    department: "QA",
+    creator: "Uma User",
+    description: "First-run flow of the mobile app.",
+    inputs: 5,
+    outputs: 14,
+    runs: 9,
+    lastActivity: "5 days ago",
+    status: "Active",
+  },
+  {
+    id: "seed-lbl",
+    name: "Legacy Billing",
+    code: "LBL",
+    department: "Finance",
+    creator: "Sam Rivera",
+    description: "Invoicing system being retired.",
+    inputs: 2,
+    outputs: 4,
+    runs: 3,
+    lastActivity: "3 weeks ago",
+    status: "On hold",
+  },
+  {
+    id: "seed-aud",
+    name: "2024 Audit Prep",
+    code: "AUD",
+    department: "Finance",
+    creator: "Alex Admin",
+    description: "Evidence gathering for the 2024 audit.",
+    inputs: 1,
+    outputs: 6,
+    runs: 2,
+    lastActivity: "4 months ago",
+    status: "Archived",
+  },
+];
+
+// Checks the New project form. Names are compared trimmed and case-insensitively, so "payments gateway" clashes with
+// "Payments Gateway". Returns one message per field that is wrong, or {} when the draft can be saved.
+export function validateDraft(draft: ProjectDraft, existing: Project[]): DraftErrors {
+  const errors: DraftErrors = {};
+  const name = draft.name.trim();
+  if (!name) errors.name = "Enter a project name.";
+  else if (name.length > NAME_MAX) errors.name = `Project name must be ${NAME_MAX} characters or fewer.`;
+  else if (existing.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
+    errors.name = "A project with this name already exists.";
+  }
+  if (!draft.department) errors.department = "Choose a department.";
+  if (!draft.code.trim()) errors.code = "Enter a project code.";
+  return errors;
+}
+
+// Search matches name, code, department or creator, ignoring case. An empty query matches everything.
+export function matchesQuery(project: Project, query: string): boolean {
+  const q = query.trim().toLowerCase();
+  if (!q) return true;
+  return [project.name, project.code, project.department, project.creator].some((field) =>
+    field.toLowerCase().includes(q),
+  );
+}
```
