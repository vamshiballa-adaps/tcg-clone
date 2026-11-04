# Merged change requirement input — Add Profile with display name, department and change password (U-40, U-44)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/17
- **Author:** Bhargav-85
- **Merged into:** `main` (from `feature/profile`)
- **Compared:** `b6751862e7a3`...`ab6ffadbf077`
- **Generated:** 2026-11-04T11:00:59.810Z (event: push)

## Description

## What

`/profile` was a placeholder. It is now a working Profile screen (catalogue U-40; notification preferences, U-44, are still to do).

- **Account:** the signed-in email and role ("Workspace admin" or "Workspace user", so it does not repeat the header's role badge).
- **Edit profile:** "Display name" (starts as the account's name; empty or spaces fail, 41+ characters fail, exactly 40 passes) and "Department" (Engineering, Finance, Product, QA; starts as Engineering for the admin and Product for the user). **Save profile** shows a status "Profile saved": `Your profile was updated: "<name>" in <department>.`
- **Password:** "Current password", "New password", "Confirm password" and **Change password**. The current password is checked against the signed-in account's real built-in password, so the admin's password is wrong on the user's account and the reverse. Not trimmed, case-sensitive. New password: at least 8 characters (7 fails, exactly 8 passes), different from the current one, and confirmed. A valid form clears the fields and shows "Password changed".
- Eight exact error messages, focus on the first wrong field, one status at a time, each with **Dismiss**.
- **Reachable:** a "Profile" link under My Work in the sidebar, for both roles.
- **Nothing is saved**, and sign-in keeps using the built-in passwords (a test that signs in again with the "new" password fails by design). Every visit starts with the starting values, including a return by client-side navigation (state resets when the page is hidden, as in `ForgotPasswordForm`).
- The third password label is "Confirm password", not "Confirm new password": `getByLabel("New password")` is a case-insensitive substring match and would find two fields.

Docs: new sections in `README.md` and `CLAUDE.md` with the exact labels and messages.

## Why this is useful for TCG

Two forms on one page, a check against a value that depends on who is signed in, boundary lengths (40/41, 7/8), a rule that depends on another field (different from current, must match confirm) and a success state that differs per form give generated tests real pass and fail cases, beyond the single forms already in the app.

## Checked

- `npm run lint`, `tsc --noEmit` and `npm run build` are clean.
- 58 browser checks (Playwright against `next start`) pass: signed-out gate, both roles' starting values, every message and its focus, the 40/41 and 7/8 boundaries, wrong, trimmed and wrong-case current passwords, each role's own password, one status at a time, leaving and returning, a full reload, keyboard Enter, a 390px-wide screen, and no console errors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Commits (2)

- `ab6ffadbf077` Merge pull request #17 from vamshiballa-adaps/feature/profile — Bhargav-85
- `5a87986e2cfa` Add Profile with display name, department and change password (U-40, U-44) — Chinthalapudi Bhargav

## Files changed (6, +315 / -4)

| Status | File | Lines |
| --- | --- | --- |
| M | CLAUDE.md | +28 / -0 |
| M | README.md | +8 / -0 |
| M | src/app/(app)/profile/page.tsx | +5 / -2 |
| M | src/config/routes.ts | +4 / -2 |
| A | src/features/profile/ProfileScreen.tsx | +197 / -0 |
| A | src/features/profile/data.ts | +73 / -0 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 5414dba..394bcc9 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -215,6 +215,34 @@ and the "What next?" menu (also U-38).
 - **Nothing is saved.** Every visit starts at step 1: a full reload, and also a client-side navigation away and back
   (state is reset when the page is hidden, as in `ForgotPasswordForm`), so a half-finished tour is not resumed.
 
+## Profile (U-40, U-44)
+
+`/profile` (all roles, sidebar link "Profile" under My Work) shows the signed-in account, lets the person edit their
+display name and department, and change their password. Code: `src/features/profile/`. Still to do: notification
+preferences (U-44).
+
+- Heading "Profile" (level 2); three sections (level 3): "Account" (Email and Role as a term/definition list; Role reads
+  "Workspace admin" or "Workspace user", so it never repeats the header's role badge), "Edit profile" and "Password".
+  The page waits for the session, so the fields start with that person's own values.
+- **Edit profile:** "Display name" (starts as the account's name, "Alex Admin" or "Uma User") and "Department" (select:
+  a prompt "Select a department", then Engineering, Finance, Product, QA; starts as Engineering for the admin and Product
+  for the user); button "Save profile". Messages: "Enter your display name." (empty or spaces), "Display name must be 40
+  characters or fewer." (41+ fails, exactly 40 passes), "Choose a department.". A valid form shows a status "Profile
+  saved": `Your profile was updated: "<name, trimmed>" in <department>.` The header keeps showing the session's name.
+- **Password:** "Current password", "New password", "Confirm password" (the last is not "Confirm new password" on
+  purpose: `getByLabel("New password")` is a substring match and would find two fields); button "Change password".
+  "Current password" is checked against the signed-in account's real built-in password, so the admin's password is wrong
+  on the user's account and the reverse. Passwords are compared exactly: not trimmed, case-sensitive. Messages: "Enter
+  your current password.", "Current password is incorrect.", "Enter a new password.", "New password must be at least 8
+  characters." (7 fails, exactly 8 passes), "New password must be different from your current password." (only once the
+  current one is right), "Confirm your new password.", "Passwords do not match.". A valid form clears the three fields
+  and shows a status "Password changed": "Your password was changed."
+- Focus goes to the first wrong field (Display name before Department; Current, New, Confirm in that order). Only one
+  status shows at a time: a new submit removes the old one, and each has a "Dismiss" button.
+- **Nothing is saved**, and signing in still uses the built-in passwords, so a test that signs out and signs in with
+  the "new" password fails by design. A full reload, and also a client-side navigation away and back (state is reset
+  when the page is hidden, as in `ForgotPasswordForm`), shows the starting values, empty password fields and no status.
+
 ## PR diff to requirement input (workflow)
 
 `.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
diff --git a/README.md b/README.md
index a4ac6d6..4fe8183 100644
--- a/README.md
+++ b/README.md
@@ -104,6 +104,14 @@ scripts. **Back**, **Next** and **Finish** move through it, a progress bar and "
 **Finish** shows "Tour complete" with **Start over**. Nothing is saved: every visit starts at step 1. The Guide and
 Shortcuts (also U-38) are still to do. Code lives in `src/features/get-started/`.
 
+## Profile (U-40, U-44)
+
+`/profile` (sidebar: **Profile** under My Work, all roles) shows the account (email and role), an **Edit profile** form
+(display name up to 40 characters, department) and a **Password** form (current, new of at least 8 characters, confirm).
+The current password is checked against the signed-in built-in account's real password. **Nothing is saved**: a reload
+shows the starting values, and sign-in keeps using the built-in passwords. Notification preferences are still to do.
+Code lives in `src/features/profile/`.
+
 ## PR diff → requirement input
 
 [`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
diff --git a/src/app/(app)/profile/page.tsx b/src/app/(app)/profile/page.tsx
index 359a2d2..9b41e8f 100644
--- a/src/app/(app)/profile/page.tsx
+++ b/src/app/(app)/profile/page.tsx
@@ -1,5 +1,8 @@
-import { PagePlaceholder } from "@/components/PagePlaceholder";
+import type { Metadata } from "next";
+import { ProfileScreen } from "@/features/profile/ProfileScreen";
+
+export const metadata: Metadata = { title: "Profile" };
 
 export default function Page() {
-  return <PagePlaceholder route="/profile" />;
+  return <ProfileScreen />;
 }
diff --git a/src/config/routes.ts b/src/config/routes.ts
index f77aaae..8e0ed2c 100644
--- a/src/config/routes.ts
+++ b/src/config/routes.ts
@@ -266,10 +266,12 @@ export const ROUTES: RouteDef[] = [
   {
     path: "/profile",
     title: "Profile",
-    description: "Edit profile and department, change password, notification preferences.",
+    description:
+      "Your account, display name and department, and a change-password form (notification preferences are still to build; nothing is saved).",
     features: ["U-40", "U-44"],
     roles: "all",
-    status: "todo",
+    status: "in-progress",
+    nav: { group: "My Work", label: "Profile" },
   },
   {
     path: "/my-plan",
diff --git a/src/features/profile/ProfileScreen.tsx b/src/features/profile/ProfileScreen.tsx
new file mode 100644
index 0000000..e00e7ba
--- /dev/null
+++ b/src/features/profile/ProfileScreen.tsx
@@ -0,0 +1,197 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+import { Alert, Box, Button, Group, NativeSelect, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
+import { useSession } from "@/components/auth/useSession";
+import type { SessionUser } from "@/lib/auth/types";
+import {
+  BLANK_PASSWORDS,
+  DEPARTMENT_OPTIONS,
+  passwordFor,
+  seedDepartment,
+  validatePasswordChange,
+  validateProfile,
+  type PasswordErrors,
+  type ProfileDraft,
+  type ProfileErrors,
+} from "./data";
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
+// The two forms and the account facts for one signed-in person. Mounted only once the session is known, so the fields
+// start with that person's own name and department.
+function ProfileBody({ user }: { user: SessionUser }) {
+  const [seed] = useState<ProfileDraft>(() => ({ name: user.name, department: seedDepartment(user.email) }));
+  const [profile, setProfile] = useState<ProfileDraft>(seed);
+  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
+  const [passwords, setPasswords] = useState(BLANK_PASSWORDS);
+  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
+  const [notice, setNotice] = useState<Notice | null>(null);
+  const nameRef = useRef<HTMLInputElement>(null);
+  const departmentRef = useRef<HTMLSelectElement>(null);
+  const currentRef = useRef<HTMLInputElement>(null);
+  const nextRef = useRef<HTMLInputElement>(null);
+  const confirmRef = useRef<HTMLInputElement>(null);
+
+  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
+  // effects are cleaned up when it is hidden, so put everything back then: every visit starts with the saved-looking
+  // name and department, empty password fields and no confirmation about last visit.
+  useEffect(
+    () => () => {
+      setProfile(seed);
+      setProfileErrors({});
+      setPasswords(BLANK_PASSWORDS);
+      setPasswordErrors({});
+      setNotice(null);
+    },
+    [seed],
+  );
+
+  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setNotice(null);
+    const found = validateProfile(profile);
+    setProfileErrors(found);
+    if (found.name) return nameRef.current?.focus();
+    if (found.department) return departmentRef.current?.focus();
+    const name = profile.name.trim();
+    setProfile({ ...profile, name });
+    setNotice({ title: "Profile saved", text: `Your profile was updated: "${name}" in ${profile.department}.` });
+  }
+
+  function changePassword(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault();
+    setNotice(null);
+    const found = validatePasswordChange(passwords, passwordFor(user.email));
+    setPasswordErrors(found);
+    if (found.current) return currentRef.current?.focus();
+    if (found.next) return nextRef.current?.focus();
+    if (found.confirm) return confirmRef.current?.focus();
+    setPasswords(BLANK_PASSWORDS);
+    setNotice({ title: "Password changed", text: "Your password was changed." });
+  }
+
+  return (
+    <>
+      {notice && (
+        <Alert color="green" title={notice.title} role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setNotice(null)}>
+          {notice.text}
+        </Alert>
+      )}
+
+      <Paper withBorder p="md">
+        <Stack gap="sm">
+          <Title order={3}>Account</Title>
+          <Box component="dl" m={0}>
+            <Group gap="xl">
+              <Fact term="Email">{user.email}</Fact>
+              <Fact term="Role">{user.role === "admin" ? "Workspace admin" : "Workspace user"}</Fact>
+            </Group>
+          </Box>
+        </Stack>
+      </Paper>
+
+      <Paper withBorder p="md">
+        <form onSubmit={saveProfile} noValidate>
+          <Stack>
+            <Title order={3}>Edit profile</Title>
+            <TextInput
+              ref={nameRef}
+              label="Display name"
+              name="name"
+              autoComplete="off"
+              value={profile.name}
+              onChange={(e) => setProfile({ ...profile, name: e.currentTarget.value })}
+              error={profileErrors.name}
+            />
+            <NativeSelect
+              ref={departmentRef}
+              label="Department"
+              name="department"
+              data={DEPARTMENT_OPTIONS}
+              value={profile.department}
+              onChange={(e) => setProfile({ ...profile, department: e.currentTarget.value as ProfileDraft["department"] })}
+              error={profileErrors.department}
+            />
+            <Group>
+              <Button type="submit">Save profile</Button>
+            </Group>
+          </Stack>
+        </form>
+      </Paper>
+
+      <Paper withBorder p="md">
+        <form onSubmit={changePassword} noValidate>
+          <Stack>
+            <Title order={3}>Password</Title>
+            <TextInput
+              ref={currentRef}
+              label="Current password"
+              name="current-password"
+              type="password"
+              autoComplete="current-password"
+              value={passwords.current}
+              onChange={(e) => setPasswords({ ...passwords, current: e.currentTarget.value })}
+              error={passwordErrors.current}
+            />
+            <TextInput
+              ref={nextRef}
+              label="New password"
+              name="new-password"
+              type="password"
+              autoComplete="new-password"
+              value={passwords.next}
+              onChange={(e) => setPasswords({ ...passwords, next: e.currentTarget.value })}
+              error={passwordErrors.next}
+            />
+            <TextInput
+              ref={confirmRef}
+              label="Confirm password"
+              name="confirm-password"
+              type="password"
+              autoComplete="new-password"
+              value={passwords.confirm}
+              onChange={(e) => setPasswords({ ...passwords, confirm: e.currentTarget.value })}
+              error={passwordErrors.confirm}
+            />
+            <Group>
+              <Button type="submit">Change password</Button>
+            </Group>
+          </Stack>
+        </form>
+      </Paper>
+    </>
+  );
+}
+
+// Profile (U-40, U-44): the signed-in person's account, display name and department, and a change-password form
+// checked against the built-in account's real password. Nothing is saved and sign-in keeps using the built-in
+// passwords, so a full reload (or leaving and coming back) shows the starting values again.
+export function ProfileScreen() {
+  const session = useSession();
+
+  return (
+    <Stack gap="md" maw={560}>
+      <Title order={2}>Profile</Title>
+      <Text c="dimmed">Your account details, and how you appear in the workspace.</Text>
+      {session === null && <Text>You are not signed in, so there is no profile to show.</Text>}
+      {session && <ProfileBody user={session} />}
+    </Stack>
+  );
+}
diff --git a/src/features/profile/data.ts b/src/features/profile/data.ts
new file mode 100644
index 0000000..385b110
--- /dev/null
+++ b/src/features/profile/data.ts
@@ -0,0 +1,73 @@
+import { DEMO_USERS } from "@/config/demo-users";
+import { DEPARTMENTS, type Department } from "@/config/departments";
+
+export const NAME_MAX = 40;
+export const PASSWORD_MIN = 8;
+
+// The department each built-in account starts with: the one its seeded projects are filed under. Anyone else starts
+// with none chosen.
+const SEED_DEPARTMENTS: Record<string, Department> = {
+  "admin@tcg.test": "Engineering",
+  "user@tcg.test": "Product",
+};
+
+export function seedDepartment(email: string): Department | "" {
+  return SEED_DEPARTMENTS[email.trim().toLowerCase()] ?? "";
+}
+
+// The built-in account's real password, which "Current password" is checked against. It is already printed on the
+// sign-in screen; there is no user store behind this app.
+export function passwordFor(email: string): string | undefined {
+  return DEMO_USERS.find((u) => u.email === email.trim().toLowerCase())?.password;
+}
+
+export interface ProfileDraft {
+  name: string;
+  department: Department | "";
+}
+
+export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;
+
+// Checks the profile form. The name is compared trimmed, so spaces alone count as empty. Returns one message per field
+// that is wrong, or {} when the profile can be saved.
+export function validateProfile(draft: ProfileDraft): ProfileErrors {
+  const errors: ProfileErrors = {};
+  const name = draft.name.trim();
+  if (!name) errors.name = "Enter your display name.";
+  else if (name.length > NAME_MAX) errors.name = `Display name must be ${NAME_MAX} characters or fewer.`;
+  if (!draft.department) errors.department = "Choose a department.";
+  return errors;
+}
+
+export interface PasswordDraft {
+  current: string;
+  next: string;
+  confirm: string;
+}
+
+export type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;
+
+export const BLANK_PASSWORDS: PasswordDraft = { current: "", next: "", confirm: "" };
+
+// Checks the change-password form against the account's real password. Passwords are compared exactly (spaces count),
+// not trimmed. "Must be different" only shows once the current password is right, so it never hints at a wrong one.
+export function validatePasswordChange(draft: PasswordDraft, actual: string | undefined): PasswordErrors {
+  const errors: PasswordErrors = {};
+  if (!draft.current) errors.current = "Enter your current password.";
+  else if (draft.current !== actual) errors.current = "Current password is incorrect.";
+
+  if (!draft.next) errors.next = "Enter a new password.";
+  else if (draft.next.length < PASSWORD_MIN) errors.next = `New password must be at least ${PASSWORD_MIN} characters.`;
+  else if (!errors.current && draft.next === draft.current) {
+    errors.next = "New password must be different from your current password.";
+  }
+
+  if (!draft.confirm) errors.confirm = "Confirm your new password.";
+  else if (draft.confirm !== draft.next) errors.confirm = "Passwords do not match.";
+  return errors;
+}
+
+export const DEPARTMENT_OPTIONS = [
+  { value: "", label: "Select a department" },
+  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
+];
```
