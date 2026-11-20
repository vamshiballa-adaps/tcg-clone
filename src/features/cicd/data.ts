export const TRIGGER_RESULTS = ["Passed", "Failed", "Queued"] as const;
export type TriggerResult = (typeof TRIGGER_RESULTS)[number];

export interface Trigger {
  run: number;
  source: string; // what started it: a merged pull request or an on-demand run
  trigger: "Pull request merged" | "Manual dispatch";
  selected: string; // "<selected> of <total>" test cases
  result: TriggerResult;
  when: string;
}

export const TOTAL_TEST_CASES = 18;

// The settings the trigger runs with. Read only: connecting GitHub Actions or Jenkins and changing these are still to build.
export const TRIGGER_SETTINGS: { term: string; detail: string }[] = [
  { term: "Trigger type", detail: "Pull request merged" },
  { term: "Branch", detail: "main" },
  { term: "Method", detail: "GitHub Actions" },
  { term: "Selection", detail: "Relevant test cases, the full suite when unsure" },
];

// The history every visit starts with, newest first. Fixed text (not dates) so the screen reads the same on any day.
// Nothing is saved: a full reload shows exactly these five.
export const SEED_TRIGGERS: Trigger[] = [
  { run: 5, source: "PR #24 Switch the trigger workflow to run 4", trigger: "Pull request merged", selected: "0 of 0", result: "Queued", when: "2026-11-08" },
  { run: 4, source: "PR #21 Compare Docs", trigger: "Pull request merged", selected: "6 of 18", result: "Passed", when: "2026-11-08" },
  { run: 3, source: "PR #20 Guide", trigger: "Pull request merged", selected: "5 of 18", result: "Passed", when: "2026-11-06" },
  { run: 2, source: "PR #19 My TCG Time", trigger: "Pull request merged", selected: "4 of 18", result: "Failed", when: "2026-11-05" },
  { run: 1, source: "Full suite (on demand)", trigger: "Manual dispatch", selected: "18 of 18", result: "Passed", when: "2026-11-04" },
];

// The entry "Run full suite" adds: the next run number, every test case, queued, just now.
export function fullSuiteTrigger(history: Trigger[]): Trigger {
  const next = Math.max(0, ...history.map((t) => t.run)) + 1;
  return {
    run: next,
    source: "Full suite (on demand)",
    trigger: "Manual dispatch",
    selected: `${TOTAL_TEST_CASES} of ${TOTAL_TEST_CASES}`,
    result: "Queued",
    when: "Just now",
  };
}

export function hasQueuedOnDemand(history: Trigger[]): boolean {
  return history.some((t) => t.trigger === "Manual dispatch" && t.result === "Queued");
}
