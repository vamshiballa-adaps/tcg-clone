# tcg-clone: what this repo is for

**This repo is the "application under test" for TCG.** TCG (Test Case Generation, part of AI Hub) turns requirements
into test cases, then Playwright automation scripts, then runs them against a live web app. `tcg-clone` is that live web
app. Treat it as a realistic app an automation tester has been handed, not a product with its own business goals. The
point of the repo is to exercise and improve TCG's crawl, script-generation, script-execution and CI/CD features.

The TCG backend (Go orchestration, Python core, the real AI Hub frontend) lives in a separate repo, `aihub`
(`c:\Users\ChinthalapudiBhargav\aihub`). Work in this repo is front-end only; do not edit `aihub` from here.

Today most pages are still `PagePlaceholder`s built from `TCG_BRD_Feature_Catalogue.md` (see `README.md` for layout).
Sign-in is a mock with built-in accounts and is mandatory: the first screen a visitor sees is `/login` (see "Sign in"
below).

## How each TCG feature touches this app

1. **Crawl the application (U-05).** TCG is given a URL (plus optional login). Headless Chromium crawls it
   breadth-first and reads each page's accessibility tree (ARIA roles and accessible names, not pixels). It follows only
   links, tabs, menus and "tap to open" style controls, stays on the same origin, and never activates a control whose
   accessible name looks destructive (delete, remove, ...). An LLM turns the crawl into an "Application Behaviour
   Specification" that becomes a requirements document for a run.
2. **Test case generation.** Requirements (uploaded documents, Jira, Confluence, typed text, or the crawl) go through
   requirements analysis, then scenarios, then test cases written as plain steps such as
   `Login ... | navigate to ... | verify ...`.
3. **Generate Automation Scripts.** TCG writes Playwright scripts and checks them live against this app. Elements are
   found via the accessibility tree: role plus accessible name, then label, text, placeholder and a few attribute
   fallbacks. The last resort is a vision-model click.
4. **Execute Scripts.** TCG re-runs each test case's steps live against the target URL, resolving each step the same
   way, and streams a video of the browser. Credentials are asked per run and never stored.
5. **CI/CD automation (A-20).** A client wires their pipeline (GitHub Actions, Jenkins, or a plain API call) to a
   token-protected TCG trigger endpoint. When a PR merges, TCG selects the relevant subset of the project's existing
   test cases for that change and runs them through the same Execute engine. For this repo the goal is to rehearse the
   whole loop: PR merged, relevant tests selected, tests run, results reported.

## Build rules (derived from the above)

- **Semantic, accessible markup comes first.** Real labels on inputs, buttons and links with meaningful accessible
  names, proper headings, correct roles for tabs and menus. TCG cannot see or click what the accessibility tree does
  not expose.
- **Deterministic, visibly different behaviour per page**, so a generated test can genuinely pass or fail. Build a real
  login flow with a role-gated UI, since TCG's steps usually start with "Login ...".
- **Never give two different destructive actions the same label**, and expect TCG never to click destructive-named
  controls during a crawl.
- **Reachability.** TCG's crawler and Execute Scripts block private, loopback and link-local addresses (an SSRF guard,
  with a `CRAWL_ALLOWED_HOSTS` allowlist). Do not assume `localhost` or LAN URLs work; plan on a publicly reachable
  deployment, and ask the user if that is not possible.
- Signing in is mandatory, and the role comes from the account (`admin@tcg.test` or `user@tcg.test`), so one deployment
  shows both roles. Every test must start with a login. Only with `AUTH_REQUIRED=false` can a signed-out visitor in, with
  the build-time `NEXT_PUBLIC_DEV_ROLE`.

## Home screen startup sequence (deliberate)

Loading `/` from scratch shows an "Application loading" alert with a startup log ending in "Your app is almost live",
plus a "Start building on Render today" link and a "Render Logo" image link, for about 4.5s before the real Dashboard.
It exists because TCG test cases (written from Render's cold-start page) expected it; see
`docs/failed-cases/home-screen-startup.md` for the cases, what each should do now, and the known conflicts (TC-004,
TC-006). Don't remove or retime it without reading that file.

- Code: `src/components/startup/`, the `@startup` parallel-route slot in `src/app/(app)/`, `src/config/startup.ts`.
- The screen is a sibling of the app shell, not inside `<main>`. While it is up, CSS hides the shell from the
  accessibility tree (a hidden ancestor would hide the screen from TCG's snapshots too) and hides Next's route announcer
  host so the loading alert is the only `role=alert`.
- Only Home, only a full load. Other routes and client-side navigation are unaffected. Sign-in is mandatory, so a
  signed-out visit to `/` goes to `/login` first; the sequence plays on the full load of `/` that follows a sign-in (or on
  a plain load of `/` when signed in already, or when the deployment has `AUTH_REQUIRED=false`).
- `NEXT_PUBLIC_STARTUP_SEQUENCE=off` skips it (a warm deployment); `NEXT_PUBLIC_STARTUP_STEP_MS` and
  `NEXT_PUBLIC_STARTUP_HOLD_MS` retime it. These are build-time, so redeploy after changing them.
- The Render logo is a placeholder (`public/render-logo.svg`), not Render's official asset.

## Sign in (mock auth)

`/login` is a real flow against three built-in accounts. There is no backend or user store, so this stands in for the Go
BFF's signed session cookie (S-01). The accounts are printed on the sign-in screen and live in `src/config/demo-users.ts`.

| Account | Email | Password | What happens |
| --- | --- | --- | --- |
| Admin | `admin@tcg.test` | `Admin#123` | Signs in as admin: full sidebar |
| User | `user@tcg.test` | `User#1234` | Signs in as user: no Administration, Integrations or CI/CD Automation |
| Locked | `locked@tcg.test` | `Locked#123` | Refused, even with the right password |

Fields are labelled "Email" and "Password"; the button is "Sign in". Exact messages (an alert titled "Can't sign in" for
the last three, field errors under the inputs for the first three):

- empty email: "Enter your email address."; malformed: "Enter a valid email address."; empty password: "Enter your password."
- wrong password or unknown email: "Invalid email or password." (the same text for both)
- locked account with the right password: "This account is locked. Contact your workspace admin." (a wrong password on it
  gives the generic message above)

Behaviour a test can rely on:

- A successful sign-in always lands on the Dashboard (A-24), by a full page load, so the Home startup screen plays first.
- The header then shows the person's name, a role badge and a "Sign out" button. "Sign out" goes to `/login`. Email
  matching ignores case and surrounding spaces. (The header's "Sign in" link only shows when `AUTH_REQUIRED=false` lets a
  signed-out visitor see the shell.)
- A signed-in person opening `/login` is sent to the Dashboard.
- A role too low for a page gets an "Access denied" page at that same URL (status 200, because a proxy rewrite cannot
  set one). Admin-only: `/administration`, `/integrations`, `/cicd-automation`.
- **Signing in is mandatory.** A signed-out visitor who opens any page (including `/`) is redirected to `/login`; the
  auth screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/set-password`), `/api/auth/*` and static
  assets stay open. So a crawl or test that reaches a page without signing in first lands on `/login`: run Execute
  Scripts, and the crawl's optional login, with credentials. The Home startup cases in
  `docs/failed-cases/home-screen-startup.md` now begin after a sign-in (the sign-in is a full load of `/`, so the
  startup screen still plays).
- `AUTH_REQUIRED=false` (a runtime setting on the host, no rebuild) reverts to an open app for signed-out visitors, who
  get the build-time `NEXT_PUBLIC_DEV_ROLE`. Only the exact value `false` does that; unset or anything else keeps
  sign-in mandatory.

Code: `src/app/(auth)/login/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
`src/lib/auth/`, and `src/proxy.ts` (route gating). Pages and layouts never read the cookie: that would make them
dynamic and the Home startup screen would stop being prerendered, so the UI asks `/api/auth/session` after load.

Not secure by design: the passwords are public, and the session cookie is signed with `AUTH_SECRET` (a public default
if unset). Never put real data behind it.

## PR diff to requirement input (workflow)

`.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
(description, file table and diff; lockfile diffs omitted, capped at 400k chars) as `requirement-input.md` and `.json`.
They run when:

- **anything lands on `main`** (a merged PR by any method, or a direct push): the push's diff, commit list and, when
  GitHub can name it, the PR behind it, in `merged/<sha12>/`. This is the record that matters; the requirement is the
  change that actually landed. `source.merged` is `true` in its JSON.
- a **PR is opened or updated** (opened, reopened, synchronize, ready_for_review): the PR's own diff in `pr-<n>/`, a
  draft that may never land (`source.merged` is `false`). Delete the `pull_request:` trigger to record merges only.

Each record is delivered to:

- a workflow artifact (always),
- the `requirements-inbox` branch (pushes, and same-repo PRs; fork PRs get a read-only token),
- a POST to the `REQUIREMENTS_WEBHOOK_URL` secret, if set (optional `REQUIREMENTS_WEBHOOK_TOKEN` as a bearer token).

**Status (2026-10-27):** written and tested locally only (script for both event kinds including the PR lookup against
a mock API, and the branch-publish logic against a local bare repo). It has not yet run on GitHub. The artifact and the
`requirements-inbox` branch are the safe delivery paths; do not rely on the webhook landing anywhere yet. Details are
in `README.md`.

## Open questions (close these when answered, then delete them here)

1. **Webhook landing place.** No TCG endpoint is known that accepts an external push as a requirement input. The
   `aihub` routes seen were document upload, Jira, Confluence, typed text and crawl.
2. **Private-IP allowlist.** Not verified whether `CRAWL_ALLOWED_HOSTS` lets private addresses through, which decides
   whether a localhost or LAN deployment of this app can be crawled and executed against.

## Keeping this file current

Update this file in the same change whenever the repo's purpose or the TCG integration changes: a new delivery path
for the PR workflow, an answered open question, a new TCG feature that touches the app, or a change to the build rules.
The TCG facts above come from `aihub`'s own docs as read on 2026-10-27; if they disagree with `aihub`, `aihub` wins.
