export const OPERATIONS = [
  "Requirements analysis",
  "Scenario generation",
  "Test case generation",
  "Script generation",
  "Script execution",
] as const;
export type Operation = (typeof OPERATIONS)[number];

export interface UsageEntry {
  id: string;
  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
  person: string;
  email: string; // who the entry belongs to; a User only sees their own
  operation: Operation;
  tokens: number;
}

const ALEX = { person: "Alex Admin", email: "admin@tcg.test" };
const UMA = { person: "Uma User", email: "user@tcg.test" };
const SAM = { person: "Sam Rivera", email: "sam@tcg.test" }; // no built-in account: only an admin sees these rows

// The usage log every visit starts with (U-35). Fixed rows, newest first. They add up to the 62,400 tokens used that
// My Plan shows: Uma 29,100, Alex 18,300, Sam 15,000.
export const SEED_USAGE: UsageEntry[] = [
  { id: "u12", date: "2026-11-03", ...UMA, operation: "Script generation", tokens: 8_400 },
  { id: "u11", date: "2026-11-03", ...ALEX, operation: "Test case generation", tokens: 6_900 },
  { id: "u10", date: "2026-11-02", ...SAM, operation: "Requirements analysis", tokens: 4_200 },
  { id: "u09", date: "2026-11-02", ...UMA, operation: "Scenario generation", tokens: 5_300 },
  { id: "u08", date: "2026-10-30", ...ALEX, operation: "Script execution", tokens: 3_100 },
  { id: "u07", date: "2026-10-30", ...UMA, operation: "Test case generation", tokens: 7_800 },
  { id: "u06", date: "2026-10-29", ...SAM, operation: "Scenario generation", tokens: 4_600 },
  { id: "u05", date: "2026-10-28", ...ALEX, operation: "Requirements analysis", tokens: 5_500 },
  { id: "u04", date: "2026-10-27", ...UMA, operation: "Requirements analysis", tokens: 3_900 },
  { id: "u03", date: "2026-10-26", ...SAM, operation: "Script generation", tokens: 6_200 },
  { id: "u02", date: "2026-10-24", ...ALEX, operation: "Scenario generation", tokens: 2_800 },
  { id: "u01", date: "2026-10-23", ...UMA, operation: "Script execution", tokens: 3_700 },
];

export const PEOPLE = [...new Set(SEED_USAGE.map((e) => e.person))].sort();

// "" means no filter on that field.
export const PERIODS = [
  { value: "2026-11", label: "November 2026" },
  { value: "2026-10", label: "October 2026" },
];

export interface Filters {
  period: string;
  operation: string;
  person: string;
}

export const NO_FILTERS: Filters = { period: "", operation: "", person: "" };

export function hasFilters(filters: Filters): boolean {
  return Boolean(filters.period || filters.operation || filters.person);
}

// An entry stays when it matches every filter that is set.
export function filterUsage(entries: UsageEntry[], filters: Filters): UsageEntry[] {
  return entries.filter(
    (e) =>
      (!filters.period || e.date.startsWith(filters.period)) &&
      (!filters.operation || e.operation === filters.operation) &&
      (!filters.person || e.person === filters.person),
  );
}

export function sumTokens(entries: UsageEntry[]): number {
  return entries.reduce((total, e) => total + e.tokens, 0);
}
