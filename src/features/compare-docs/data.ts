export const VERSIONS = ["v1", "v2", "v3"] as const;
export type Version = (typeof VERSIONS)[number];

// A passage is one referenced statement of a document ("R2"). Passages are matched across versions by that reference.
export interface Passage {
  ref: string;
  text: string;
}

export interface SeedDocument {
  name: string;
  versions: Record<Version, Passage[]>;
}

const p = (ref: string, text: string): Passage => ({ ref, text });

// Three documents, three versions each. They are chosen so every kind of result can be reached:
//  - Payments Gateway: v1 to v3 has added, removed and modified passages; v1 to v2 only added and modified; v2 to v3
//    all three kinds again.
//  - Customer Portal: v2 and v3 are identical, so that pair has no differences.
//  - Mobile Onboarding: a passage is reworded, one removed and a new one added in the same step.
export const DOCUMENTS: SeedDocument[] = [
  {
    name: "Payments Gateway Requirements",
    versions: {
      v1: [
        p("R1", "A customer can pay by card."),
        p("R2", "A payment over 500 needs a second confirmation."),
        p("R3", "A failed payment is retried once."),
        p("R4", "Receipts are emailed within 5 minutes."),
      ],
      v2: [
        p("R1", "A customer can pay by card."),
        p("R2", "A payment over 1,000 needs a second confirmation."),
        p("R3", "A failed payment is retried once."),
        p("R4", "Receipts are emailed within 5 minutes."),
        p("R5", "A customer can pay by bank transfer."),
      ],
      v3: [
        p("R1", "A customer can pay by card."),
        p("R2", "A payment over 1,000 needs a second confirmation."),
        p("R4", "Receipts are emailed within 1 minute."),
        p("R5", "A customer can pay by bank transfer."),
        p("R6", "Refunds are issued to the original payment method."),
      ],
    },
  },
  {
    name: "Customer Portal Requirements",
    versions: {
      v1: [
        p("R1", "A user can sign in with email and password."),
        p("R2", "A session ends after 30 minutes of inactivity."),
        p("R3", "A user can update their display name."),
      ],
      v2: [
        p("R1", "A user can sign in with email and password."),
        p("R2", "A session ends after 15 minutes of inactivity."),
        p("R3", "A user can update their display name."),
      ],
      v3: [
        p("R1", "A user can sign in with email and password."),
        p("R2", "A session ends after 15 minutes of inactivity."),
        p("R3", "A user can update their display name."),
      ],
    },
  },
  {
    name: "Mobile Onboarding Requirements",
    versions: {
      v1: [p("R1", "A new user sees a welcome screen."), p("R2", "A new user can skip the tutorial.")],
      v2: [
        p("R1", "A new user sees a welcome screen."),
        p("R2", "A new user can skip the tutorial."),
        p("R3", "A new user chooses a language on first launch."),
      ],
      v3: [
        p("R1", "A new user sees a welcome screen with the product name."),
        p("R3", "A new user chooses a language on first launch."),
        p("R4", "A new user can turn on notifications."),
      ],
    },
  },
];

export interface Modified {
  ref: string;
  before: string;
  after: string;
}

export interface Diff {
  added: Passage[];
  removed: Passage[];
  modified: Modified[];
}

// Compares two versions of a document by passage reference: in "to" only is added, in "from" only is removed, in both
// with different text is modified. Each list is in reference order.
export function diffVersions(from: Passage[], to: Passage[]): Diff {
  const before = new Map(from.map((x) => [x.ref, x.text]));
  const after = new Map(to.map((x) => [x.ref, x.text]));
  const byRef = (a: { ref: string }, b: { ref: string }) => a.ref.localeCompare(b.ref, "en", { numeric: true });
  return {
    added: to.filter((x) => !before.has(x.ref)).sort(byRef),
    removed: from.filter((x) => !after.has(x.ref)).sort(byRef),
    modified: to
      .filter((x) => before.has(x.ref) && before.get(x.ref) !== x.text)
      .map((x) => ({ ref: x.ref, before: before.get(x.ref) as string, after: x.text }))
      .sort(byRef),
  };
}

export function isEmptyDiff(d: Diff): boolean {
  return d.added.length === 0 && d.removed.length === 0 && d.modified.length === 0;
}

// What the compare form collects. Every field is "" until chosen.
export interface CompareDraft {
  document: string;
  from: Version | "";
  to: Version | "";
}

export type CompareErrors = Partial<Record<keyof CompareDraft, string>>;

export const BLANK_DRAFT: CompareDraft = { document: "", from: "", to: "" };

// One message per field that is wrong, or {} when the comparison can run. Two different versions are needed, and the
// starting one must be the older (v1 is older than v2, and so on); both of those are reported on the ending version.
export function validateCompare(draft: CompareDraft): CompareErrors {
  const errors: CompareErrors = {};
  if (!draft.document) errors.document = "Choose a document.";
  if (!draft.from) errors.from = "Choose a starting version.";
  if (!draft.to) errors.to = "Choose an ending version.";
  if (draft.from && draft.to) {
    if (draft.from === draft.to) errors.to = "Choose two different versions.";
    else if (VERSIONS.indexOf(draft.from) > VERSIONS.indexOf(draft.to)) {
      errors.to = "The starting version must be older than the ending version.";
    }
  }
  return errors;
}
