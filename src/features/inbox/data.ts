import type { Role } from "@/lib/role";

export type MessageFilter = "all" | "unread";

export interface Message {
  id: string;
  title: string;
  body: string;
  received: string; // YYYY-MM-DD HH:MM
  unread: boolean;
  audience?: Role; // only that role gets it; absent means both
}

// The messages every visit starts with, newest first. Fixed text (not dates) so the screen reads the same on any day.
// Reading a message is not saved: a full reload makes them unread again. The admin gets three messages the user does
// not (a token request, a running run and a new project), the user gets two the admin does not.
export const SEED_MESSAGES: Message[] = [
  { id: "m-a1", title: "Token request from Uma User", body: "Uma User asked for 2,500 tokens: more runs this week.", received: "2026-11-08 09:12", unread: true, audience: "admin" },
  { id: "m-a2", title: "Run 48 is executing", body: "Checkout flow, cycle 4 is on Execute Scripts.", received: "2026-11-08 08:40", unread: true, audience: "admin" },
  { id: "m-1", title: "Run 47 reached Generate Test Cases", body: "Portal login hardening is generating test cases.", received: "2026-11-07 16:20", unread: true, audience: "user" },
  { id: "m-2", title: "Report ready: Onboarding happy path", body: "The report for run 46 is ready to open.", received: "2026-11-05 11:02", unread: true, audience: "user" },
  { id: "m-3", title: "Token usage at 62%", body: "Your workspace has used 62,400 of 100,000 tokens.", received: "2026-11-03 09:00", unread: false },
  { id: "m-a3", title: "Project created: Customer Portal", body: "Uma User created Customer Portal (CPT).", received: "2026-10-30 14:05", unread: false, audience: "admin" },
  { id: "m-4", title: "Welcome to TCG", body: "Start with Get Started to see the five steps.", received: "2026-10-27 08:30", unread: false },
];

// The messages a role is sent, in the order above, each as a fresh copy so marking one read never touches the seed.
export function messagesFor(role: Role): Message[] {
  return SEED_MESSAGES.filter((m) => !m.audience || m.audience === role).map((m) => ({ ...m }));
}

export function countUnread(messages: Message[]): number {
  return messages.filter((m) => m.unread).length;
}

export function applyFilter(messages: Message[], filter: MessageFilter): Message[] {
  return filter === "unread" ? messages.filter((m) => m.unread) : messages;
}
