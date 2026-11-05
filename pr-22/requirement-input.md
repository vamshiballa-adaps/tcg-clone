# Change requirement input — PR #22: Add Team Activity with admin-only drill-down (A-09)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/22
- **Author:** Bhargav-85
- **Branch:** `feature/team-activity` → `main`
- **Compared:** `ab6ffadbf077`...`286ff7fdd98f`
- **Generated:** 2026-11-05T04:41:06.681Z (event: pull_request/opened)

## Description

## What

`/insights/team-activity` was a placeholder. It is now a working Team Activity screen (catalogue A-09), and the one page where the **controls** differ by role, not only the data.

- **People table:** named "Team members", the same for both roles, with columns Person, Role, Runs this month and Last active and three rows in this order: Alex Admin (Workspace admin, 6, 2026-11-03), Sam Rivera (Workspace user, 3, 2026-10-29), Uma User (Workspace user, 9, 2026-11-03). The role reads "Workspace admin" or "Workspace user", so it does not repeat the header's role badge. A polite line "Showing 3 people".
- **Admin:** a line "Select a person to open their activity." and each name is a **button** with `aria-expanded` (closed at first). Opening one shows a section "Activity for <name>" with a table named "Recent activity" (columns Date, Activity; Uma has 4 events, the newest 2026-11-03 "Generated test cases for Customer Portal"; Sam 3; Alex 4) and a button **Close details**. Focus moves to the section when it opens, and "Close details" returns focus to that person's button. Opening another person replaces the section, clicking the open person closes it, and every person is openable, the admin's own row included.
- **User:** a line "Only a workspace admin can open a person's activity." and the names are plain text: no buttons in the page content, nothing opens, no "Close details". Same rows, different accessibility tree.
- The page waits for the session, so a user never sees the admin's buttons for a moment.
- **Reachable:** the existing "Team Activity" link under My Insights, for both roles.
- **Nothing is saved.** Every visit starts with nobody open, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).

Docs: a new section in `README.md` and `CLAUDE.md` with the exact labels, rows and events.

## Why this is useful for TCG

A script that clicks "Uma User" passes as the admin and has nothing to click as the user, so one test case written for the admin genuinely fails on the user's account. That tests whether generated steps and a crawl cope with controls that exist for one role only, with a disclosure pattern (`aria-expanded`, one open at a time, focus handling) that is more than a link.

## Merge safety

Branched from the current `main` (`ab6ffad`). No merge conflicts with `main`, and none with any other open branch (`feature/token-usage`, `feature/my-time`, `feature/guide`, `feature/compare-docs`), checked pair by pair. Merging all five in either of two opposite orders gives an identical tree. Docs are added before the My Plan sections; the only other shared-file lines touched are this feature's own route entry.

## Checked

- `eslint`, `tsc --noEmit` and `npm run build` are clean, on this branch and on all five open branches merged together.
- 24 browser checks (Playwright against `next dev`) pass: the admin's rows and buttons, opening and switching and closing a person, focus on open and on close, opening with the Enter key, the admin's own row, leaving and returning by client-side navigation, the user's identical rows with no buttons and nothing opening, and the signed-out redirect to `/login`. The accessibility trees were compared: `button "Uma User"` for the admin, a plain `cell "Uma User"` for the user.
- Not checked: a narrow (phone-width) screen, and `next start` rather than `next dev`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +229 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +22 / -0 |
| M | README.md | +7 / -0 |
| M | src/app/(app)/insights/team-activity/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +3 / -2 |
| A | src/features/team-activity/TeamActivityScreen.tsx | +139 / -0 |
| A | src/features/team-activity/data.ts | +53 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 394bcc9..5e7eeff 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -169,6 +169,28 @@ question. Code: `src/features/help/`.
   navigation always shows a blank form (state is reset when the page is hidden, as in `ForgotPasswordForm`), unlike
   Projects, which keeps what was added.
 
+## Team Activity (A-09)
+
+`/insights/team-activity` (all roles, sidebar link "Team Activity" under My Insights) lists the people on the team, and
+is the app's one page where the **controls** differ by role, not only the data. Code: `src/features/team-activity/`
+(the people and their activity are in `data.ts`). Still to do: real activity, and a range or filter.
+
+- Heading "Team Activity" (level 2); section "People" (level 3). The page waits for the session, so a user never sees
+  the admin's buttons for a moment.
+- Table named "Team members", the same for both roles, with columns Person, Role, Runs this month and Last active and
+  three rows in this order: Alex Admin (Workspace admin, 6, 2026-11-03), Sam Rivera (Workspace user, 3, 2026-10-29), Uma
+  User (Workspace user, 9, 2026-11-03). The role reads "Workspace admin" or "Workspace user", so it never repeats the
+  header's role badge. A polite line "Showing 3 people".
+- **Admin:** a line "Select a person to open their activity." and each name is a **button** (`aria-expanded`, closed
+  at first). Opening one shows a section "Activity for <name>" (level 3, focus moves to it) with a table named "Recent
+  activity" (columns Date, Activity; Uma has 4 events, newest 2026-11-03 "Generated test cases for Customer Portal";
+  Sam 3; Alex 4) and a button "Close details" (it also returns focus to that person's button). Opening another person
+  replaces the section; clicking the open person closes it. Every person is openable, the admin's own row included.
+- **User:** a line "Only a workspace admin can open a person's activity." and the names are plain text: there are no
+  buttons in the page content, nothing opens, and there is no "Close details". Same rows, different accessibility tree.
+- **Nothing is saved**, and every visit starts with nobody open: a full reload, and also a client-side navigation away
+  and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).
+
 ## My Plan (U-40, A-23)
 
 `/my-plan` (all roles, sidebar link "My Plan" under My Insights) shows the plan and a token meter, and the one place a
diff --git a/README.md b/README.md
index 4fe8183..42c7173 100644
--- a/README.md
+++ b/README.md
@@ -89,6 +89,13 @@ product areas), a **Subject** (up to 80 characters) and **Details** (at least 10
 sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox behind this test app. Code lives in
 `src/features/help/`.
 
+## Team Activity (A-09)
+
+`/insights/team-activity` (sidebar: **Team Activity** under My Insights, all roles) lists the three people on the team
+with their role, runs this month and last activity. An **admin** can open any person (each name is a button) to see
+their recent activity; a **user** sees the same table with plain names and no way to open one. The activity is seeded
+and nothing is saved. Code lives in `src/features/team-activity/`.
+
 ## My Plan (U-40, A-23)
 
 `/my-plan` (sidebar: **My Plan** under My Insights, all roles) shows the organisation, the plan and a token meter
diff --git a/src/app/(app)/insights/team-activity/page.tsx b/src/app/(app)/insights/team-activity/page.tsx
index 023fc95..9d38d11 100644
--- a/src/app/(app)/insights/team-activity/page.tsx
+++ b/src/app/(app)/insights/team-activity/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { TeamActivityScreen } from "@/features/team-activity/TeamActivityScreen";
+
+export const metadata: Metadata = { title: "Team Activity" };
 
 export default function Page() {
-  return <PagePlaceholder route="/insights/team-activity" />;
+  return <TeamActivityScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 8e0ed2c..35f177d 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -195,10 +195,11 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/insights/team-activity",
     title: "Team Activity",
-    description: "Activity across the team; Admins can open any user's activity.",
+    description:
+      "The people on the team with their runs and last activity. Only an Admin gets a control on each name to open that person's recent activity (seeded; nothing is saved).",
     features: ["A-09"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
     nav: { group: "My Insights", label: "Team Activity" },
   },
 
diff --git a/src/features/team-activity/TeamActivityScreen.tsx b/src/features/team-activity/TeamActivityScreen.tsx
new file mode 100644
index 0000000..5386bdf
--- /dev/null
+++ b/src/features/team-activity/TeamActivityScreen.tsx
@@ -0,0 +1,139 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import { Button, Group, Paper, Stack, Table, Text, Title } from "@mantine/core";
+import { useSession } from "@/components/auth/useSession";
+import { getDevRole } from "@/lib/role";
+import { TEAM } from "./data";
+
+// Team Activity (A-09): who is on the team and what they did lately. Everyone sees the same people; only an admin gets a
+// control on each name that opens that person's activity, so the page's controls (not just its data) depend on the role.
+// The activity is seeded and nothing is saved. The open person lives in this component only.
+export function TeamActivityScreen() {
+  const session = useSession();
+  const [openName, setOpenName] = useState<string | null>(null);
+  const headingRef = useRef<HTMLHeadingElement>(null);
+  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so close the open person then: every visit starts with none open.
+  useEffect(() => () => setOpenName(null), []);
+
+  // Opening a person moves focus to their heading, so a keyboard or screen-reader user lands on what just appeared.
+  useEffect(() => {
+    if (openName) headingRef.current?.focus();
+  }, [openName]);
+
+  // Wait for the session: the stand-in role is admin, so a user would otherwise see the admins' buttons for a moment.
+  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
+  const isAdmin = role === "admin";
+  const open = TEAM.find((m) => m.name === openName) ?? null;
+
+  function toggle(name: string) {
+    setOpenName(openName === name ? null : name);
+  }
+
+  function closeDetails() {
+    const name = openName;
+    setOpenName(null);
+    if (name) buttonRefs.current[name]?.focus();
+  }
+
+  return (
+    <Stack gap="md" maw={760}>
+      <Title order={2}>Team Activity</Title>
+      <Text c="dimmed">Who is on the team and what they have been doing.</Text>
+
+      {role !== undefined && (
+        <>
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>People</Title>
+              <Text size="sm" c="dimmed">
+                {isAdmin
+                  ? "Select a person to open their activity."
+                  : "Only a workspace admin can open a person's activity."}
+              </Text>
+              <Text size="sm" c="dimmed" aria-live="polite">
+                Showing {TEAM.length} people
+              </Text>
+              <Table.ScrollContainer minWidth={480}>
+                <Table withTableBorder striped aria-label="Team members">
+                  <Table.Thead>
+                    <Table.Tr>
+                      {["Person", "Role", "Runs this month", "Last active"].map((column) => (
+                        // scope="col" is what makes the browser expose these as column headers (see the Projects table).
+                        <Table.Th key={column} scope="col" ta={column === "Runs this month" ? "right" : undefined}>
+                          {column}
+                        </Table.Th>
+                      ))}
+                    </Table.Tr>
+                  </Table.Thead>
+                  <Table.Tbody>
+                    {TEAM.map((m) => (
+                      <Table.Tr key={m.name}>
+                        <Table.Td>
+                          {isAdmin ? (
+                            <Button
+                              ref={(el) => {
+                                buttonRefs.current[m.name] = el;
+                              }}
+                              variant="subtle"
+                              size="compact-sm"
+                              aria-expanded={openName === m.name}
+                              onClick={() => toggle(m.name)}
+                            >
+                              {m.name}
+                            </Button>
+                          ) : (
+                            m.name
+                          )}
+                        </Table.Td>
+                        <Table.Td>{m.role}</Table.Td>
+                        <Table.Td ta="right">{m.runsThisMonth}</Table.Td>
+                        <Table.Td>{m.lastActive}</Table.Td>
+                      </Table.Tr>
+                    ))}
+                  </Table.Tbody>
+                </Table>
+              </Table.ScrollContainer>
+            </Stack>
+          </Paper>
+
+          {isAdmin && open && (
+            <Paper withBorder p="md">
+              <Stack gap="sm">
+                <Title order={3} ref={headingRef} tabIndex={-1}>
+                  Activity for {open.name}
+                </Title>
+                <Table.ScrollContainer minWidth={420}>
+                  <Table withTableBorder striped aria-label="Recent activity">
+                    <Table.Thead>
+                      <Table.Tr>
+                        <Table.Th scope="col">Date</Table.Th>
+                        <Table.Th scope="col">Activity</Table.Th>
+                      </Table.Tr>
+                    </Table.Thead>
+                    <Table.Tbody>
+                      {open.events.map((e) => (
+                        <Table.Tr key={`${e.date}-${e.what}`}>
+                          <Table.Td>{e.date}</Table.Td>
+                          <Table.Td>{e.what}</Table.Td>
+                        </Table.Tr>
+                      ))}
+                    </Table.Tbody>
+                  </Table>
+                </Table.ScrollContainer>
+                <Group>
+                  <Button variant="default" onClick={closeDetails}>
+                    Close details
+                  </Button>
+                </Group>
+              </Stack>
+            </Paper>
+          )}
+        </>
+      )}
+    </Stack>
+  );
+}
diff --git a/src/features/team-activity/data.ts b/src/features/team-activity/data.ts
new file mode 100644
index 0000000..26a5219
--- /dev/null
+++ b/src/features/team-activity/data.ts
@@ -0,0 +1,53 @@
+// What Team Activity (A-09) shows: the people in the workspace and what each did lately. Seeded, and the same for every
+// viewer; only an admin can open a person's activity. The three people are the ones Token Usage and Projects already name.
+export interface ActivityEvent {
+  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
+  what: string;
+}
+
+export interface TeamMember {
+  name: string;
+  role: "Workspace admin" | "Workspace user"; // spelled as on Profile, so it never repeats the header's role badge
+  runsThisMonth: number;
+  lastActive: string; // YYYY-MM-DD
+  events: ActivityEvent[]; // newest first
+}
+
+// Alphabetical by name, as shown.
+export const TEAM: TeamMember[] = [
+  {
+    name: "Alex Admin",
+    role: "Workspace admin",
+    runsThisMonth: 6,
+    lastActive: "2026-11-03",
+    events: [
+      { date: "2026-11-03", what: "Exported the Payments Gateway report" },
+      { date: "2026-11-02", what: "Approved the scenarios for Payments Gateway" },
+      { date: "2026-10-30", what: "Created the project 2024 Audit Prep" },
+      { date: "2026-10-28", what: "Ran the scripts against Payments Gateway" },
+    ],
+  },
+  {
+    name: "Sam Rivera",
+    role: "Workspace user",
+    runsThisMonth: 3,
+    lastActive: "2026-10-29",
+    events: [
+      { date: "2026-10-29", what: "Reviewed the Legacy Billing analysis" },
+      { date: "2026-10-27", what: "Added requirements to Legacy Billing" },
+      { date: "2026-10-24", what: "Started a run for Legacy Billing" },
+    ],
+  },
+  {
+    name: "Uma User",
+    role: "Workspace user",
+    runsThisMonth: 9,
+    lastActive: "2026-11-03",
+    events: [
+      { date: "2026-11-03", what: "Generated test cases for Customer Portal" },
+      { date: "2026-11-02", what: "Started a run for Mobile Onboarding" },
+      { date: "2026-10-30", what: "Generated automation scripts for Customer Portal" },
+      { date: "2026-10-29", what: "Added requirements to Customer Portal" },
+    ],
+  },
+];
```
