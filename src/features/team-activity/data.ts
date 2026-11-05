// What Team Activity (A-09) shows: the people in the workspace and what each did lately. Seeded, and the same for every
// viewer; only an admin can open a person's activity. The three people are the ones Token Usage and Projects already name.
export interface ActivityEvent {
  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
  what: string;
}

export interface TeamMember {
  name: string;
  role: "Workspace admin" | "Workspace user"; // spelled as on Profile, so it never repeats the header's role badge
  runsThisMonth: number;
  lastActive: string; // YYYY-MM-DD
  events: ActivityEvent[]; // newest first
}

// Alphabetical by name, as shown.
export const TEAM: TeamMember[] = [
  {
    name: "Alex Admin",
    role: "Workspace admin",
    runsThisMonth: 6,
    lastActive: "2026-11-03",
    events: [
      { date: "2026-11-03", what: "Exported the Payments Gateway report" },
      { date: "2026-11-02", what: "Approved the scenarios for Payments Gateway" },
      { date: "2026-10-30", what: "Created the project 2024 Audit Prep" },
      { date: "2026-10-28", what: "Ran the scripts against Payments Gateway" },
    ],
  },
  {
    name: "Sam Rivera",
    role: "Workspace user",
    runsThisMonth: 3,
    lastActive: "2026-10-29",
    events: [
      { date: "2026-10-29", what: "Reviewed the Legacy Billing analysis" },
      { date: "2026-10-27", what: "Added requirements to Legacy Billing" },
      { date: "2026-10-24", what: "Started a run for Legacy Billing" },
    ],
  },
  {
    name: "Uma User",
    role: "Workspace user",
    runsThisMonth: 9,
    lastActive: "2026-11-03",
    events: [
      { date: "2026-11-03", what: "Generated test cases for Customer Portal" },
      { date: "2026-11-02", what: "Started a run for Mobile Onboarding" },
      { date: "2026-10-30", what: "Generated automation scripts for Customer Portal" },
      { date: "2026-10-29", what: "Added requirements to Customer Portal" },
    ],
  },
];
