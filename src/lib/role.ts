// Tenant roles from BRD section 2. Platform/System Admin (/admin surface) are out of the base setup.
export type Role = "user" | "admin";

// Stand-in for the real session (S-01). Replace with the signed session cookie's role/capabilities.
export function getDevRole(): Role {
  return process.env.NEXT_PUBLIC_DEV_ROLE === "user" ? "user" : "admin";
}

export function canAccess(role: Role, required: Role | "all"): boolean {
  return required === "all" || role === "admin" || role === required;
}
