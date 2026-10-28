import type { Role } from "@/lib/role";

// What the UI knows about the signed-in person. Safe to import from client code.
export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}
