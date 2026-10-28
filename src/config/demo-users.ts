import type { Role } from "@/lib/role";

// Built-in accounts for the mock sign-in (S-01). There is no user store behind this app yet: /api/auth/login checks
// against this list, and the sign-in screen prints it so a tester knows what to type. Test app only.
export interface DemoUser {
  email: string; // lower case
  password: string;
  name: string;
  role: Role;
  locked?: boolean; // right credentials, but the account is refused
}

export const DEMO_USERS: DemoUser[] = [
  { email: "admin@tcg.test", password: "Admin#123", name: "Alex Admin", role: "admin" },
  { email: "user@tcg.test", password: "User#1234", name: "Uma User", role: "user" },
  { email: "locked@tcg.test", password: "Locked#123", name: "Lee Locked", role: "user", locked: true },
];
