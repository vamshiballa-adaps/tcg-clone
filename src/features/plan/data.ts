export const ORG_NAME = "Northwind Quality Labs";
export const PLAN_NAME = "Team";

// The token meter every visit starts with (U-40, A-23). Fixed numbers so the screen reads the same on any day: 62,400 of
// 100,000 tokens used, 37,600 left, 62%. Only the allowance can change in the browser (an admin's top-up); the tokens
// used stay as they are.
export const SEED_ALLOWANCE = 100_000;
export const TOKENS_USED = 62_400;
export const MAX_AMOUNT = 1_000_000;

// Always "en-US" (1,000,000): the server render and the browser must agree, whatever the browser's own locale.
export function formatTokens(count: number): string {
  return count.toLocaleString("en-US");
}

export function usedPercent(allowance: number): number {
  return Math.round((TOKENS_USED / allowance) * 100);
}

export type Verb = "add" | "request";
export type AmountResult = { amount: number } | { error: string };

// Reads the Amount field. Surrounding spaces are ignored, and commas are fine as thousands separators ("5,000"), but
// nothing else is: no decimals, signs or words. Returns the number, or the message to show under the field.
export function parseAmount(text: string, verb: Verb): AmountResult {
  const value = text.trim();
  if (!value) return { error: "Enter a number of tokens." };
  if (!/^(\d{1,3}(,\d{3})+|\d+)$/.test(value)) return { error: "Enter a whole number greater than zero." };
  const amount = Number(value.replace(/,/g, ""));
  if (amount < 1) return { error: "Enter a whole number greater than zero." };
  if (amount > MAX_AMOUNT) return { error: `You can ${verb} at most ${formatTokens(MAX_AMOUNT)} tokens at a time.` };
  return { amount };
}
