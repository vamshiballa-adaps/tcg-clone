// The reset-password screen (S-01) has no mail service or token store behind it, so a reset link is judged by its token
// alone, with two fixed values: a tester can reach every state by typing the address.
export const VALID_TOKEN = "valid-token";
export const EXPIRED_TOKEN = "expired-token";

export const PASSWORD_MIN = 8;

export type LinkState = "valid" | "expired" | "invalid";

// "valid-token" opens the form, "expired-token" says the link has expired, and anything else (no token, an empty one, a
// different one, or the right one in another case) is not a valid link. Compared exactly, not trimmed.
export function linkState(token: string | null): LinkState {
  if (token === VALID_TOKEN) return "valid";
  if (token === EXPIRED_TOKEN) return "expired";
  return "invalid";
}

export interface ResetDraft {
  next: string;
  confirm: string;
}

export type ResetErrors = Partial<Record<keyof ResetDraft, string>>;

// Checks the new password and its confirmation. Passwords are compared exactly: not trimmed, case-sensitive, so a
// password of 8 spaces counts as 8 characters. Returns one message per field that is wrong, or {} when it can be saved.
export function validateReset(draft: ResetDraft): ResetErrors {
  const errors: ResetErrors = {};
  if (!draft.next) errors.next = "Enter a new password.";
  else if (draft.next.length < PASSWORD_MIN) errors.next = `New password must be at least ${PASSWORD_MIN} characters.`;
  if (!draft.confirm) errors.confirm = "Confirm your new password.";
  else if (draft.confirm !== draft.next) errors.confirm = "Passwords do not match.";
  return errors;
}
