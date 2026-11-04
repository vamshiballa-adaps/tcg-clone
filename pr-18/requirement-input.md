# Change requirement input — PR #18: Add Token Usage with a filterable usage log (U-35)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/18
- **Author:** Bhargav-85
- **Branch:** `feature/token-usage` → `main`
- **Compared:** `ab6ffadbf077`...`6ecdf4dc46b3`
- **Generated:** 2026-11-04T11:05:24.816Z (event: pull_request/opened)

## Description

## What

`/insights/token-usage` was a placeholder. It is now a working Token Usage screen (catalogue U-35): where the tokens went, by date, person and operation.

- **Admin** sees the whole workspace. Summary: "Tokens added" 100,000, "Tokens consumed" 62,400, "Tokens remaining" 37,600 and "Total in view". Filters "Period", "Operation" and "Person". A table named "Token usage" (Date, Person, Operation, Tokens) with 12 rows, newest first.
- **User** sees only their own rows: "Tokens you consumed" 29,100 and "Total in view", filters Period and Operation only (no Person), columns Date, Operation, Tokens, 5 rows. Alex's and Sam's rows never show.
- "Showing N of M entries", filters combine, and "No usage matches these filters." replaces the table when nothing matches. "Clear filters" resets the selects and is disabled while none is set. "Total in view" follows the filters; the other figures do not.
- **Reachable:** the existing "Token Usage" sidebar link under My Insights, for both roles.
- The rows add up to the 62,400 My Plan shows, but they are seeded: a top-up on My Plan does not appear here. Dates are shown as YYYY-MM-DD and numbers like 1,000,000, so the screen reads the same on any day and in any locale.
- **Nothing is saved.** Every visit starts unfiltered, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`). The page waits for the session, so a user never sees the admin's view for a moment.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels and figures.

## Merge conflicts

None. This branch is cut from the current `main` (b675186) and was test-merged with `git merge-tree`, with no conflicts, against both `main` and open PR #17 (Profile). Both PRs touch `routes.ts`, `README.md` and `CLAUDE.md`, but in different places: this one edits the Token Usage route entry and adds its docs after the My Plan sections, and #17 edits the Profile entry and adds its docs after Get Started. The merged result of the two branches also passes `eslint` and `tsc`, and webpack compiles it. They can be merged in either order.

## Why this is useful for TCG

Filters that combine, a result that changes with each filter (rows, "Showing N of M", "Total in view"), an empty state, a table with real column headers, and a view that differs by role (extra column and filter for an admin, own rows only for a user) give generated tests real pass and fail cases, beyond forms.

## Checked

- `npm run lint`, `tsc --noEmit` and `npm run build` are clean.
- 38 browser checks (Playwright against `next start`) pass: signed-out gate, both roles' summary, columns and rows, every filter and several combinations, the empty state, "Clear filters", leaving and returning, a full reload, agreement with My Plan's 62,400 and 37,600, a 390px-wide screen, and no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +263 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +24 / -0 |
| M | README.md | +7 / -0 |
| M | src/app/(app)/insights/token-usage/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +3 / -2 |
| A | src/features/token-usage/TokenUsageScreen.tsx | +152 / -0 |
| A | src/features/token-usage/data.ts | +72 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 5414dba..1b9e372 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -195,6 +195,30 @@ real top-ups and a history (Token Usage, U-35, is a separate screen).
 - Statuses have a "Dismiss" button. **Nothing is saved**: a full reload returns to 100,000 / 62,400 / 37,600. A
   client-side navigation away and back keeps an admin's new allowance but drops last visit's status.
 
+## Token Usage (U-35)
+
+`/insights/token-usage` (all roles, sidebar link "Token Usage" under My Insights) is a filterable log of where the tokens
+went. Code: `src/features/token-usage/` (the rows are in `data.ts`). Still to do: the top-up history (U-35, A-23).
+
+- Heading "Token Usage" (level 2); sections (level 3) "Summary" and "Usage log". The page waits for the session, so a
+  user never sees the admin's view for a moment.
+- **Admin** (whole workspace): Summary "Tokens added" 100,000, "Tokens consumed" 62,400, "Tokens remaining" 37,600,
+  "Total in view" (the filtered rows); filters "Period" (All dates, November 2026, October 2026), "Operation" (All
+  operations, Requirements analysis, Scenario generation, Test case generation, Script generation, Script execution) and
+  "Person" (All people, Alex Admin, Sam Rivera, Uma User); table named "Token usage" with columns Date, Person,
+  Operation, Tokens; 12 rows, newest first (the first is 2026-11-03, Uma User, Script generation, 8,400).
+- **User** (own rows only, matched by email): Summary "Tokens you consumed" 29,100 and "Total in view" (no added or
+  remaining); filters Period and Operation only; columns Date, Operation, Tokens; 5 rows. Alex's and Sam's rows never
+  show. Sam Rivera has no built-in account, so only an admin sees those 3 rows.
+- A plain line "Showing N of M entries" (M is the rows the role may see). Filters combine (all that are set must match).
+  When nothing matches, "No usage matches these filters." replaces the table. "Clear filters" resets the three
+  selects and is disabled while none is set. Total in view follows the filters; the other summary figures never do.
+- The rows add up to the 62,400 My Plan shows ("Tokens used"; Uma 29,100, Alex 18,300, Sam 15,000), but they are
+  seeded: an admin's top-up on My Plan does not appear here. Dates are shown as YYYY-MM-DD and numbers always like
+  1,000,000, so the screen reads the same on any day and in any locale.
+- **Nothing is saved**, and the filters start unfiltered on every visit: a full reload, and also a client-side
+  navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).
+
 ## Get Started (U-38)
 
 `/get-started` (all roles, sidebar link "Get Started" under My Work, same for both roles) is a five-step tour with no
diff --git a/README.md b/README.md
index a4ac6d6..fbd45e2 100644
--- a/README.md
+++ b/README.md
@@ -96,6 +96,13 @@ sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox be
 a **user** gets **Request tokens** (amount and reason; nothing moves). **Nothing is saved**: a full reload returns to the
 seeded numbers. Other plan content is still to do. Code lives in `src/features/plan/`.
 
+## Token Usage (U-35)
+
+`/insights/token-usage` (sidebar: **Token Usage** under My Insights, all roles) shows a summary and a usage log you can
+filter by **Period**, **Operation** and, for an admin, **Person**. An **admin** sees all 12 entries (62,400 tokens, the
+same as My Plan); a **user** sees only their own 5 (29,100). The rows are fixed, and a top-up on My Plan does not show
+up here. Nothing is saved. The top-up history is still to do. Code lives in `src/features/token-usage/`.
+
 ## Get Started (U-38)
 
 `/get-started` (sidebar: **Get Started** under My Work, all roles) is a five-step tour of how a run goes from
diff --git a/src/app/(app)/insights/token-usage/page.tsx b/src/app/(app)/insights/token-usage/page.tsx
index 5fcbb10..36199da 100644
--- a/src/app/(app)/insights/token-usage/page.tsx
+++ b/src/app/(app)/insights/token-usage/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { TokenUsageScreen } from "@/features/token-usage/TokenUsageScreen";
+
+export const metadata: Metadata = { title: "Token Usage" };
 
 export default function Page() {
-  return <PagePlaceholder route="/insights/token-usage" />;
+  return <TokenUsageScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index f77aaae..f936832 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -177,10 +177,11 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/insights/token-usage",
     title: "Token Usage",
-    description: "Tokens added, consumed and remaining; breakdown by person, operation and date; top-ups.",
+    description:
+      "Tokens added, consumed and remaining, and a usage log you can filter by period, operation and (Admin) person; a User sees only their own rows. Top-up history is still to build; nothing is saved.",
     features: ["U-35", "A-23"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
     nav: { group: "My Insights", label: "Token Usage" },
   },
   {
diff --git a/src/features/token-usage/TokenUsageScreen.tsx b/src/features/token-usage/TokenUsageScreen.tsx
new file mode 100644
index 0000000..ac3597a
--- /dev/null
+++ b/src/features/token-usage/TokenUsageScreen.tsx
@@ -0,0 +1,152 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import { Box, Button, Group, NativeSelect, Paper, Stack, Table, Text, Title } from "@mantine/core";
+import { useSession } from "@/components/auth/useSession";
+import { formatTokens, SEED_ALLOWANCE } from "@/features/plan/data";
+import { getDevRole } from "@/lib/role";
+import {
+  filterUsage,
+  hasFilters,
+  NO_FILTERS,
+  OPERATIONS,
+  PEOPLE,
+  PERIODS,
+  SEED_USAGE,
+  sumTokens,
+  type Filters,
+} from "./data";
+
+const PERIOD_OPTIONS = [{ value: "", label: "All dates" }, ...PERIODS];
+const OPERATION_OPTIONS = [{ value: "", label: "All operations" }, ...OPERATIONS.map((o) => ({ value: o, label: o }))];
+const PERSON_OPTIONS = [{ value: "", label: "All people" }, ...PEOPLE.map((p) => ({ value: p, label: p }))];
+
+function Fact({ term, children }: { term: string; children: React.ReactNode }) {
+  return (
+    <div>
+      <Text component="dt" size="sm" c="dimmed">
+        {term}
+      </Text>
+      <Text component="dd" m={0} fw={500}>
+        {children}
+      </Text>
+    </div>
+  );
+}
+
+// Token Usage (U-35): where the tokens went, by date, person and operation. An admin sees the whole workspace and can
+// filter by person; a user sees only their own rows. The figures are the seeded ones from My Plan, so a top-up made
+// there does not show up here. The filters live in this component only.
+export function TokenUsageScreen() {
+  const session = useSession();
+  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so clear the filters then: every visit starts unfiltered.
+  useEffect(() => () => setFilters(NO_FILTERS), []);
+
+  // Wait for the session: the stand-in role is admin, so a user would otherwise see the whole workspace for a moment.
+  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
+  const isAdmin = role === "admin";
+  // Signed out (only possible with AUTH_REQUIRED=false) as a user: show the built-in user's rows.
+  const ownEmail = session?.email ?? "user@tcg.test";
+
+  const mine = isAdmin ? SEED_USAGE : SEED_USAGE.filter((e) => e.email === ownEmail);
+  const shown = filterUsage(mine, filters);
+  const consumed = sumTokens(mine);
+  const columns = isAdmin ? ["Date", "Person", "Operation", "Tokens"] : ["Date", "Operation", "Tokens"];
+
+  return (
+    <Stack gap="md" maw={760}>
+      <Title order={2}>Token Usage</Title>
+      <Text c="dimmed">Where your tokens went, by date, person and operation.</Text>
+
+      {role !== undefined && (
+        <>
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>Summary</Title>
+              <Box component="dl" m={0}>
+                <Group gap="xl">
+                  {isAdmin ? (
+                    <>
+                      <Fact term="Tokens added">{formatTokens(SEED_ALLOWANCE)}</Fact>
+                      <Fact term="Tokens consumed">{formatTokens(consumed)}</Fact>
+                      <Fact term="Tokens remaining">{formatTokens(SEED_ALLOWANCE - consumed)}</Fact>
+                    </>
+                  ) : (
+                    <Fact term="Tokens you consumed">{formatTokens(consumed)}</Fact>
+                  )}
+                  <Fact term="Total in view">{formatTokens(sumTokens(shown))}</Fact>
+                </Group>
+              </Box>
+            </Stack>
+          </Paper>
+
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>Usage log</Title>
+              <Group align="flex-end">
+                <NativeSelect
+                  label="Period"
+                  data={PERIOD_OPTIONS}
+                  value={filters.period}
+                  onChange={(e) => setFilters({ ...filters, period: e.currentTarget.value })}
+                />
+                <NativeSelect
+                  label="Operation"
+                  data={OPERATION_OPTIONS}
+                  value={filters.operation}
+                  onChange={(e) => setFilters({ ...filters, operation: e.currentTarget.value })}
+                />
+                {isAdmin && (
+                  <NativeSelect
+                    label="Person"
+                    data={PERSON_OPTIONS}
+                    value={filters.person}
+                    onChange={(e) => setFilters({ ...filters, person: e.currentTarget.value })}
+                  />
+                )}
+                <Button variant="default" disabled={!hasFilters(filters)} onClick={() => setFilters(NO_FILTERS)}>
+                  Clear filters
+                </Button>
+              </Group>
+              <Text size="sm" c="dimmed">
+                Showing {shown.length} of {mine.length} entries
+              </Text>
+
+              {shown.length === 0 ? (
+                <Text>No usage matches these filters.</Text>
+              ) : (
+                <Table.ScrollContainer minWidth={isAdmin ? 560 : 420}>
+                  <Table withTableBorder striped aria-label="Token usage">
+                    <Table.Thead>
+                      <Table.Tr>
+                        {columns.map((column) => (
+                          // scope="col" is what makes the browser expose these as column headers (see the Projects table).
+                          <Table.Th key={column} scope="col" ta={column === "Tokens" ? "right" : undefined}>
+                            {column}
+                          </Table.Th>
+                        ))}
+                      </Table.Tr>
+                    </Table.Thead>
+                    <Table.Tbody>
+                      {shown.map((e) => (
+                        <Table.Tr key={e.id}>
+                          <Table.Td>{e.date}</Table.Td>
+                          {isAdmin && <Table.Td>{e.person}</Table.Td>}
+                          <Table.Td>{e.operation}</Table.Td>
+                          <Table.Td ta="right">{formatTokens(e.tokens)}</Table.Td>
+                        </Table.Tr>
+                      ))}
+                    </Table.Tbody>
+                  </Table>
+                </Table.ScrollContainer>
+              )}
+            </Stack>
+          </Paper>
+        </>
+      )}
+    </Stack>
+  );
+}
diff --git a/src/features/token-usage/data.ts b/src/features/token-usage/data.ts
new file mode 100644
index 0000000..4b9a892
--- /dev/null
+++ b/src/features/token-usage/data.ts
@@ -0,0 +1,72 @@
+export const OPERATIONS = [
+  "Requirements analysis",
+  "Scenario generation",
+  "Test case generation",
+  "Script generation",
+  "Script execution",
+] as const;
+export type Operation = (typeof OPERATIONS)[number];
+
+export interface UsageEntry {
+  id: string;
+  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
+  person: string;
+  email: string; // who the entry belongs to; a User only sees their own
+  operation: Operation;
+  tokens: number;
+}
+
+const ALEX = { person: "Alex Admin", email: "admin@tcg.test" };
+const UMA = { person: "Uma User", email: "user@tcg.test" };
+const SAM = { person: "Sam Rivera", email: "sam@tcg.test" }; // no built-in account: only an admin sees these rows
+
+// The usage log every visit starts with (U-35). Fixed rows, newest first. They add up to the 62,400 tokens used that
+// My Plan shows: Uma 29,100, Alex 18,300, Sam 15,000.
+export const SEED_USAGE: UsageEntry[] = [
+  { id: "u12", date: "2026-11-03", ...UMA, operation: "Script generation", tokens: 8_400 },
+  { id: "u11", date: "2026-11-03", ...ALEX, operation: "Test case generation", tokens: 6_900 },
+  { id: "u10", date: "2026-11-02", ...SAM, operation: "Requirements analysis", tokens: 4_200 },
+  { id: "u09", date: "2026-11-02", ...UMA, operation: "Scenario generation", tokens: 5_300 },
+  { id: "u08", date: "2026-10-30", ...ALEX, operation: "Script execution", tokens: 3_100 },
+  { id: "u07", date: "2026-10-30", ...UMA, operation: "Test case generation", tokens: 7_800 },
+  { id: "u06", date: "2026-10-29", ...SAM, operation: "Scenario generation", tokens: 4_600 },
+  { id: "u05", date: "2026-10-28", ...ALEX, operation: "Requirements analysis", tokens: 5_500 },
+  { id: "u04", date: "2026-10-27", ...UMA, operation: "Requirements analysis", tokens: 3_900 },
+  { id: "u03", date: "2026-10-26", ...SAM, operation: "Script generation", tokens: 6_200 },
+  { id: "u02", date: "2026-10-24", ...ALEX, operation: "Scenario generation", tokens: 2_800 },
+  { id: "u01", date: "2026-10-23", ...UMA, operation: "Script execution", tokens: 3_700 },
+];
+
+export const PEOPLE = [...new Set(SEED_USAGE.map((e) => e.person))].sort();
+
+// "" means no filter on that field.
+export const PERIODS = [
+  { value: "2026-11", label: "November 2026" },
+  { value: "2026-10", label: "October 2026" },
+];
+
+export interface Filters {
+  period: string;
+  operation: string;
+  person: string;
+}
+
+export const NO_FILTERS: Filters = { period: "", operation: "", person: "" };
+
+export function hasFilters(filters: Filters): boolean {
+  return Boolean(filters.period || filters.operation || filters.person);
+}
+
+// An entry stays when it matches every filter that is set.
+export function filterUsage(entries: UsageEntry[], filters: Filters): UsageEntry[] {
+  return entries.filter(
+    (e) =>
+      (!filters.period || e.date.startsWith(filters.period)) &&
+      (!filters.operation || e.operation === filters.operation) &&
+      (!filters.person || e.person === filters.person),
+  );
+}
+
+export function sumTokens(entries: UsageEntry[]): number {
+  return entries.reduce((total, e) => total + e.tokens, 0);
+}
```
