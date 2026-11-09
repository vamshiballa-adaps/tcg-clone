export const RUN_STATUSES = ["Draft", "Running", "Completed", "Failed"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export type RunScope = "mine" | "everyone";

export interface Run {
  id: number;
  name: string;
  project: string;
  creator: string;
  stage: string; // the pipeline stage the run is at (or ended at)
  status: RunStatus;
  started: string; // YYYY-MM-DD
  testCases: number;
}

// The runs every visit starts with, newest first. Fixed text (not dates) so the screen reads the same on any day. Nothing
// is saved: a full reload shows exactly this list. "Mine" is the runs whose creator is the signed-in person, so the two
// accounts see different rows there and the same eight under "Everyone".
export const SEED_RUNS: Run[] = [
  { id: 48, name: "Checkout flow, cycle 4", project: "Payments Gateway", creator: "Alex Admin", stage: "Execute Scripts", status: "Running", started: "2026-11-08", testCases: 24 },
  { id: 47, name: "Portal login hardening", project: "Customer Portal", creator: "Uma User", stage: "Generate Test Cases", status: "Running", started: "2026-11-07", testCases: 12 },
  { id: 46, name: "Onboarding happy path", project: "Mobile Onboarding", creator: "Uma User", stage: "Reports & Exports", status: "Completed", started: "2026-11-05", testCases: 18 },
  { id: 45, name: "Refund edge cases", project: "Payments Gateway", creator: "Alex Admin", stage: "Requirements Analysis", status: "Draft", started: "2026-11-04", testCases: 0 },
  { id: 44, name: "Invoice export", project: "Legacy Billing", creator: "Sam Rivera", stage: "Scenario Analyzer", status: "Failed", started: "2026-10-29", testCases: 0 },
  { id: 43, name: "Profile page review", project: "Customer Portal", creator: "Uma User", stage: "Reports & Exports", status: "Completed", started: "2026-10-27", testCases: 21 },
  { id: 42, name: "Wallet payments", project: "Payments Gateway", creator: "Alex Admin", stage: "Reports & Exports", status: "Completed", started: "2026-10-22", testCases: 30 },
  { id: 41, name: "Audit evidence sweep", project: "2024 Audit Prep", creator: "Alex Admin", stage: "Requirements Input", status: "Draft", started: "2026-10-12", testCases: 0 },
];

// The runs under a tab: "mine" keeps the ones the named person created, "everyone" keeps all of them.
export function runsInScope(runs: Run[], scope: RunScope, personName: string): Run[] {
  return scope === "everyone" ? runs : runs.filter((r) => r.creator === personName);
}

// Search matches the run name, its project or its creator, ignoring case and surrounding spaces. An empty query matches
// everything.
export function matchesRun(run: Run, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [run.name, run.project, run.creator].some((field) => field.toLowerCase().includes(q));
}

// What shows instead of the table when nothing is left. A search wins over the status filter in the message.
export function emptyMessage(query: string, status: RunStatus | "", scope: RunScope, tabTotal: number): string {
  const q = query.trim();
  if (q) return `No runs match "${q}".`;
  if (status) return `No ${status.toLowerCase()} runs.`;
  return scope === "mine" && tabTotal === 0 ? "You have no runs yet." : "No runs to show.";
}
