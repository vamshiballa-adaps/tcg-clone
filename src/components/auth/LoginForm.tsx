"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Alert, Anchor, Button, List, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { DEMO_USERS } from "@/config/demo-users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

// The sign-in screen (S-01). Checks the two fields itself first, then asks /api/auth/login. Success always lands on the
// Dashboard (A-24), by a full page load so the session cookie is in place for the first request.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmed = email.trim();
    const errors: FieldErrors = {};
    if (!trimmed) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(trimmed)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      if (res.ok) {
        // A full page load on purpose, not router.push: the next request starts with the new session cookie and the
        // Home startup screen plays as it does on any fresh load. Stay in the submitting state until the page changes.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
        return;
      }
      setFormError(
        res.status === 401
          ? "Invalid email or password."
          : res.status === 423
            ? "This account is locked. Contact your workspace admin."
            : "Something went wrong. Try again.",
      );
    } catch {
      setFormError("Something went wrong. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>Sign in</Title>
        <Text c="dimmed">Use the account your workspace admin set up for you.</Text>
      </Stack>

      <form onSubmit={onSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" title="Can't sign in">
              {formError}
            </Alert>
          )}
          <TextInput
            ref={emailRef}
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            error={fieldErrors.email}
          />
          <TextInput
            ref={passwordRef}
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            error={fieldErrors.password}
          />
          <Button type="submit" loading={submitting}>
            Sign in
          </Button>
        </Stack>
      </form>

      <Anchor component={Link} href="/forgot-password" size="sm">
        Forgot password?
      </Anchor>

      <Paper withBorder p="md">
        <Text size="sm" fw={600}>
          Demo accounts
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          This is a test app. These accounts are built in.
        </Text>
        <List size="xs" listStyleType="none" spacing={4} aria-label="Demo accounts">
          {DEMO_USERS.map((u) => (
            <List.Item key={u.email}>
              {u.locked ? "Locked account (always refused)" : u.role === "admin" ? "Admin" : "User"}: {u.email} /{" "}
              {u.password}
            </List.Item>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
