import { SEED_PROJECTS } from "@/features/projects/data";

export const INPUT_TYPES = ["Document", "Jira", "URL", "Typed text"] as const;
export type InputType = (typeof INPUT_TYPES)[number];

export const NAME_MAX = 60;
export const TEXT_MAX = 200;

// The projects an input can be filed under: the five seeded ones, by name.
export const PROJECT_NAMES: string[] = SEED_PROJECTS.map((p) => p.name);

export interface RegistryInput {
  id: string;
  name: string;
  type: InputType;
  project: string;
  source: string; // a file name, an issue key, a URL or the typed text itself
  addedBy: string;
  version: string;
  added: string;
}

// What the Add input form collects. `type` and `project` are "" until one is chosen.
export interface InputDraft {
  name: string;
  type: InputType | "";
  project: string;
  source: string;
}

export type InputErrors = Partial<Record<"name" | "type" | "project" | "source", string>>;

// The list every visit starts with, newest first. Fixed text (not dates) so the screen reads the same on any day. Inputs
// added in the browser are not saved: a full reload goes back to exactly this list.
export const SEED_INPUTS: RegistryInput[] = [
  { id: "i-6", name: "Checkout pages crawl", type: "URL", project: "Payments Gateway", source: "https://shop.example.com/checkout", addedBy: "Alex Admin", version: "v1", added: "Today" },
  { id: "i-5", name: "Portal login story", type: "Jira", project: "Customer Portal", source: "CPT-31", addedBy: "Uma User", version: "v2", added: "Yesterday" },
  { id: "i-4", name: "Onboarding screens spec", type: "Document", project: "Mobile Onboarding", source: "onboarding-spec.pdf", addedBy: "Uma User", version: "v3", added: "5 days ago" },
  { id: "i-3", name: "Refund rules", type: "Typed text", project: "Payments Gateway", source: "Refunds are allowed within 14 days.", addedBy: "Alex Admin", version: "v1", added: "2 weeks ago" },
  { id: "i-2", name: "Payments BRD", type: "Document", project: "Payments Gateway", source: "payments-brd-v3.docx", addedBy: "Alex Admin", version: "v3", added: "3 weeks ago" },
  { id: "i-1", name: "Invoice export notes", type: "Document", project: "Legacy Billing", source: "invoice-export.txt", addedBy: "Sam Rivera", version: "v1", added: "2 months ago" },
];

// The hint under the Source box, which depends on the chosen type.
export function sourceHint(type: InputType | ""): string {
  switch (type) {
    case "Document":
      return "A file name ending in .pdf, .docx or .txt.";
    case "Jira":
      return "An issue key, for example PAY-123.";
    case "URL":
      return "An address starting with http:// or https://.";
    case "Typed text":
      return `The requirement text, up to ${TEXT_MAX} characters.`;
    default:
      return "Depends on the input type.";
  }
}

// The message for a wrong source, or undefined when it is fine. It is judged trimmed. Without a chosen type only an empty
// source is wrong, because the rule depends on the type.
export function validateSource(type: InputType | "", rawSource: string): string | undefined {
  const source = rawSource.trim();
  if (!source) return "Enter a source.";
  switch (type) {
    case "Document":
      return /^\S+\.(pdf|docx|txt)$/i.test(source) ? undefined : "Enter a file name ending in .pdf, .docx or .txt.";
    case "Jira":
      return /^[A-Z][A-Z0-9]+-\d+$/.test(source) ? undefined : "Enter a Jira issue key such as PAY-123.";
    case "URL":
      return /^https?:\/\/[^\s/]+\.[^\s/]+(\/\S*)?$/i.test(source)
        ? undefined
        : "Enter a URL starting with http:// or https://.";
    case "Typed text":
      return source.length > TEXT_MAX ? `Typed text must be ${TEXT_MAX} characters or fewer.` : undefined;
    default:
      return undefined;
  }
}

// Checks the Add input form. Names are compared trimmed and case-insensitively, so "payments brd" clashes with
// "Payments BRD". Returns one message per field that is wrong, or {} when the draft can be saved.
export function validateInput(draft: InputDraft, existing: RegistryInput[]): InputErrors {
  const errors: InputErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter an input name.";
  else if (name.length > NAME_MAX) errors.name = `Input name must be ${NAME_MAX} characters or fewer.`;
  else if (existing.some((i) => i.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = "An input with this name already exists.";
  }
  if (!draft.type) errors.type = "Choose an input type.";
  if (!draft.project) errors.project = "Choose a project.";
  const source = validateSource(draft.type, draft.source);
  if (source) errors.source = source;
  return errors;
}

// Search matches the name, the project or the source, ignoring case and surrounding spaces. An empty query matches
// everything.
export function matchesInput(input: RegistryInput, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [input.name, input.project, input.source].some((field) => field.toLowerCase().includes(q));
}

// What shows instead of the table when nothing is left. A search wins over the type filter in the message.
export function emptyMessage(query: string, type: InputType | ""): string {
  const q = query.trim();
  if (q) return `No inputs match "${q}".`;
  if (type) return `No inputs of type "${type}".`;
  return "No inputs to show.";
}
