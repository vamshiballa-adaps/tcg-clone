import { PIPELINE_STAGES } from "@/config/pipeline";

// What the Guide (U-38) says about each stage. Keyed by the step number in config/pipeline.ts, so the accordion always
// lists exactly the stages the pipeline rail does, under the same names.
const STAGE_SUMMARY: Record<number, string> = {
  1: "Supply the requirements: typed or dictated text, documents, Jira, Confluence, a crawl of a live application or a questionnaire. Any one source is enough to continue.",
  2: "Scores the requirements for readiness against ISO/IEC/IEEE 29148 and lists findings by severity and dimension. The verdict is Ready (75 or more), Proceed with caution (50 to 74) or Not ready (below 50).",
  3: "Turns the requirements into scenarios derived per ISO/IEC/IEEE 29119-4. Review them, filter by test type, edit, add or merge, and choose which test types to generate.",
  4: "Expands each scenario into executable test cases, tracked live through seven steps from Parse to Done. The result is a table you can search and open row by row.",
  5: "Optional. Converts the test cases into Playwright code: pick the suite, framework and mode, review each script, regenerate one and download a ZIP.",
  6: "Optional. Runs the test cases against a target URL in a real browser, with a live video view, a step log and a CSV of results.",
  7: "Per-run reporting across Summary, Documents, Conversation, Requirements, Scenarios, Test cases and Coverage, with PDF, CSV, Excel and Word exports.",
};

export interface GuideStage {
  value: string; // accordion item value
  label: string; // the stage's name, as on the pipeline rail
  summary: string;
}

export const GUIDE_STAGES: GuideStage[] = PIPELINE_STAGES.map((s) => ({
  value: `stage-${s.step}`,
  label: s.label,
  summary: STAGE_SUMMARY[s.step],
}));

export interface Standard {
  name: string;
  text: string;
}

export const STANDARDS: Standard[] = [
  {
    name: "ISO/IEC/IEEE 29148",
    text: "Requirements engineering. Requirements Analysis scores each requirement for readiness against it and groups findings by dimension: Testability, Clarity, Consistency, Completeness, Atomicity and Identifiability.",
  },
  {
    name: "ISO/IEC/IEEE 29119-4",
    text: "Test techniques. The Scenario Analyzer derives scenarios with techniques such as equivalence partitioning, boundary value analysis and decision tables.",
  },
  {
    name: "ISTQB",
    text: "The testing glossary behind the terms used across the platform, such as test case, test condition and coverage.",
  },
  {
    name: "IREB",
    text: "The requirements engineering body of knowledge behind how requirements are elicited, written and checked.",
  },
];

export interface GlossaryTerm {
  term: string;
  meaning: string;
}

// Alphabetical, as shown.
export const GLOSSARY: GlossaryTerm[] = [
  { term: "Assumption", meaning: "Something the analysis guessed about a requirement. You mark it True or Not true before scenarios are built." },
  { term: "Coverage", meaning: "How many requirements have at least one scenario and one test case." },
  { term: "Incremental run", meaning: "A run built on an earlier one, where only the changed requirements go through the pipeline again." },
  { term: "Readiness score", meaning: "The score from Requirements Analysis. 75 or more means Ready." },
  { term: "Requirement", meaning: "A statement of something the application must do or be, written so that it can be checked." },
  { term: "Scenario", meaning: "A situation, derived from one or more requirements, that a test should cover." },
  { term: "Test case", meaning: "Steps, test data and an expected result that verify one scenario." },
  { term: "Test type", meaning: "A category such as functional, boundary or negative that tags a scenario." },
  { term: "Traceability", meaning: "The link from each test case back to the requirement it checks." },
];

// Matches the term or its meaning, ignoring case and surrounding spaces.
export function filterGlossary(terms: GlossaryTerm[], query: string): GlossaryTerm[] {
  const q = query.trim().toLowerCase();
  if (!q) return terms;
  return terms.filter((t) => t.term.toLowerCase().includes(q) || t.meaning.toLowerCase().includes(q));
}
