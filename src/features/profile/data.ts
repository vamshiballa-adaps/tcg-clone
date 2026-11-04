import { DEMO_USERS } from "@/config/demo-users";
import { DEPARTMENTS, type Department } from "@/config/departments";

export const NAME_MAX = 40;
export const PASSWORD_MIN = 8;

// The department each built-in account starts with: the one its seeded projects are filed under. Anyone else starts
// with none chosen.
const SEED_DEPARTMENTS: Record<string, Department> = {
  "admin@tcg.test": "Engineering",
  "user@tcg.test": "Product",
};

export function seedDepartment(email: string): Department | "" {
  return SEED_DEPARTMENTS[email.trim().toLowerCase()] ?? "";
}

// The built-in account's real password, which "Current password" is checked against. It is already printed on the
// sign-in screen; there is no user store behind this app.
export function passwordFor(email: string): string | undefined {
  return DEMO_USERS.find((u) => u.email === email.trim().toLowerCase())?.password;
}

export interface ProfileDraft {
  name: string;
  department: Department | "";
}

export type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>;

// Checks the profile form. The name is compared trimmed, so spaces alone count as empty. Returns one message per field
// that is wrong, or {} when the profile can be saved.
export function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter your display name.";
  else if (name.length > NAME_MAX) errors.name = `Display name must be ${NAME_MAX} characters or fewer.`;
  if (!draft.department) errors.department = "Choose a department.";
  return errors;
}

export interface PasswordDraft {
  current: string;
  next: string;
  confirm: string;
}

export type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

export const BLANK_PASSWORDS: PasswordDraft = { current: "", next: "", confirm: "" };

// Checks the change-password form against the account's real password. Passwords are compared exactly (spaces count),
// not trimmed. "Must be different" only shows once the current password is right, so it never hints at a wrong one.
export function validatePasswordChange(draft: PasswordDraft, actual: string | undefined): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!draft.current) errors.current = "Enter your current password.";
  else if (draft.current !== actual) errors.current = "Current password is incorrect.";

  if (!draft.next) errors.next = "Enter a new password.";
  else if (draft.next.length < PASSWORD_MIN) errors.next = `New password must be at least ${PASSWORD_MIN} characters.`;
  else if (!errors.current && draft.next === draft.current) {
    errors.next = "New password must be different from your current password.";
  }

  if (!draft.confirm) errors.confirm = "Confirm your new password.";
  else if (draft.confirm !== draft.next) errors.confirm = "Passwords do not match.";
  return errors;
}

export const DEPARTMENT_OPTIONS = [
  { value: "", label: "Select a department" },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];
