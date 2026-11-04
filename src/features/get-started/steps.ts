export interface TourStep {
  /** Short name in the step list. */
  label: string;
  /** Heading of the step panel. */
  title: string;
  text: string;
}

// The walkthrough on Get Started (U-38): how a run goes from requirements to test results, in the order the pipeline
// runs (see config/pipeline.ts). The list uses short nouns and the panel uses verb phrases, so no text appears twice.
export const TOUR_STEPS: TourStep[] = [
  {
    label: "Project",
    title: "Create a project",
    text: "Projects hold your runs and documents. Open Projects in the sidebar and choose New project.",
  },
  {
    label: "Requirements",
    title: "Add requirements",
    text: "Start a run, name it, pick its project and add your requirements: a document, a Jira issue or a crawl of your app.",
  },
  {
    label: "Analysis",
    title: "Review the analysis",
    text: "TCG scores the requirements for readiness and lists findings by severity. Fix what matters before you go on.",
  },
  {
    label: "Test cases",
    title: "Generate test cases",
    text: "TCG turns the scenarios into test cases, each written as plain steps such as login, navigate and verify.",
  },
  {
    label: "Scripts",
    title: "Run the scripts",
    text: "Optionally turn the test cases into Playwright scripts and run them against your app, with a live view of the browser.",
  },
];
