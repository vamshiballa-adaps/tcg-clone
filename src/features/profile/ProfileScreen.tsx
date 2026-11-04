"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Group, NativeSelect, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import type { SessionUser } from "@/lib/auth/types";
import {
  BLANK_PASSWORDS,
  DEPARTMENT_OPTIONS,
  passwordFor,
  seedDepartment,
  validatePasswordChange,
  validateProfile,
  type PasswordErrors,
  type ProfileDraft,
  type ProfileErrors,
} from "./data";

interface Notice {
  title: string;
  text: string;
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <Text component="dt" size="sm" c="dimmed">
        {term}
      </Text>
      <Text component="dd" m={0} fw={500}>
        {children}
      </Text>
    </div>
  );
}

// The two forms and the account facts for one signed-in person. Mounted only once the session is known, so the fields
// start with that person's own name and department.
function ProfileBody({ user }: { user: SessionUser }) {
  const [seed] = useState<ProfileDraft>(() => ({ name: user.name, department: seedDepartment(user.email) }));
  const [profile, setProfile] = useState<ProfileDraft>(seed);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [passwords, setPasswords] = useState(BLANK_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLSelectElement>(null);
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so put everything back then: every visit starts with the saved-looking
  // name and department, empty password fields and no confirmation about last visit.
  useEffect(
    () => () => {
      setProfile(seed);
      setProfileErrors({});
      setPasswords(BLANK_PASSWORDS);
      setPasswordErrors({});
      setNotice(null);
    },
    [seed],
  );

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const found = validateProfile(profile);
    setProfileErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.department) return departmentRef.current?.focus();
    const name = profile.name.trim();
    setProfile({ ...profile, name });
    setNotice({ title: "Profile saved", text: `Your profile was updated: "${name}" in ${profile.department}.` });
  }

  function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const found = validatePasswordChange(passwords, passwordFor(user.email));
    setPasswordErrors(found);
    if (found.current) return currentRef.current?.focus();
    if (found.next) return nextRef.current?.focus();
    if (found.confirm) return confirmRef.current?.focus();
    setPasswords(BLANK_PASSWORDS);
    setNotice({ title: "Password changed", text: "Your password was changed." });
  }

  return (
    <>
      {notice && (
        <Alert color="green" title={notice.title} role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Title order={3}>Account</Title>
          <Box component="dl" m={0}>
            <Group gap="xl">
              <Fact term="Email">{user.email}</Fact>
              <Fact term="Role">{user.role === "admin" ? "Workspace admin" : "Workspace user"}</Fact>
            </Group>
          </Box>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <form onSubmit={saveProfile} noValidate>
          <Stack>
            <Title order={3}>Edit profile</Title>
            <TextInput
              ref={nameRef}
              label="Display name"
              name="name"
              autoComplete="off"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.currentTarget.value })}
              error={profileErrors.name}
            />
            <NativeSelect
              ref={departmentRef}
              label="Department"
              name="department"
              data={DEPARTMENT_OPTIONS}
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.currentTarget.value as ProfileDraft["department"] })}
              error={profileErrors.department}
            />
            <Group>
              <Button type="submit">Save profile</Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <Paper withBorder p="md">
        <form onSubmit={changePassword} noValidate>
          <Stack>
            <Title order={3}>Password</Title>
            <TextInput
              ref={currentRef}
              label="Current password"
              name="current-password"
              type="password"
              autoComplete="current-password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.currentTarget.value })}
              error={passwordErrors.current}
            />
            <TextInput
              ref={nextRef}
              label="New password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={passwords.next}
              onChange={(e) => setPasswords({ ...passwords, next: e.currentTarget.value })}
              error={passwordErrors.next}
            />
            <TextInput
              ref={confirmRef}
              label="Confirm password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.currentTarget.value })}
              error={passwordErrors.confirm}
            />
            <Group>
              <Button type="submit">Change password</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </>
  );
}

// Profile (U-40, U-44): the signed-in person's account, display name and department, and a change-password form
// checked against the built-in account's real password. Nothing is saved and sign-in keeps using the built-in
// passwords, so a full reload (or leaving and coming back) shows the starting values again.
export function ProfileScreen() {
  const session = useSession();

  return (
    <Stack gap="md" maw={560}>
      <Title order={2}>Profile</Title>
      <Text c="dimmed">Your account details, and how you appear in the workspace.</Text>
      {session === null && <Text>You are not signed in, so there is no profile to show.</Text>}
      {session && <ProfileBody user={session} />}
    </Stack>
  );
}
