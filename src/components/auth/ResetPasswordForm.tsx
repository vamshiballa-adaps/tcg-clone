"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Anchor, Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { linkState, validateReset, type ResetDraft, type ResetErrors } from "@/lib/auth/reset-link";

const BLANK: ResetDraft = { next: "", confirm: "" };

// The reset-password screen (S-01), opened from a link such as /reset-password?token=valid-token. There is no mail
// service or token store behind this test app, so the link is judged by its token alone (see lib/auth/reset-link.ts) and
// a new password is checked and then confirmed, never saved: signing in still uses the built-in passwords.
export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const state = linkState(token);
  const [draft, setDraft] = useState<ResetDraft>(BLANK);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [done, setDone] = useState(false);
  const nextRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so wipe the form and the confirmation then: every visit starts blank
  // instead of showing last visit's "Password reset" with no form left.
  useEffect(
    () => () => {
      setDraft(BLANK);
      setErrors({});
      setDone(false);
    },
    [],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateReset(draft);
    setErrors(found);
    if (found.next) return nextRef.current?.focus();
    if (found.confirm) return confirmRef.current?.focus();
    setDone(true);
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>Reset password</Title>
        {state === "valid" && !done && <Text c="dimmed">Choose a new password for your account.</Text>}
      </Stack>

      {state === "invalid" && (
        <Alert color="red" title="Link not valid" role="alert">
          This link can&apos;t be used to reset a password.
        </Alert>
      )}
      {state === "expired" && (
        <Alert color="red" title="Link expired" role="alert">
          This link is older than the time allowed.
        </Alert>
      )}
      {state !== "valid" && (
        <Anchor component={Link} href="/forgot-password" size="sm">
          Request a new link
        </Anchor>
      )}

      {state === "valid" &&
        (done ? (
          <Alert color="green" title="Password reset" role="status">
            Your password was reset.
          </Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Stack>
              <TextInput
                ref={nextRef}
                label="New password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={draft.next}
                onChange={(e) => setDraft({ ...draft, next: e.currentTarget.value })}
                error={errors.next}
              />
              <TextInput
                ref={confirmRef}
                label="Confirm password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={draft.confirm}
                onChange={(e) => setDraft({ ...draft, confirm: e.currentTarget.value })}
                error={errors.confirm}
              />
              <Button type="submit">Save new password</Button>
            </Stack>
          </form>
        ))}

      <Anchor component={Link} href="/login" size="sm">
        Back to sign in
      </Anchor>
    </Stack>
  );
}
