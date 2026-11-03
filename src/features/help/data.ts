export const FEEDBACK_KINDS = ["Problem", "Idea", "Question"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

// Where in the product the feedback is about (U-39). Mirrors the pipeline stages and the sidebar entries.
export const FEEDBACK_AREAS = [
  "Requirements input",
  "Requirements analysis",
  "Scenarios",
  "Test cases",
  "Automation scripts",
  "Script execution",
  "Reports & exports",
  "Projects",
  "Inbox",
  "Administration",
  "Integrations",
  "CI/CD automation",
  "Other",
] as const;
export type FeedbackArea = (typeof FEEDBACK_AREAS)[number];

export const SUBJECT_MAX = 80;
export const DETAILS_MIN = 10;

// What the Help & Feedback form collects. `kind` and `area` are "" until one is chosen.
export interface FeedbackDraft {
  kind: FeedbackKind | "";
  area: FeedbackArea | "";
  subject: string;
  details: string;
}

export type FeedbackErrors = Partial<Record<keyof FeedbackDraft, string>>;

export const BLANK_DRAFT: FeedbackDraft = { kind: "", area: "", subject: "", details: "" };

// Checks the form. Subject and details are compared trimmed, so spaces alone count as empty. Returns one message per
// field that is wrong, or {} when the feedback can be sent.
export function validateFeedback(draft: FeedbackDraft): FeedbackErrors {
  const errors: FeedbackErrors = {};
  if (!draft.kind) errors.kind = "Choose a kind.";
  if (!draft.area) errors.area = "Choose an area.";
  const subject = draft.subject.trim();
  if (!subject) errors.subject = "Enter a subject.";
  else if (subject.length > SUBJECT_MAX) errors.subject = `Subject must be ${SUBJECT_MAX} characters or fewer.`;
  const details = draft.details.trim();
  if (!details) errors.details = "Enter some details.";
  else if (details.length < DETAILS_MIN) errors.details = `Details must be at least ${DETAILS_MIN} characters.`;
  return errors;
}
