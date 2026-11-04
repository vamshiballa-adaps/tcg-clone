// What My TCG Time (U-36) shows: sessions on the platform, each with a start and an end time, filed under the part of
// the product it was spent in. The rows are seeded, one set per built-in account (matched by email, like Token Usage).
export interface TimeEntry {
  id: string;
  email: string; // lower case, as in demo-users.ts
  date: string; // YYYY-MM-DD, shown as is so the screen reads the same on any day and in any locale
  start: string; // HH:MM, 24-hour
  end: string; // HH:MM, 24-hour, later than start on the same date
  area: string; // same names as the Help & Feedback areas
}

// Newest first, as the table shows them. Uma (user@tcg.test): 8 sessions, 390 minutes over 6 days. Alex
// (admin@tcg.test): 5 sessions, 265 minutes over 5 days. Everyone sees only their own.
export const SEED_TIME: TimeEntry[] = [
  { id: "t-01", email: "user@tcg.test", date: "2026-11-03", start: "14:00", end: "14:30", area: "Test cases" },
  { id: "t-02", email: "admin@tcg.test", date: "2026-11-03", start: "08:45", end: "09:30", area: "Reports & exports" },
  { id: "t-03", email: "user@tcg.test", date: "2026-11-03", start: "09:05", end: "10:20", area: "Requirements analysis" },
  { id: "t-04", email: "admin@tcg.test", date: "2026-11-02", start: "16:00", end: "17:15", area: "Requirements analysis" },
  { id: "t-05", email: "user@tcg.test", date: "2026-11-02", start: "10:10", end: "11:00", area: "Scenarios" },
  { id: "t-06", email: "user@tcg.test", date: "2026-10-30", start: "15:15", end: "16:45", area: "Automation scripts" },
  { id: "t-07", email: "user@tcg.test", date: "2026-10-30", start: "09:30", end: "10:00", area: "Test cases" },
  { id: "t-08", email: "admin@tcg.test", date: "2026-10-30", start: "10:00", end: "10:20", area: "Test cases" },
  { id: "t-09", email: "user@tcg.test", date: "2026-10-29", start: "11:00", end: "11:40", area: "Requirements input" },
  { id: "t-10", email: "admin@tcg.test", date: "2026-10-28", start: "09:10", end: "10:40", area: "Scenarios" },
  { id: "t-11", email: "user@tcg.test", date: "2026-10-28", start: "13:20", end: "14:10", area: "Script execution" },
  { id: "t-12", email: "admin@tcg.test", date: "2026-10-27", start: "14:00", end: "14:35", area: "Requirements input" },
  { id: "t-13", email: "user@tcg.test", date: "2026-10-27", start: "09:00", end: "09:25", area: "Reports & exports" },
];

// The range every visit starts with: the days the seeded rows cover, so nothing is hidden at first.
export interface DateRange {
  from: string;
  to: string;
}

export const DEFAULT_RANGE: DateRange = { from: "2026-10-27", to: "2026-11-03" };

// A range may cover at most this many days, both ends counted: 31 passes, 32 fails.
export const MAX_RANGE_DAYS = 31;

export type RangeErrors = Partial<Record<keyof DateRange, string>>;

const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-27" as a day number, or null when it is not a real calendar date written exactly YYYY-MM-DD ("2026-02-30",
// "2026-1-5" and "27/10/2026" are all null).
function dayNumber(text: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const ms = Date.parse(`${text}T00:00:00Z`);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== text) return null;
  return ms / DAY_MS;
}

// Checks the two dates, trimmed. Each field gets its own message first (empty, then not a real YYYY-MM-DD date); only
// when both are real dates are they compared with each other, and a problem there is reported on the end date.
export function validateRange(draft: DateRange): RangeErrors {
  const errors: RangeErrors = {};
  const from = draft.from.trim();
  const to = draft.to.trim();
  if (!from) errors.from = "Enter a start date.";
  else if (dayNumber(from) === null) errors.from = "Enter the start date as YYYY-MM-DD.";
  if (!to) errors.to = "Enter an end date.";
  else if (dayNumber(to) === null) errors.to = "Enter the end date as YYYY-MM-DD.";
  const first = dayNumber(from);
  const last = dayNumber(to);
  if (first !== null && last !== null) {
    if (last < first) errors.to = "The end date must be on or after the start date.";
    else if (last - first + 1 > MAX_RANGE_DAYS) errors.to = `Choose a range of ${MAX_RANGE_DAYS} days or fewer.`;
  }
  return errors;
}

export function sameRange(a: DateRange, b: DateRange): boolean {
  return a.from === b.from && a.to === b.to;
}

// Both ends count. YYYY-MM-DD strings sort the same as the dates they name.
export function entriesInRange(entries: TimeEntry[], range: DateRange): TimeEntry[] {
  return entries.filter((e) => e.date >= range.from && e.date <= range.to);
}

function minutesOfDay(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function entryMinutes(entry: TimeEntry): number {
  return minutesOfDay(entry.end) - minutesOfDay(entry.start);
}

export function totalMinutes(entries: TimeEntry[]): number {
  return entries.reduce((sum, e) => sum + entryMinutes(e), 0);
}

// "45 min", "1 h 0 min", "6 h 30 min": always spelled the same way, so a test can compare the text.
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export interface BusiestDay {
  date: string;
  minutes: number;
}

// The date with the most minutes (the later date wins a tie), or null when there are no rows.
export function busiestDay(entries: TimeEntry[]): BusiestDay | null {
  const perDay = new Map<string, number>();
  for (const e of entries) perDay.set(e.date, (perDay.get(e.date) ?? 0) + entryMinutes(e));
  let best: BusiestDay | null = null;
  for (const [date, minutes] of perDay) {
    if (!best || minutes > best.minutes || (minutes === best.minutes && date > best.date)) best = { date, minutes };
  }
  return best;
}

export function activeDays(entries: TimeEntry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}
