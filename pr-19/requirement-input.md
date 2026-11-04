# Change requirement input — PR #19: Add My TCG Time with a date-range session log (U-36)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/19
- **Author:** Bhargav-85
- **Branch:** `feature/my-time` → `main`
- **Compared:** `ab6ffadbf077`...`9caff019ff13`
- **Generated:** 2026-11-04T11:59:49.629Z (event: pull_request/opened)

## Description

## What

`/insights/my-time` was a placeholder. It is now a working My TCG Time screen (catalogue U-36): the sessions a person spent on the platform over a date range they choose.

- **Date range:** text fields "Start date" and "End date" (`YYYY-MM-DD`; they start as 2026-10-27 and 2026-11-03, the days the seeded rows cover) and buttons **Apply range** and **Reset range**.
- **Validation:** "Enter a start date.", "Enter an end date.", "Enter the start date as YYYY-MM-DD." / "Enter the end date as YYYY-MM-DD." (also for `2026-1-5`, `27/10/2026` and an impossible date such as `2026-02-30`), "The end date must be on or after the start date." and "Choose a range of 31 days or fewer." (32 days fails, exactly 31 passes). Dates are judged trimmed; focus goes to the first wrong field. After an error the table keeps showing the last good range, so only a valid **Apply range** changes it.
- **Summary** (follows the range): "Total time" (`6 h 30 min`, always spelled `H h M min`), "Days with activity" and "Busiest day".
- **Time log:** table "Time log" with columns Date, Started, Ended, Area, Duration, newest first; "Showing N of M sessions from <start> to <end>"; "No time recorded in this range." when nothing falls in the range.
- **Always your own time, for both roles**, matched by email: the user (Uma) has 8 sessions, 6 h 30 min; the admin (Alex) has 5 sessions, 4 h 25 min. The page waits for the session, so nobody sees the other's rows for a moment.
- **Reachable:** the existing "My TCG Time" link under My Insights in the sidebar. Its route entry is now `in-progress`.
- **Nothing is saved.** Every visit starts on the default range, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).
- The fields are "Start date" and "End date", and the columns "Started" and "Ended", rather than "From" and "To": `getByLabel("To")` is a case-insensitive substring match and would find other things.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels, messages and seeded figures.

## Why this is useful for TCG

It is the app's first date-range filter: two linked inputs where one's validity depends on the other, a boundary on the span (31 and 32 days), real-calendar-date checking, a summary that recomputes with the range, an empty state, and data that depends on who is signed in. That gives generated tests pass and fail cases that the existing forms and the Token Usage filters do not.

## Merge safety

Branched from the current `main` (`ab6ffad`, after #17). `git merge-tree` against `origin/main` and against `origin/feature/token-usage` (the other open branch) reports no conflicts. This branch's docs go after the Profile sections, and Token Usage's go after My Plan, so they do not touch the same lines of `README.md` and `CLAUDE.md`; in `routes.ts` each edits only its own entry.

## Checked

- `eslint`, `tsc --noEmit` and `npm run build` are clean. Lint and `tsc` were also run on this branch merged with `feature/token-usage` and are clean.
- 35 browser checks (Playwright against `next dev`) pass: signed-out redirect to `/login`, both roles' own rows and summaries, every message and its focus, the 31/32-day boundary, trimmed input, a single-day range, an empty range, Reset range, a return by client-side navigation, and the accessibility tree (labelled textboxes, `invalid` on the bad field, real column headers, term/definition pairs).
- Not checked: a narrow (phone-width) screen, and `next start` rather than `next dev`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (6, +352 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +32 / -0 |
| M | README.md | +8 / -0 |
| M | src/app/(app)/insights/my-time/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +3 / -2 |
| A | src/features/my-time/MyTimeScreen.tsx | +185 / -0 |
| A | src/features/my-time/data.ts | +119 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 394bcc9..e499ad5 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -243,6 +243,38 @@ preferences (U-44).
   the "new" password fails by design. A full reload, and also a client-side navigation away and back (state is reset
   when the page is hidden, as in `ForgotPasswordForm`), shows the starting values, empty password fields and no status.
 
+## My TCG Time (U-36)
+
+`/insights/my-time` (all roles, sidebar link "My TCG Time" under My Insights) is a log of the sessions a person spent on
+the platform, over a date range they choose. Code: `src/features/my-time/` (the sessions are in `data.ts`). It is
+always the signed-in person's own time, for both roles (Team Activity, A-09, is the separate screen that looks across
+people, still a placeholder).
+
+- Heading "My TCG Time" (level 2); sections (level 3) "Date range", "Summary" and "Time log". The page waits for the
+  session, so a person never sees the admin's rows for a moment.
+- **Rows** (matched by email): user (Uma) has 8 sessions, 6 h 30 min over 6 days, busiest day 2026-10-30 (2 h 0 min);
+  admin (Alex) has 5 sessions, 4 h 25 min over 5 days, busiest day 2026-10-28 (1 h 30 min). Neither sees the other's.
+  Dates are shown as YYYY-MM-DD and times as 24-hour HH:MM, so the screen reads the same on any day and in any locale.
+- **Date range:** text fields "Start date" and "End date" (placeholder YYYY-MM-DD; they start as 2026-10-27 and
+  2026-11-03, the days the seeded rows cover) and buttons "Apply range" and "Reset range" (disabled while the range is
+  the starting one and nothing is wrong). The labels are not "From" and "To" on purpose: `getByLabel("To")` is a
+  substring match and would find other things. The table changes only when "Apply range" passes; after an error it keeps
+  showing the last good range.
+- Messages under the fields: "Enter a start date.", "Enter an end date.", "Enter the start date as YYYY-MM-DD." (also
+  for "2026-1-5", "27/10/2026" and an impossible date such as 2026-02-30), "Enter the end date as YYYY-MM-DD.", "The end
+  date must be on or after the start date." and "Choose a range of 31 days or fewer." (both ends count: 32 days fails,
+  exactly 31 passes; the last two show under End date). Dates are judged trimmed. Focus goes to the first wrong field,
+  Start date before End date. A good range puts the trimmed dates back in the fields.
+- **Summary** (follows the range): "Total time" (for example "6 h 30 min"; under an hour "45 min"; always spelled `H h M
+  min`, so exactly two hours is "2 h 0 min"), "Days with activity" (days, not sessions) and "Busiest day" (`<date> (<time>)`,
+  the later date wins a tie, "None" when the range is empty).
+- **Time log:** table named "Time log" with columns Date, Started, Ended, Area, Duration, newest first (the first row for
+  the user is 2026-11-03 14:00 to 14:30, Test cases, 30 min); a polite line "Showing N of M sessions from <start> to
+  <end>" (M is that person's sessions). "No time recorded in this range." replaces the table when nothing falls in it.
+  The columns are "Started" and "Ended", not "From" and "To", so no name repeats a field's label.
+- **Nothing is saved**, and every visit starts on the starting range: a full reload, and also a client-side navigation
+  away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index 4fe8183..d692f01 100644
--- a/README.md
+++ b/README.md
@@ -112,6 +112,14 @@ The current password is checked against the signed-in built-in account's real pa
 shows the starting values, and sign-in keeps using the built-in passwords. Notification preferences are still to do.
 Code lives in `src/features/profile/`.
 
+## My TCG Time (U-36)
+
+`/insights/my-time` (sidebar: **My TCG Time** under My Insights, all roles) lists the sessions you spent on the platform
+(date, start, end, area, duration) over a **Start date** and **End date** you type as `YYYY-MM-DD`, with a summary (total
+time, days with activity, busiest day). It is always your own time, for both roles. **Apply range** checks the dates (a
+range is at most 31 days) and **Reset range** goes back to the seeded range. The sessions are seeded and **nothing is
+saved**: every visit starts on the default range. Code lives in `src/features/my-time/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/insights/my-time/page.tsx b/src/app/(app)/insights/my-time/page.tsx
index e0d9d22..522d880 100644
--- a/src/app/(app)/insights/my-time/page.tsx
+++ b/src/app/(app)/insights/my-time/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { MyTimeScreen } from "@/features/my-time/MyTimeScreen";
+
+export const metadata: Metadata = { title: "My TCG Time" };
 
 export default function Page() {
-  return <PagePlaceholder route="/insights/my-time" />;
+  return <MyTimeScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 8e0ed2c..ca4a6d7 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -186,10 +186,11 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/insights/my-time",
     title: "My TCG Time",
-    description: "Minute-by-minute time you spent on the platform over a date range.",
+    description:
+      "Time you spent on the platform, session by session, over a start and end date you choose. Always your own, for both roles (seeded; nothing is saved).",
     features: ["U-36"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
     nav: { group: "My Insights", label: "My TCG Time" },
   },
   {
diff --git a/src/features/my-time/MyTimeScreen.tsx b/src/features/my-time/MyTimeScreen.tsx
new file mode 100644
index 0000000..fd7a029
--- /dev/null
+++ b/src/features/my-time/MyTimeScreen.tsx
@@ -0,0 +1,185 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import { Box, Button, Group, Paper, Stack, Table, Text, TextInput, Title } from "@mantine/core";
+import { useSession } from "@/components/auth/useSession";
+import {
+  activeDays,
+  busiestDay,
+  DEFAULT_RANGE,
+  entriesInRange,
+  entryMinutes,
+  formatMinutes,
+  sameRange,
+  SEED_TIME,
+  totalMinutes,
+  validateRange,
+  type DateRange,
+  type RangeErrors,
+} from "./data";
+
+const COLUMNS = ["Date", "Started", "Ended", "Area", "Duration"];
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
+// My TCG Time (U-36): the minutes you spent on the platform over a date range. Always your own, for both roles (Team
+// Activity is the screen that looks across people). The range is only applied by "Apply range", and only when both
+// dates pass; until then the table keeps showing the last good range. State lives in this component only.
+export function MyTimeScreen() {
+  const session = useSession();
+  const [draft, setDraft] = useState<DateRange>(DEFAULT_RANGE);
+  const [applied, setApplied] = useState<DateRange>(DEFAULT_RANGE);
+  const [errors, setErrors] = useState<RangeErrors>({});
+  const fromRef = useRef<HTMLInputElement>(null);
+  const toRef = useRef<HTMLInputElement>(null);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so go back to the default range then: every visit starts the same.
+  useEffect(
+    () => () => {
+      setDraft(DEFAULT_RANGE);
+      setApplied(DEFAULT_RANGE);
+      setErrors({});
+    },
+    [],
+  );
+
+  function onApply(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const found = validateRange(draft);
+    setErrors(found);
+    if (found.from) return fromRef.current?.focus();
+    if (found.to) return toRef.current?.focus();
+    const range = { from: draft.from.trim(), to: draft.to.trim() };
+    setDraft(range);
+    setApplied(range);
+  }
+
+  function onReset() {
+    setDraft(DEFAULT_RANGE);
+    setApplied(DEFAULT_RANGE);
+    setErrors({});
+  }
+
+  // Wait for the session: whose rows to show depends on it, and the stand-in is not a real person.
+  // Signed out (only possible with AUTH_REQUIRED=false) as a user: show the built-in user's rows.
+  const ownEmail = session === undefined ? undefined : (session?.email ?? "user@tcg.test");
+  const mine = ownEmail === undefined ? [] : SEED_TIME.filter((e) => e.email === ownEmail);
+  const shown = entriesInRange(mine, applied);
+  const busiest = busiestDay(shown);
+  const atDefault = sameRange(draft, DEFAULT_RANGE) && sameRange(applied, DEFAULT_RANGE);
+
+  return (
+    <Stack gap="md" maw={760}>
+      <Title order={2}>My TCG Time</Title>
+      <Text c="dimmed">The time you spent on the platform, session by session, over a range of dates.</Text>
+
+      {ownEmail !== undefined && (
+        <>
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>Date range</Title>
+              <form onSubmit={onApply} noValidate>
+                <Stack gap="sm">
+                  <Group align="flex-start">
+                    <TextInput
+                      ref={fromRef}
+                      label="Start date"
+                      name="start-date"
+                      placeholder="YYYY-MM-DD"
+                      autoComplete="off"
+                      value={draft.from}
+                      onChange={(e) => setDraft({ ...draft, from: e.currentTarget.value })}
+                      error={errors.from}
+                    />
+                    <TextInput
+                      ref={toRef}
+                      label="End date"
+                      name="end-date"
+                      placeholder="YYYY-MM-DD"
+                      autoComplete="off"
+                      value={draft.to}
+                      onChange={(e) => setDraft({ ...draft, to: e.currentTarget.value })}
+                      error={errors.to}
+                    />
+                  </Group>
+                  <Group>
+                    <Button type="submit">Apply range</Button>
+                    <Button variant="default" disabled={atDefault && !errors.from && !errors.to} onClick={onReset}>
+                      Reset range
+                    </Button>
+                  </Group>
+                </Stack>
+              </form>
+            </Stack>
+          </Paper>
+
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>Summary</Title>
+              <Box component="dl" m={0}>
+                <Group gap="xl">
+                  <Fact term="Total time">{formatMinutes(totalMinutes(shown))}</Fact>
+                  <Fact term="Days with activity">{activeDays(shown)}</Fact>
+                  <Fact term="Busiest day">
+                    {busiest ? `${busiest.date} (${formatMinutes(busiest.minutes)})` : "None"}
+                  </Fact>
+                </Group>
+              </Box>
+            </Stack>
+          </Paper>
+
+          <Paper withBorder p="md">
+            <Stack gap="sm">
+              <Title order={3}>Time log</Title>
+              <Text size="sm" c="dimmed" aria-live="polite">
+                Showing {shown.length} of {mine.length} sessions from {applied.from} to {applied.to}
+              </Text>
+
+              {shown.length === 0 ? (
+                <Text>No time recorded in this range.</Text>
+              ) : (
+                <Table.ScrollContainer minWidth={520}>
+                  <Table withTableBorder striped aria-label="Time log">
+                    <Table.Thead>
+                      <Table.Tr>
+                        {COLUMNS.map((column) => (
+                          // scope="col" is what makes the browser expose these as column headers (see the Projects table).
+                          <Table.Th key={column} scope="col" ta={column === "Duration" ? "right" : undefined}>
+                            {column}
+                          </Table.Th>
+                        ))}
+                      </Table.Tr>
+                    </Table.Thead>
+                    <Table.Tbody>
+                      {shown.map((e) => (
+                        <Table.Tr key={e.id}>
+                          <Table.Td>{e.date}</Table.Td>
+                          <Table.Td>{e.start}</Table.Td>
+                          <Table.Td>{e.end}</Table.Td>
+                          <Table.Td>{e.area}</Table.Td>
+                          <Table.Td ta="right">{formatMinutes(entryMinutes(e))}</Table.Td>
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
diff --git a/src/features/my-time/data.ts b/src/features/my-time/data.ts
new file mode 100644
index 0000000..3558f03
--- /dev/null
+++ b/src/features/my-time/data.ts
@@ -0,0 +1,119 @@
+// What My TCG Time (U-36) shows: sessions on the platform, each with a start and an end time, filed under the part of
+// the product it was spent in. The rows are seeded, one set per built-in account (matched by email, like Token Usage).
+export interface TimeEntry {
+  id: string;
+  email: string; // lower case, as in demo-users.ts
+  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
+  start: string; // HH:MM, 24-hour
+  end: string; // HH:MM, 24-hour, later than start on the same date
+  area: string; // same names as the Help & Feedback areas
+}
+
+// Newest first, as the table shows them. Uma (user@tcg.test): 8 sessions, 390 minutes over 6 days. Alex
+// (admin@tcg.test): 5 sessions, 265 minutes over 5 days. Everyone sees only their own.
+export const SEED_TIME: TimeEntry[] = [
+  { id: "t-01", email: "user@tcg.test", date: "2026-11-03", start: "14:00", end: "14:30", area: "Test cases" },
+  { id: "t-02", email: "admin@tcg.test", date: "2026-11-03", start: "08:45", end: "09:30", area: "Reports & exports" },
+  { id: "t-03", email: "user@tcg.test", date: "2026-11-03", start: "09:05", end: "10:20", area: "Requirements analysis" },
+  { id: "t-04", email: "admin@tcg.test", date: "2026-11-02", start: "16:00", end: "17:15", area: "Requirements analysis" },
+  { id: "t-05", email: "user@tcg.test", date: "2026-11-02", start: "10:10", end: "11:00", area: "Scenarios" },
+  { id: "t-06", email: "user@tcg.test", date: "2026-10-30", start: "15:15", end: "16:45", area: "Automation scripts" },
+  { id: "t-07", email: "user@tcg.test", date: "2026-10-30", start: "09:30", end: "10:00", area: "Test cases" },
+  { id: "t-08", email: "admin@tcg.test", date: "2026-10-30", start: "10:00", end: "10:20", area: "Test cases" },
+  { id: "t-09", email: "user@tcg.test", date: "2026-10-29", start: "11:00", end: "11:40", area: "Requirements input" },
+  { id: "t-10", email: "admin@tcg.test", date: "2026-10-28", start: "09:10", end: "10:40", area: "Scenarios" },
+  { id: "t-11", email: "user@tcg.test", date: "2026-10-28", start: "13:20", end: "14:10", area: "Script execution" },
+  { id: "t-12", email: "admin@tcg.test", date: "2026-10-27", start: "14:00", end: "14:35", area: "Requirements input" },
+  { id: "t-13", email: "user@tcg.test", date: "2026-10-27", start: "09:00", end: "09:25", area: "Reports & exports" },
+];
+
+// The range every visit starts with: the days the seeded rows cover, so nothing is hidden at first.
+export interface DateRange {
+  from: string;
+  to: string;
+}
+
+export const DEFAULT_RANGE: DateRange = { from: "2026-10-27", to: "2026-11-03" };
+
+// A range may cover at most this many days, both ends counted: 31 passes, 32 fails.
+export const MAX_RANGE_DAYS = 31;
+
+export type RangeErrors = Partial<Record<keyof DateRange, string>>;
+
+const DAY_MS = 24 * 60 * 60 * 1000;
+
+// "2026-10-27" as a day number, or null when it is not a real calendar date written exactly YYYY-MM-DD ("2026-02-30",
+// "2026-1-5" and "27/10/2026" are all null).
+function dayNumber(text: string): number | null {
+  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
+  const ms = Date.parse(`${text}T00:00:00Z`);
+  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== text) return null;
+  return ms / DAY_MS;
+}
+
+// Checks the two dates, trimmed. Each field gets its own message first (empty, then not a real YYYY-MM-DD date); only
+// when both are real dates are they compared with each other, and a problem there is reported on the end date.
+export function validateRange(draft: DateRange): RangeErrors {
+  const errors: RangeErrors = {};
+  const from = draft.from.trim();
+  const to = draft.to.trim();
+  if (!from) errors.from = "Enter a start date.";
+  else if (dayNumber(from) === null) errors.from = "Enter the start date as YYYY-MM-DD.";
+  if (!to) errors.to = "Enter an end date.";
+  else if (dayNumber(to) === null) errors.to = "Enter the end date as YYYY-MM-DD.";
+  const first = dayNumber(from);
+  const last = dayNumber(to);
+  if (first !== null && last !== null) {
+    if (last < first) errors.to = "The end date must be on or after the start date.";
+    else if (last - first + 1 > MAX_RANGE_DAYS) errors.to = `Choose a range of ${MAX_RANGE_DAYS} days or fewer.`;
+  }
+  return errors;
+}
+
+export function sameRange(a: DateRange, b: DateRange): boolean {
+  return a.from === b.from && a.to === b.to;
+}
+
+// Both ends count. YYYY-MM-DD strings sort the same as the dates they name.
+export function entriesInRange(entries: TimeEntry[], range: DateRange): TimeEntry[] {
+  return entries.filter((e) => e.date >= range.from && e.date <= range.to);
+}
+
+function minutesOfDay(clock: string): number {
+  const [hours, minutes] = clock.split(":").map(Number);
+  return hours * 60 + minutes;
+}
+
+export function entryMinutes(entry: TimeEntry): number {
+  return minutesOfDay(entry.end) - minutesOfDay(entry.start);
+}
+
+export function totalMinutes(entries: TimeEntry[]): number {
+  return entries.reduce((sum, e) => sum + entryMinutes(e), 0);
+}
+
+// "45 min", "1 h 0 min", "6 h 30 min": always spelled the same way, so a test can compare the text.
+export function formatMinutes(minutes: number): string {
+  if (minutes < 60) return `${minutes} min`;
+  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
+}
+
+export interface BusiestDay {
+  date: string;
+  minutes: number;
+}
+
+// The date with the most minutes (the later date wins a tie), or null when there are no rows.
+export function busiestDay(entries: TimeEntry[]): BusiestDay | null {
+  const perDay = new Map<string, number>();
+  for (const e of entries) perDay.set(e.date, (perDay.get(e.date) ?? 0) + entryMinutes(e));
+  let best: BusiestDay | null = null;
+  for (const [date, minutes] of perDay) {
+    if (!best || minutes > best.minutes || (minutes === best.minutes && date > best.date)) best = { date, minutes };
+  }
+  return best;
+}
+
+export function activeDays(entries: TimeEntry[]): number {
+  return new Set(entries.map((e) => e.date)).size;
+}
```
