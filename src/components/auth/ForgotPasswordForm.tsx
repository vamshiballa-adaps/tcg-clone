"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Anchor, Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { validateEmail } from "@/lib/auth/validation";

// The forgot-password screen (S-01). There is no mail service behind this test app, so it only checks the address and
// then confirms. The confirmation is the same for every well-formed address, known or not, so the screen never reveals
// which emails have an account (the sign-in screen does the same with "Invalid email or password.").
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so wipe the form then: every visit starts blank instead of showing last
  // visit's confirmation (with no form left to send another link).
  useEffect(
    () => () => {
      setEmail("");
      setError(undefined);
      setSentTo(null);
    },
    [],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateEmail(email);
    setError(message);
    if (message) return emailRef.current?.focus();
    setSentTo(email.trim());
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>Forgot password</Title>
        <Text c="dimmed">Enter your email and we will send you a link to reset your password.</Text>
      </Stack>

      {sentTo ? (
        <Alert color="green" title="Reset link sent" role="status">
          If an account exists for {sentTo}, a link to reset your password is on its way.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack>
            <TextInput
              ref={emailRef}
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={error}
            />
            <Button type="submit">Send reset link</Button>
          </Stack>
        </form>
      )}

      <Anchor component={Link} href="/login" size="sm">
        Back to sign in
      </Anchor>
    </Stack>
  );
}
