import type { Department } from "@/config/departments";

export const PROJECT_STATUSES = ["Active", "On hold", "Archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const NAME_MAX = 50;

export interface Project {
  id: string;
  name: string;
  code: string;
  department: Department;
  creator: string;
  description: string;
  inputs: number;
  outputs: number;
  runs: number;
  lastActivity: string;
  status: ProjectStatus;
}

// What the New project form collects. `department` is "" until one is chosen.
export interface ProjectDraft {
  name: string;
  department: Department | "";
  code: string;
  status: ProjectStatus;
  description: string;
}

export type DraftErrors = Partial<Record<"name" | "department" | "code", string>>;

// The list every visit starts with, newest activity first. Fixed text (not dates) so the screen reads the same on any
// day. Projects added in the browser are not saved: a full reload goes back to exactly this list.
export const SEED_PROJECTS: Project[] = [
  {
    id: "seed-pay",
    name: "Payments Gateway",
    code: "PAY",
    department: "Engineering",
    creator: "Alex Admin",
    description: "Card and wallet payments for the storefront.",
    inputs: 6,
    outputs: 18,
    runs: 11,
    lastActivity: "Today",
    status: "Active",
  },
  {
    id: "seed-cpt",
    name: "Customer Portal",
    code: "CPT",
    department: "Product",
    creator: "Uma User",
    description: "Self-service account area for customers.",
    inputs: 3,
    outputs: 9,
    runs: 5,
    lastActivity: "Yesterday",
    status: "Active",
  },
  {
    id: "seed-mob",
    name: "Mobile Onboarding",
    code: "MOB",
    department: "QA",
    creator: "Uma User",
    description: "First-run flow of the mobile app.",
    inputs: 5,
    outputs: 14,
    runs: 9,
    lastActivity: "5 days ago",
    status: "Active",
  },
  {
    id: "seed-lbl",
    name: "Legacy Billing",
    code: "LBL",
    department: "Finance",
    creator: "Sam Rivera",
    description: "Invoicing system being retired.",
    inputs: 2,
    outputs: 4,
    runs: 3,
    lastActivity: "3 weeks ago",
    status: "On hold",
  },
  {
    id: "seed-aud",
    name: "2024 Audit Prep",
    code: "AUD",
    department: "Finance",
    creator: "Alex Admin",
    description: "Evidence gathering for the 2024 audit.",
    inputs: 1,
    outputs: 6,
    runs: 2,
    lastActivity: "4 months ago",
    status: "Archived",
  },
];

// Checks the New project form. Names are compared trimmed and case-insensitively, so "payments gateway" clashes with
// "Payments Gateway". Returns one message per field that is wrong, or {} when the draft can be saved.
export function validateDraft(draft: ProjectDraft, existing: Project[]): DraftErrors {
  const errors: DraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter a project name.";
  else if (name.length > NAME_MAX) errors.name = `Project name must be ${NAME_MAX} characters or fewer.`;
  else if (existing.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = "A project with this name already exists.";
  }
  if (!draft.department) errors.department = "Choose a department.";
  if (!draft.code.trim()) errors.code = "Enter a project code.";
  return errors;
}

// Search matches name, code, department or creator, ignoring case. An empty query matches everything.
export function matchesQuery(project: Project, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [project.name, project.code, project.department, project.creator].some((field) =>
    field.toLowerCase().includes(q),
  );
}
