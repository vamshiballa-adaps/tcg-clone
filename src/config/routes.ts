import type { Role } from "@/lib/role";

// Single source of truth for screens, built from TCG_BRD_Feature_Catalogue.md.
// Each entry drives its placeholder page and (when `nav` is set) the sidebar.
// When you build a screen, replace its <PagePlaceholder /> and set status to "in-progress" / "done".

export type NavGroup = "My Work" | "My Insights" | "My Organization";
export type Status = "todo" | "in-progress" | "done";

export interface RouteDef {
  path: string; // Next.js route pattern
  title: string;
  description: string;
  features: string[]; // catalogue IDs (U-xx, A-xx, S-xx)
  roles: Role | "all"; // minimum role needed
  status: Status;
  stage?: number; // pipeline step (see config/pipeline.ts)
  nav?: { group: NavGroup; label: string };
}

export const ROUTES: RouteDef[] = [
  // ---- Home ----
  {
    path: "/",
    title: "Dashboard",
    description:
      "Where your work stands. Five boxes for a User (Inputs Registry, TCG Runs, Output Artefacts, Tokens, My Inbox); Admins get workspace-wide counts plus a Users box.",
    features: ["U-34", "A-22"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "Dashboard" },
  },

  // ---- Run pipeline (section 4.1) ----
  {
    path: "/tcg/runs",
    title: "TCG Runs",
    description:
      "One table of runs with Mine/Everyone tabs, search, filters, drafts and history. Draft sessions resume at the right stage.",
    features: ["U-01", "U-23"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "TCG Runs" },
  },
  {
    path: "/tcg/runs/start",
    title: "Start a run · Requirements Input",
    description:
      "Name the run, pick its project, then choose inputs: questionnaire, documents, Jira, Confluence, URLs / crawl, dictation, reviewers and approvers.",
    features: ["U-02", "U-03", "U-04", "U-05", "U-06", "U-07", "U-08", "U-43", "U-47"],
    roles: "all",
    status: "todo",
    stage: 1,
  },
  {
    path: "/tcg/runs/ri/[docId]",
    title: "Requirements Analysis",
    description:
      "ISO/IEC/IEEE 29148 readiness scoring, findings by severity and dimension, requirement register, fixes and assumptions review.",
    features: ["U-09", "U-10", "U-11", "U-12"],
    roles: "all",
    status: "todo",
    stage: 2,
  },
  {
    path: "/tcg/runs/scenario/[docId]",
    title: "Scenario Analyzer",
    description:
      "Review scenarios derived per ISO/IEC/IEEE 29119-4: filter by test type, edit, add, merge, export. Choose test types and additional checks.",
    features: ["U-13", "U-14", "U-15"],
    roles: "all",
    status: "todo",
    stage: 3,
  },
  {
    path: "/tcg/runs/generate/[jobId]",
    title: "Generate Test Cases",
    description:
      "Seven-step live tracker (Parse to Done) and the resulting test case table with row detail, search and type filter. Push to Zephyr Scale.",
    features: ["U-16", "U-17", "U-18"],
    roles: "all",
    status: "todo",
    stage: 4,
  },
  {
    path: "/tcg/runs/scripts/[jobId]",
    title: "Generate Automation Scripts",
    description:
      "Optional. Convert test cases to Playwright code: pick suite, framework and mode; review, regenerate and download ZIP.",
    features: ["U-19"],
    roles: "all",
    status: "todo",
    stage: 5,
  },
  {
    path: "/tcg/runs/execute/[jobId]",
    title: "Execute Scripts",
    description:
      "Optional. Run test cases against a target URL with a live browser view, step log, abort and CSV results.",
    features: ["U-20", "U-21"],
    roles: "all",
    status: "todo",
    stage: 6,
  },
  {
    path: "/tcg/runs/[id]",
    title: "Reports & Exports",
    description:
      "Per-run reporting: Summary, Documents, Conversation, Requirements, Scenarios, Test cases, Coverage tabs; PDF/CSV/Excel/Word exports.",
    features: ["U-22"],
    roles: "all",
    status: "todo",
    stage: 7,
  },

  // ---- Projects, inputs, outputs (section 4.2) ----
  {
    path: "/projects",
    title: "Projects",
    description:
      "Flat list that runs and documents are filed under. Create/edit with department, code and status (Active, On hold, Archived).",
    features: ["U-24", "U-42", "A-26"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "Projects" },
  },
  {
    path: "/projects/[id]",
    title: "Project",
    description: "A project's own workspace: Artefacts and Reviews / Approvals tabs.",
    features: ["U-45"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/inputs",
    title: "Inputs Registry",
    description:
      "Every requirements input in the workspace: add, file under projects, version, preview, delete.",
    features: ["U-25", "U-27"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "Inputs Registry" },
  },
  {
    path: "/outputs",
    title: "Output Artefacts",
    description:
      "Everything runs produced: analysis, scenarios, test cases, script suites, test results.",
    features: ["U-26"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "Output Artefacts" },
  },
  {
    path: "/utilities/compare-docs",
    title: "Compare Docs",
    description: "Diff two versions of one document with an AI report of added, removed and modified passages.",
    features: ["U-28"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "Compare Docs" },
  },

  // ---- Collaboration (section 4.3) ----
  {
    path: "/inbox",
    title: "My Inbox",
    description: "Tasks, Reviews / Approvals and Messages waiting on you. Notifications live in the top-bar bell.",
    features: ["U-29", "U-30", "U-31", "U-32", "U-33", "U-44"],
    roles: "all",
    status: "todo",
    nav: { group: "My Work", label: "My Inbox" },
  },

  // ---- Insights (section 4.4) ----
  {
    path: "/insights/token-usage",
    title: "Token Usage",
    description: "Tokens added, consumed and remaining; breakdown by person, operation and date; top-ups.",
    features: ["U-35", "A-23"],
    roles: "all",
    status: "todo",
    nav: { group: "My Insights", label: "Token Usage" },
  },
  {
    path: "/insights/my-time",
    title: "My TCG Time",
    description: "Minute-by-minute time you spent on the platform over a date range.",
    features: ["U-36"],
    roles: "all",
    status: "todo",
    nav: { group: "My Insights", label: "My TCG Time" },
  },
  {
    path: "/insights/team-activity",
    title: "Team Activity",
    description: "Activity across the team; Admins can open any user's activity.",
    features: ["A-09"],
    roles: "all",
    status: "todo",
    nav: { group: "My Insights", label: "Team Activity" },
  },

  // ---- My Organization (Admin only, section 3) ----
  {
    path: "/administration",
    title: "Administration",
    description:
      "Five tabs: Org Profile, Departments, Users & Hierarchy, Workflow Setup (RACI sign-off policy), Project Config.",
    features: ["A-01", "A-02", "A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-10", "A-11", "A-27", "A-28", "A-29"],
    roles: "admin",
    status: "todo",
    nav: { group: "My Organization", label: "Administration" },
  },
  {
    path: "/integrations",
    title: "Integrations",
    description:
      "Jira Cloud, Confluence Cloud, Zephyr Scale and Microsoft Entra ID connections; summary of what is connected.",
    features: ["A-12", "A-13", "A-14", "A-15", "A-16"],
    roles: "admin",
    status: "todo",
    nav: { group: "My Organization", label: "Integrations" },
  },
  {
    path: "/cicd-automation",
    title: "CI/CD Automation",
    description:
      "Re-run a project's generated Playwright suite on merge: GitHub Actions, Jenkins, API & webhooks; pause, disconnect, fallback.",
    features: ["A-20", "A-21"],
    roles: "admin",
    status: "todo",
    nav: { group: "My Organization", label: "CI/CD Automation" },
  },

  // ---- Help and account (section 4.4) ----
  {
    path: "/get-started",
    title: "Get Started",
    description: "Orientation walkthrough.",
    features: ["U-38"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/guide",
    title: "Guide",
    description: "In-app guide of the pipeline and ISO / ISTQB / IREB standards.",
    features: ["U-38"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/help",
    title: "Help & Feedback",
    description: "Submit a problem, idea or question with an area picker.",
    features: ["U-39"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/profile",
    title: "Profile",
    description: "Edit profile and department, change password, notification preferences.",
    features: ["U-40", "U-44"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/my-plan",
    title: "My Plan",
    description: "Organisation name and token meter (other plan content is placeholder).",
    features: ["U-40"],
    roles: "all",
    status: "todo",
  },

  // ---- Auth (S-01) ----
  { path: "/login", title: "Sign in", description: "Login flow.", features: ["S-01"], roles: "all", status: "todo" },
  { path: "/signup", title: "Sign up", description: "Signup flow.", features: ["S-01"], roles: "all", status: "todo" },
  {
    path: "/forgot-password",
    title: "Forgot password",
    description: "Request a reset link.",
    features: ["S-01"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/reset-password",
    title: "Reset password",
    description: "Set a new password from a reset link.",
    features: ["S-01"],
    roles: "all",
    status: "todo",
  },
  {
    path: "/set-password",
    title: "Set password",
    description: "First-time password after an Admin invite.",
    features: ["S-01"],
    roles: "all",
    status: "todo",
  },
];

export function getRoute(path: string): RouteDef {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`Route not registered in src/config/routes.ts: ${path}`);
  return route;
}

// Auth routes (no app shell)
export const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/set-password"];
