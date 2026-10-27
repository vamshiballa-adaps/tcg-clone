// The Home screen's simulated cold start (see components/startup/StartupGate.tsx).
//
// NEXT_PUBLIC_STARTUP_SEQUENCE=off      skip it entirely (a "warm" deployment)
// NEXT_PUBLIC_STARTUP_STEP_MS           gap between log lines, in ms (default 700)
// NEXT_PUBLIC_STARTUP_HOLD_MS           how long the finished log stays up before the real screen, in ms (default 2400)
//
// The defaults finish about 4.5s after load. Cases that look for the log ("culminating in...") want it up longer;
// cases that wait for the real screen want it gone sooner. If a test run shows one side missing its window, nudge these.

// Read each variable by its full name: Next only inlines `process.env.NEXT_PUBLIC_*` written out literally.
function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

export const STARTUP_ENABLED = process.env.NEXT_PUBLIC_STARTUP_SEQUENCE !== "off";
export const STARTUP_STEP_MS = positiveInt(process.env.NEXT_PUBLIC_STARTUP_STEP_MS, 700);
export const STARTUP_HOLD_MS = positiveInt(process.env.NEXT_PUBLIC_STARTUP_HOLD_MS, 2400);

// The last line is the one the log "culminates in"; keep its wording exact.
export const STARTUP_LINES = [
  "Starting the service",
  "Installing dependencies",
  "Running health checks",
  "Your app is almost live",
] as const;

export const RENDER_URL = "https://render.com";
