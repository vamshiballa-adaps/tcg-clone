const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The email checks shared by the auth screens, so the sign-in and forgot-password forms word them identically. Returns
// the message to show under the field, or undefined when the (trimmed) value is fine.
export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}
