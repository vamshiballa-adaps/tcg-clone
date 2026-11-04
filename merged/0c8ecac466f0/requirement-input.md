# Merged change requirement input — Add My Plan with token meter, admin top-up and user request (U-40, A-23)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/15
- **Author:** Bhargav-85
- **Merged into:** `main` (from `feature/my-plan`)
- **Compared:** `a8fa3e9b9ded`...`0c8ecac466f0`
- **Generated:** 2026-11-04T04:31:13.738Z (event: push)

## Description

## What

`/my-plan` was a placeholder. It is now a working screen for the organisation, the plan and the token meter (catalogue U-40, A-23).

- **Meter:** a progress bar named "Share of tokens consumed" (62%), and the figures Token allowance 100,000, Tokens used 62,400, Tokens remaining 37,600. Organisation "Northwind Quality Labs", plan "Team".
- **Role changes what the page can do:** an **Admin** gets "Add tokens" (dialog with Amount; the allowance and the meter move, status "Top-up applied"); a **User** gets "Request tokens" (Amount and Reason; status "Request sent", the meter does not move). Never both. The button waits for the session, so a user never sees the admin's button for a moment (the stand-in role is admin).
- **Amount rules:** whole number from 1 to 1,000,000, commas only as thousands separators, spaces around it ignored. Messages: "Enter a number of tokens.", "Enter a whole number greater than zero.", "You can add at most 1,000,000 tokens at a time." (or "request"). A user's empty Reason: "Tell your admin why you need them." Focus goes to the first wrong field.
- **Reachable:** a "My Plan" link under My Insights in the sidebar, for both roles, so a crawl can find it.
- **Nothing is saved.** A full reload returns to the seeded numbers. Going away and back by client-side navigation keeps an admin's new allowance and drops last visit's status.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels, numbers and messages.

## Why this is useful for TCG

It is the first screen where the same URL shows different controls by role, with arithmetic a test can check (105,000 / 62,400 / 42,600, 59% after adding 5,000), a progress bar with ARIA values, thousands-separator parsing and a dialog flow.

## Checked

- `npm run lint` and `npm run build` are clean.
- 53 browser checks (Playwright against `next start`) pass: signed-out gate, both roles' screen and buttons, every amount message and the 1,000,000 boundary, focus, both dialogs and their confirmations, the meter after top-ups, Dismiss, leaving and returning, a full reload, a 390px-wide screen, and no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Commits (2)

- `0c8ecac466f0` Merge pull request #15 from vamshiballa-adaps/feature/my-plan — Bhargav-85
- `1449ad928e75` Add My Plan with token meter, admin top-up and user request (U-40, A-23) — Chinthalapudi Bhargav

## Files changed (7, +258 / -5)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +26 / -0 |
| M | README.md | +7 / -0 |
| M | src/app/(app)/my-plan/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +5 / -3 |
| A | src/features/plan/PlanScreen.tsx | +113 / -0 |
| A | src/features/plan/TokenForm.tsx | +69 / -0 |
| A | src/features/plan/data.ts | +33 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 96ea7ae..2174aef 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -169,6 +169,32 @@ question. Code: `src/features/help/`.
   navigation always shows a blank form (state is reset when the page is hidden, as in `ForgotPasswordForm`), unlike
   Projects, which keeps what was added.
 
+## My Plan (U-40, A-23)
+
+`/my-plan` (all roles, sidebar link "My Plan" under My Insights) shows the plan and a token meter, and the one place a
+role changes what the page can do. Code: `src/features/plan/`. Still to do: the rest of the plan content (placeholder),
+real top-ups and a history (Token Usage, U-35, is a separate screen).
+
+- Heading "My Plan" (level 2); sections "Plan details" (Organisation "Northwind Quality Labs", Plan "Team", and a line
+  "Other plan details are not available yet.") and "Token meter" (level 3).
+- Token meter: a progress bar named "Share of tokens consumed" (0 to 100, now 62), the text "62% used", and the figures
+  Token allowance 100,000, Tokens used 62,400, Tokens remaining 37,600 (numbers always written like 1,000,000).
+- **Admin** sees a button "Add tokens"; **User** sees "Request tokens" (never both). The button shows once the session is
+  known, not before: the stand-in role is admin, and a user would otherwise see the admin's button for a moment.
+- Admin: dialog "Add tokens", field "Amount", buttons "Confirm top-up" and "Cancel". A good amount closes the dialog,
+  raises the allowance, and shows a status "Top-up applied": `Added 5,000 tokens. You now have 42,600 tokens remaining.`
+  The meter moves (105,000 / 62,400 / 42,600, 59%); tokens used never change.
+- User: dialog "Request tokens", fields "Amount" and "Reason", buttons "Send request" and "Cancel". A good form closes the
+  dialog and shows a status "Request sent": `Your request for 2,500 tokens was sent to your admin.` The meter does not
+  move.
+- Amount rules (both roles): spaces around it are ignored; commas are fine only as thousands separators ("5,000"; "1,00"
+  and "5 000" are not); no decimals, signs or words. Messages: "Enter a number of tokens." (empty), "Enter a whole number
+  greater than zero." (0, 1.5, -5, abc, +5), "You can add at most 1,000,000 tokens at a time." (or "request"; 1,000,001
+  and up fails, exactly 1,000,000 passes). A user's empty Reason: "Tell your admin why you need them." (spaces alone
+  count as empty). Focus goes to the first wrong field, Amount before Reason.
+- Statuses have a "Dismiss" button. **Nothing is saved**: a full reload returns to 100,000 / 62,400 / 37,600. A
+  client-side navigation away and back keeps an admin's new allowance but drops last visit's status.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index ebeff39..9f652b5 100644
--- a/README.md
+++ b/README.md
@@ -89,6 +89,13 @@ product areas), a **Subject** (up to 80 characters) and **Details** (at least 10
 sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox behind this test app. Code lives in
 `src/features/help/`.
 
+## My Plan (U-40, A-23)
+
+`/my-plan` (sidebar: **My Plan** under My Insights, all roles) shows the organisation, the plan and a token meter
+(100,000 allowance, 62,400 used, 37,600 left, 62%). An **admin** gets **Add tokens** (the allowance and the meter move);
+a **user** gets **Request tokens** (amount and reason; nothing moves). **Nothing is saved**: a full reload returns to the
+seeded numbers. Other plan content is still to do. Code lives in `src/features/plan/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/my-plan/page.tsx b/src/app/(app)/my-plan/page.tsx
index 4eabbbc..a46a81e 100644
--- a/src/app/(app)/my-plan/page.tsx
+++ b/src/app/(app)/my-plan/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { PlanScreen } from "@/features/plan/PlanScreen";
+
+export const metadata: Metadata = { title: "My Plan" };
 
 export default function Page() {
-  return <PagePlaceholder route="/my-plan" />;
+  return <PlanScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 2ebcdcd..dc05aeb 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -272,10 +272,12 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/my-plan",
     title: "My Plan",
-    description: "Organisation name and token meter (other plan content is placeholder).",
-    features: ["U-40"],
+    description:
+      "Organisation name and token meter; an Admin can add tokens, a User can request them (other plan content is placeholder, nothing is saved).",
+    features: ["U-40", "A-23"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
+    nav: { group: "My Insights", label: "My Plan" },
   },
   {
     path: "/access-denied",
diff --git a/src/features/plan/PlanScreen.tsx b/src/features/plan/PlanScreen.tsx
new file mode 100644
index 0000000..cda989e
--- /dev/null
+++ b/src/features/plan/PlanScreen.tsx
@@ -0,0 +1,113 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import { Alert, Box, Button, Group, Modal, Paper, Progress, Stack, Text, Title } from "@mantine/core";
+import { useDisclosure } from "@mantine/hooks";
+import { useSession } from "@/components/auth/useSession";
+import { getDevRole } from "@/lib/role";
+import { TokenForm } from "./TokenForm";
+import { formatTokens, ORG_NAME, PLAN_NAME, SEED_ALLOWANCE, TOKENS_USED, usedPercent } from "./data";
+
+interface Notice {
+  title: string;
+  text: string;
+}
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
+// My Plan (U-40, A-23): the organisation, the plan and the token meter. An admin tops up the allowance (the meter
+// moves); a user asks their admin for tokens (nothing moves). Other plan content is still to build. The balance lives
+// in this component only, so a full reload goes back to the seeded numbers.
+export function PlanScreen() {
+  const session = useSession();
+  const [allowance, setAllowance] = useState(SEED_ALLOWANCE);
+  const [notice, setNotice] = useState<Notice | null>(null);
+  const [dialogOpen, { open: openDialog, close: closeDialog }] = useDisclosure(false);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so drop the confirmation then: it is about last visit. The balance is
+  // kept, like the list on the Projects screen.
+  useEffect(() => () => setNotice(null), []);
+
+  // Wait for the session: the stand-in role is admin, so a user would otherwise see the admin's button for a moment.
+  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
+  const isAdmin = role === "admin";
+  const remaining = allowance - TOKENS_USED;
+  const percent = usedPercent(allowance);
+
+  function onSubmit(amount: number) {
+    if (isAdmin) {
+      const next = allowance + amount;
+      setAllowance(next);
+      setNotice({
+        title: "Top-up applied",
+        text: `Added ${formatTokens(amount)} tokens. You now have ${formatTokens(next - TOKENS_USED)} tokens remaining.`,
+      });
+    } else {
+      setNotice({ title: "Request sent", text: `Your request for ${formatTokens(amount)} tokens was sent to your admin.` });
+    }
+    closeDialog();
+  }
+
+  return (
+    <Stack gap="md" maw={640}>
+      <Title order={2}>My Plan</Title>
+      <Text c="dimmed">Your organisation&apos;s plan and token balance.</Text>
+
+      {notice && (
+        <Alert color="green" title={notice.title} role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setNotice(null)}>
+          {notice.text}
+        </Alert>
+      )}
+
+      <Paper withBorder p="md">
+        <Stack gap="sm">
+          <Title order={3}>Plan details</Title>
+          <Box component="dl" m={0}>
+            <Group gap="xl">
+              <Fact term="Organisation">{ORG_NAME}</Fact>
+              <Fact term="Plan">{PLAN_NAME}</Fact>
+            </Group>
+          </Box>
+          <Text size="sm" c="dimmed">
+            Other plan details are not available yet.
+          </Text>
+        </Stack>
+      </Paper>
+
+      <Paper withBorder p="md">
+        <Stack gap="sm">
+          <Group justify="space-between" align="flex-start">
+            <Title order={3}>Token meter</Title>
+            {isAdmin && <Button onClick={openDialog}>Add tokens</Button>}
+            {role === "user" && <Button onClick={openDialog}>Request tokens</Button>}
+          </Group>
+          <Progress value={percent} size="lg" aria-label="Share of tokens consumed" />
+          <Text size="sm">{percent}% used</Text>
+          <Box component="dl" m={0}>
+            <Group gap="xl">
+              <Fact term="Token allowance">{formatTokens(allowance)}</Fact>
+              <Fact term="Tokens used">{formatTokens(TOKENS_USED)}</Fact>
+              <Fact term="Tokens remaining">{formatTokens(remaining)}</Fact>
+            </Group>
+          </Box>
+        </Stack>
+      </Paper>
+
+      <Modal opened={dialogOpen} onClose={closeDialog} title={isAdmin ? "Add tokens" : "Request tokens"}>
+        <TokenForm mode={isAdmin ? "add" : "request"} onSubmit={onSubmit} onCancel={closeDialog} />
+      </Modal>
+    </Stack>
+  );
+}
diff --git a/src/features/plan/TokenForm.tsx b/src/features/plan/TokenForm.tsx
new file mode 100644
index 0000000..698f71d
--- /dev/null
+++ b/src/features/plan/TokenForm.tsx
@@ -0,0 +1,69 @@
+"use client";
+
+import { useRef, useState } from "react";
+import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
+import { parseAmount, type Verb } from "./data";
+
+interface Props {
+  mode: Verb;
+  onSubmit: (amount: number, reason: string) => void;
+  onCancel: () => void;
+}
+
+// The body of the Add tokens dialog (an admin tops up the allowance) and of the Request tokens dialog (a user asks
+// their admin, with a reason). It sits inside the Modal, which unmounts it on close, so every opening starts blank.
+export function TokenForm({ mode, onSubmit, onCancel }: Props) {
+  const [amount, setAmount] = useState("");
+  const [reason, setReason] = useState("");
+  const [amountError, setAmountError] = useState<string>();
+  const [reasonError, setReasonError] = useState<string>();
+  const amountRef = useRef<HTMLInputElement>(null);
+  const reasonRef = useRef<HTMLTextAreaElement>(null);
+
+  function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const parsed = parseAmount(amount, mode);
+    const missingReason = mode === "request" && !reason.trim() ? "Tell your admin why you need them." : undefined;
+    setAmountError("error" in parsed ? parsed.error : undefined);
+    setReasonError(missingReason);
+    if ("error" in parsed) return amountRef.current?.focus();
+    if (missingReason) return reasonRef.current?.focus();
+    onSubmit(parsed.amount, reason.trim());
+  }
+
+  return (
+    <form onSubmit={submit} noValidate>
+      <Stack>
+        <TextInput
+          ref={amountRef}
+          label="Amount"
+          name="amount"
+          inputMode="numeric"
+          autoComplete="off"
+          data-autofocus
+          value={amount}
+          onChange={(e) => setAmount(e.currentTarget.value)}
+          error={amountError}
+        />
+        {mode === "request" && (
+          <Textarea
+            ref={reasonRef}
+            label="Reason"
+            name="reason"
+            autosize
+            minRows={2}
+            value={reason}
+            onChange={(e) => setReason(e.currentTarget.value)}
+            error={reasonError}
+          />
+        )}
+        <Group justify="flex-end">
+          <Button variant="default" onClick={onCancel}>
+            Cancel
+          </Button>
+          <Button type="submit">{mode === "add" ? "Confirm top-up" : "Send request"}</Button>
+        </Group>
+      </Stack>
+    </form>
+  );
+}
diff --git a/src/features/plan/data.ts b/src/features/plan/data.ts
new file mode 100644
index 0000000..02554ce
--- /dev/null
+++ b/src/features/plan/data.ts
@@ -0,0 +1,33 @@
+export const ORG_NAME = "Northwind Quality Labs";
+export const PLAN_NAME = "Team";
+
+// The token meter every visit starts with (U-40, A-23). Fixed numbers so the screen reads the same on any day: 62,400 of
+// 100,000 tokens used, 37,600 left, 62%. Only the allowance can change in the browser (an admin's top-up); the tokens
+// used stay as they are.
+export const SEED_ALLOWANCE = 100_000;
+export const TOKENS_USED = 62_400;
+export const MAX_AMOUNT = 1_000_000;
+
+// Always "en-US" (1,000,000): the server render and the browser must agree, whatever the browser's own locale.
+export function formatTokens(count: number): string {
+  return count.toLocaleString("en-US");
+}
+
+export function usedPercent(allowance: number): number {
+  return Math.round((TOKENS_USED / allowance) * 100);
+}
+
+export type Verb = "add" | "request";
+export type AmountResult = { amount: number } | { error: string };
+
+// Reads the Amount field. Surrounding spaces are ignored, and commas are fine as thousands separators ("5,000"), but
+// nothing else is: no decimals, signs or words. Returns the number, or the message to show under the field.
+export function parseAmount(text: string, verb: Verb): AmountResult {
+  const value = text.trim();
+  if (!value) return { error: "Enter a number of tokens." };
+  if (!/^(\d{1,3}(,\d{3})+|\d+)$/.test(value)) return { error: "Enter a whole number greater than zero." };
+  const amount = Number(value.replace(/,/g, ""));
+  if (amount < 1) return { error: "Enter a whole number greater than zero." };
+  if (amount > MAX_AMOUNT) return { error: `You can ${verb} at most ${formatTokens(MAX_AMOUNT)} tokens at a time.` };
+  return { amount };
+}
```
