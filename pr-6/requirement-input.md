# Change requirement input — PR #6: Add Forgot password screen (S-01)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/6
- **Author:** Bhargav-85
- **Branch:** `feature/forgot-password` → `main`
- **Compared:** `10c371ebd89e`...`eb8cf11fddc8`
- **Generated:** 2026-10-30T05:11:47.214Z (event: pull_request/opened)

## Description

/forgot-password is no longer a placeholder: an Email field and a "Send reset link" button, the same email messages as sign-in, and a "Reset link sent" confirmation that is identical for every well-formed address (known, unknown or locked) so the screen never reveals which emails have an account. No mail is sent; /reset-password is still a placeholder.

The form is wiped when Next hides the page on navigation, so a return by client-side navigation shows a blank form rather than last visit's confirmation. The confirmation title avoids the word "email" so it cannot collide with getByLabel("Email").

Email validation moves to src/lib/auth/validation.ts and the sign-in form uses it too, so both screens word the messages the same way.

## Files changed (7, +107 / -11)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +12 / -1 |
| M | README.md | +4 / -1 |
| M | src/app/(auth)/forgot-password/page.tsx | +5 / -2 |
| A | src/components/auth/ForgotPasswordForm.tsx | +71 / -0 |
| M | src/components/auth/LoginForm.tsx | +2 / -5 |
| M | src/config/routes.ts | +3 / -2 |
| A | src/lib/auth/validation.ts | +10 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index deb1349..dd22fe4 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -41,6 +41,11 @@ below).
   login flow with a role-gated UI, since TCG's steps usually start with "Login ...".
 - **Never give two different destructive actions the same label**, and expect TCG never to click destructive-named
   controls during a crawl.
+- **Keep names from colliding with a field's label.** Playwright's `getByLabel("Email")` is a case-insensitive substring
+  match, so an alert titled "Check your email" also matched it. Also, after a client-side navigation Next keeps the
+  previous page in the DOM, hidden: role locators skip it, but `getByLabel` still counts it, and its state comes back
+  when you return (a form can reappear half-filled or showing last visit's result). Reset such state when the
+  page is hidden (see `ForgotPasswordForm`).
 - **Reachability.** TCG's crawler and Execute Scripts block private, loopback and link-local addresses (an SSRF guard,
   with a `CRAWL_ALLOWED_HOSTS` allowlist). Do not assume `localhost` or LAN URLs work; plan on a publicly reachable
   deployment, and ask the user if that is not possible.
@@ -101,11 +106,17 @@ Behaviour a test can rely on:
   Scripts, and the crawl's optional login, with credentials. The Home startup cases in
   `docs/failed-cases/home-screen-startup.md` now begin after a sign-in (the sign-in is a full load of `/`, so the
   startup screen still plays).
+- **Forgot password** (`/forgot-password`, open signed out, linked from sign-in as "Forgot password?"): heading "Forgot
+  password", field "Email", button "Send reset link", link "Back to sign in". Same email messages as sign-in ("Enter your
+  email address.", "Enter a valid email address."). Any well-formed address, known, unknown or locked, gets the same
+  status titled "Reset link sent": "If an account exists for <email>, a link to reset your password is on its way."
+  No mail is sent, and `/reset-password` is still a placeholder. The form is blank on every visit, including a return by
+  client-side navigation.
 - `AUTH_REQUIRED=false` (a runtime setting on the host, no rebuild) reverts to an open app for signed-out visitors, who
   get the build-time `NEXT_PUBLIC_DEV_ROLE`. Only the exact value `false` does that; unset or anything else keeps
   sign-in mandatory.
 
-Code: `src/app/(auth)/login/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
+Code: `src/app/(auth)/{login,forgot-password}/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
 `src/lib/auth/`, and `src/proxy.ts` (route gating). Pages and layouts never read the cookie: that would make them
 dynamic and the Home startup screen would stop being prerendered, so the UI asks `/api/auth/session` after load.
 
diff --git a/README.md b/README.md
index e7daddf..745e6bc 100644
--- a/README.md
+++ b/README.md
@@ -24,7 +24,7 @@ npm run dev                  # http://localhost:3000
 | `src/config/routes.ts` | **Screen registry.** Every screen from the catalogue: path, title, feature IDs (U-xx / A-xx / S-xx), min role, status, pipeline stage, sidebar entry. |
 | `src/config/pipeline.ts` | The 7 pipeline stages. |
 | `src/app/(app)/…` | Authenticated screens inside the app shell (sidebar: My Work / My Insights / My Organization). |
-| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). Only login is built (mock). |
+| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). Login and forgot password are built (mock). |
 | `src/app/api/auth/…`, `src/lib/auth/`, `src/proxy.ts` | Mock sign-in: login/logout/session endpoints, the signed session cookie, route gating. See "Sign in (mock auth)". |
 | `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle, who's signed in. |
 | `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
@@ -62,6 +62,9 @@ Other outcomes: "Enter your email address.", "Enter a valid email address.", "En
 or password." for a wrong password or unknown email. A successful sign-in always lands on the Dashboard (A-24). The
 header then shows the person's name, role and **Sign out**; the sidebar follows their role.
 
+- **Forgot password** (`/forgot-password`, open signed out): enter an email, press **Send reset link**. Any well-formed
+  address gets the same "Reset link sent" confirmation, whether or not an account exists, so the screen never reveals
+  which emails are registered. No mail is sent (no mail service yet) and `/reset-password` is still a placeholder.
 - **Session:** a signed, httpOnly cookie (`tcg_session`, 8 hours). The UI asks `/api/auth/session`; pages and layouts
   never read the cookie, so they stay prerendered.
 - **Gating (`src/proxy.ts`):** a signed-in role too low for a page sees "Access denied" at that URL (status 200); a
diff --git a/src/app/(auth)/forgot-password/page.tsx b/src/app/(auth)/forgot-password/page.tsx
index 96251e7..38c2d90 100644
--- a/src/app/(auth)/forgot-password/page.tsx
+++ b/src/app/(auth)/forgot-password/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
+
+export const metadata: Metadata = { title: "Forgot password" };
 
 export default function Page() {
-  return <PagePlaceholder route="/forgot-password" />;
+  return <ForgotPasswordForm />;
 }
diff --git a/src/components/auth/ForgotPasswordForm.tsx b/src/components/auth/ForgotPasswordForm.tsx
new file mode 100644
index 0000000..4cecd38
--- /dev/null
+++ b/src/components/auth/ForgotPasswordForm.tsx
@@ -0,0 +1,71 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import Link from "next/link";
+import { Alert, Anchor, Button, Stack, Text, TextInput, Title } from "@mantine/core";
+import { validateEmail } from "@/lib/auth/validation";
+
+// The forgot-password screen (S-01). There is no mail service behind this test app, so it only checks the address and
+// then confirms. The confirmation is the same for every well-formed address, known or not, so the screen never reveals
+// which emails have an account (the sign-in screen does the same with "Invalid email or password.").
+export function ForgotPasswordForm() {
+  const [email, setEmail] = useState("");
+  const [error, setError] = useState<string>();
+  const [sentTo, setSentTo] = useState<string | null>(null);
+  const emailRef = useRef<HTMLInputElement>(null);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so wipe the form then: every visit starts blank instead of showing last
+  // visit's confirmation (with no form left to send another link).
+  useEffect(
+    () => () => {
+      setEmail("");
+      setError(undefined);
+      setSentTo(null);
+    },
+    [],
+  );
+
+  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    const message = validateEmail(email);
+    setError(message);
+    if (message) return emailRef.current?.focus();
+    setSentTo(email.trim());
+  }
+
+  return (
+    <Stack gap="lg">
+      <Stack gap={4}>
+        <Title order={1}>Forgot password</Title>
+        <Text c="dimmed">Enter your email and we will send you a link to reset your password.</Text>
+      </Stack>
+
+      {sentTo ? (
+        <Alert color="green" title="Reset link sent" role="status">
+          If an account exists for {sentTo}, a link to reset your password is on its way.
+        </Alert>
+      ) : (
+        <form onSubmit={onSubmit} noValidate>
+          <Stack>
+            <TextInput
+              ref={emailRef}
+              label="Email"
+              name="email"
+              type="email"
+              autoComplete="username"
+              value={email}
+              onChange={(e) => setEmail(e.currentTarget.value)}
+              error={error}
+            />
+            <Button type="submit">Send reset link</Button>
+          </Stack>
+        </form>
+      )}
+
+      <Anchor component={Link} href="/login" size="sm">
+        Back to sign in
+      </Anchor>
+    </Stack>
+  );
+}
diff --git a/src/components/auth/LoginForm.tsx b/src/components/auth/LoginForm.tsx
index d874f96..69a218b 100644
--- a/src/components/auth/LoginForm.tsx
+++ b/src/components/auth/LoginForm.tsx
@@ -4,8 +4,7 @@ import { useRef, useState } from "react";
 import Link from "next/link";
 import { Alert, Anchor, Button, List, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
 import { DEMO_USERS } from "@/config/demo-users";
-
-const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+import { validateEmail } from "@/lib/auth/validation";
 
 interface FieldErrors {
   email?: string;
@@ -28,9 +27,7 @@ export function LoginForm() {
     setFormError(null);
 
     const trimmed = email.trim();
-    const errors: FieldErrors = {};
-    if (!trimmed) errors.email = "Enter your email address.";
-    else if (!EMAIL_RE.test(trimmed)) errors.email = "Enter a valid email address.";
+    const errors: FieldErrors = { email: validateEmail(trimmed) };
     if (!password) errors.password = "Enter your password.";
     setFieldErrors(errors);
     if (errors.email) return emailRef.current?.focus();
diff --git a/src/config/routes.ts b/src/config/routes.ts
index 4d8129e..d4137ce 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -298,10 +298,11 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/forgot-password",
     title: "Forgot password",
-    description: "Request a reset link.",
+    description:
+      "Request a reset link by email (mock; no mail service yet). The confirmation is the same for any valid address.",
     features: ["S-01"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
   },
   {
     path: "/reset-password",
diff --git a/src/lib/auth/validation.ts b/src/lib/auth/validation.ts
new file mode 100644
index 0000000..1392ee2
--- /dev/null
+++ b/src/lib/auth/validation.ts
@@ -0,0 +1,10 @@
+const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+
+// The email checks shared by the auth screens, so the sign-in and forgot-password forms word them identically. Returns
+// the message to show under the field, or undefined when the (trimmed) value is fine.
+export function validateEmail(value: string): string | undefined {
+  const trimmed = value.trim();
+  if (!trimmed) return "Enter your email address.";
+  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
+  return undefined;
+}
```
