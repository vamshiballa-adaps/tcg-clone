// "Pipeline at a glance" from the BRD. Step 5 and 6 are optional.
export const PIPELINE_STAGES = [
  { step: 1, label: "Requirements Input", optional: false },
  { step: 2, label: "Requirements Analysis", optional: false },
  { step: 3, label: "Scenario Analyzer", optional: false },
  { step: 4, label: "Generate Test Cases", optional: false },
  { step: 5, label: "Generate Automation Scripts", optional: true },
  { step: 6, label: "Execute Scripts", optional: true },
  { step: 7, label: "Reports & Exports", optional: false },
] as const;
