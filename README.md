# AI Hub (TCG) – web app

Next.js 16 (App Router, TypeScript) + Mantine 9. This is the base the team builds on, feature by feature, following
[TCG_BRD_Feature_Catalogue.md](./TCG_BRD_Feature_Catalogue.md).

## Getting started

```bash
npm install
cp .env.example .env.local   # set API base URL and dev role
npm run dev                  # http://localhost:3000
```

`npm run lint` · `npm run build` (run both before opening a PR).

> Next.js 16 has breaking changes vs. older versions. Read the guides in `node_modules/next/dist/docs/` before writing
> framework code (see [AGENTS.md](./AGENTS.md)). `cacheComponents` is on: anything reading runtime data
> (`usePathname`, `cookies()`, `params`…) must sit under `<Suspense>`.

## How the base is organised

| Path | Purpose |
| --- | --- |
| `src/config/routes.ts` | **Screen registry.** Every screen from the catalogue: path, title, feature IDs (U-xx / A-xx / S-xx), min role, status, pipeline stage, sidebar entry. |
| `src/config/pipeline.ts` | The 7 pipeline stages. |
| `src/app/(app)/…` | Authenticated screens inside the app shell (sidebar: My Work / My Insights / My Organization). |
| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). Login and forgot password are built (mock). |
| `src/app/api/auth/…`, `src/lib/auth/`, `src/proxy.ts` | Mock sign-in: login/logout/session endpoints, the signed session cookie, route gating. See "Sign in (mock auth)". |
| `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle, who's signed in. |
| `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
| `src/lib/role.ts` | Tenant roles + `canAccess`. Signed in, the account's role wins; `NEXT_PUBLIC_DEV_ROLE=admin\|user` only applies when `AUTH_REQUIRED=false` lets a signed-out visitor in. |
| `src/lib/api/client.ts` | Fetch wrapper for the Go BFF (`NEXT_PUBLIC_API_BASE_URL`). |
| `src/theme.ts` | Mantine theme. Both light and dark must work. |

Every page currently renders `<PagePlaceholder route="…" />`, so the whole route tree, navigation and role gating
already work.

## Picking up a feature

1. Find the screen in `src/config/routes.ts` (feature IDs map to the catalogue sections).
2. Replace the `<PagePlaceholder />` in its `page.tsx` with the real UI; put screen-specific components in
   `src/features/<area>/` (create it as needed).
3. Set `status` to `"in-progress"`, then `"done"` when merged.
4. Need a new screen? Add it to `routes.ts` **and** create its `page.tsx`.

## Sign in (mock auth)

`/login` signs in against three built-in accounts (S-01). There is no backend or user store yet, so this stands in for
the Go BFF's signed session cookie.

| Account | Email | Password | Result |
| --- | --- | --- | --- |
| Admin | `admin@tcg.test` | `Admin#123` | Signs in as admin |
| User | `user@tcg.test` | `User#1234` | Signs in as user (no Administration, Integrations, CI/CD Automation) |
| Locked | `locked@tcg.test` | `Locked#123` | Refused: "This account is locked. Contact your workspace admin." |

**Signing in is mandatory:** a signed-out visitor who opens any page is sent to `/login` first, and only a successful
sign-in gets them into the app. Only the auth screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`,
`/set-password`), `/api/auth/*` and static assets are open signed out.

Other outcomes: "Enter your email address.", "Enter a valid email address.", "Enter your password.", and "Invalid email
or password." for a wrong password or unknown email. A successful sign-in always lands on the Dashboard (A-24). The
header then shows the person's name, role and **Sign out**; the sidebar follows their role.

- **Forgot password** (`/forgot-password`, open signed out): enter an email, press **Send reset link**. Any well-formed
  address gets the same "Reset link sent" confirmation, whether or not an account exists, so the screen never reveals
  which emails are registered. No mail is sent (no mail service yet) and `/reset-password` is still a placeholder.
- **Session:** a signed, httpOnly cookie (`tcg_session`, 8 hours). The UI asks `/api/auth/session`; pages and layouts
  never read the cookie, so they stay prerendered.
- **Gating (`src/proxy.ts`):** a signed-in role too low for a page sees "Access denied" at that URL (status 200); a
  signed-in person opening `/login` goes to the Dashboard.
- **Settings** (`.env.example`): `AUTH_REQUIRED=false` opens the app to signed-out visitors (the role is then
  `NEXT_PUBLIC_DEV_ROLE`); unset, or any other value, keeps sign-in mandatory. It is a runtime setting (no rebuild).
  `AUTH_SECRET` signs the cookie; set a long random value on any deployed copy.
- **Not secure:** the passwords are printed on the sign-in screen. Don't put real data behind it.

## Projects (U-24, first slice)

`/projects` lists five seeded projects with a **Search projects** box (name, code, department or creator) and a **New
project** dialog: name (up to 50 characters, unique ignoring case), department, code, status, description. A created
project goes to the top of the list. **Nothing is saved**: a full reload returns to the seeded list. Edit, changing a
project's status, the project page and tabs, and Admin-maintained departments are still to do. Code lives in
`src/features/projects/`.

## TCG Runs (U-01)

`/tcg/runs` (sidebar: **TCG Runs** under My Work, all roles) lists eight seeded runs in one table with **Mine** and
**Everyone** tabs, a **Search runs** box (run name, project or creator) and a **Filter by status** select (Draft,
Running, Completed, Failed). **Mine** is the runs the signed-in person created, so the admin and the user see different
rows there; **Everyone** shows all eight. Each run name links to its report page (still a placeholder) and **Start a
run** links to the start page (also a placeholder). **Nothing is saved**: every visit starts on Mine with no search and
every status. Drafts that resume at the right stage and the run history are still to do. Code lives in
`src/features/runs/`.

## Compare Docs (U-28)

`/utilities/compare-docs` (sidebar: **Compare Docs** under My Work, all roles) compares two versions of a document: pick
a **Document**, a **From version** and a **To version** (v1 to v3) and **Compare versions** lists the passages that were
added, removed and modified, matched by reference (R1, R2, ...). The documents are seeded and the changes are computed,
so there is no AI report yet. The two versions must differ and the first must be older. Nothing is saved. Code lives in
`src/features/compare-docs/`.

## My Inbox (U-29 to U-33)

`/inbox` (sidebar: **My Inbox** under My Work, all roles) lists the messages waiting on you: four for the user, five
for the admin (the admin gets a token request, a running run and a new project that the user does not). **Show** picks
**All messages** or **Unread only**, each unread message has a **Mark as read** button, and **Mark all as read** clears
the rest. There is no delete. **Nothing is saved**: a full reload makes every message unread again. Tasks, Reviews /
Approvals and the top-bar bell are still to do. Code lives in `src/features/inbox/`.

## Help & Feedback (U-39)

`/help` (sidebar: **Help & Feedback**, all roles) is a form with a **Kind** (Problem, Idea, Question), an **Area** (13
product areas), a **Subject** (up to 80 characters) and **Details** (at least 10). **Send feedback** shows a "Feedback
sent" confirmation. **Nothing is stored or sent anywhere**: there is no inbox behind this test app. Code lives in
`src/features/help/`.

## Team Activity (A-09)

`/insights/team-activity` (sidebar: **Team Activity** under My Insights, all roles) lists the three people on the team
with their role, runs this month and last activity. An **admin** can open any person (each name is a button) to see
their recent activity; a **user** sees the same table with plain names and no way to open one. The activity is seeded
and nothing is saved. Code lives in `src/features/team-activity/`.

## My Plan (U-40, A-23)

`/my-plan` (sidebar: **My Plan** under My Insights, all roles) shows the organisation, the plan and a token meter
(100,000 allowance, 62,400 used, 37,600 left, 62%). An **admin** gets **Add tokens** (the allowance and the meter move);
a **user** gets **Request tokens** (amount and reason; nothing moves). **Nothing is saved**: a full reload returns to the
seeded numbers. Other plan content is still to do. Code lives in `src/features/plan/`.

## Inputs Registry (U-25, U-27)

`/inputs` (sidebar: **Inputs Registry** under My Work, all roles) lists six seeded requirements inputs with a **Search
inputs** box (name, project or source), a **Filter by type** select (Document, Jira, URL, Typed text) and an **Add
input** dialog: input name (up to 60 characters, unique ignoring case), input type, project and a source whose rule
depends on the type (a file name ending .pdf, .docx or .txt; a Jira key like PAY-123; an http(s) address; or up to 200
characters of text). An added input goes to the top. **Nothing is saved**: a full reload returns to the seeded list.
Versioning, preview and delete are still to do. Code lives in `src/features/inputs/`.

## Token Usage (U-35)

`/insights/token-usage` (sidebar: **Token Usage** under My Insights, all roles) shows a summary and a usage log you can
filter by **Period**, **Operation** and, for an admin, **Person**. An **admin** sees all 12 entries (62,400 tokens, the
same as My Plan); a **user** sees only their own 5 (29,100). The rows are fixed, and a top-up on My Plan does not show
up here. Nothing is saved. The top-up history is still to do. Code lives in `src/features/token-usage/`.

## Get Started (U-38)

`/get-started` (sidebar: **Get Started** under My Work, all roles) is a five-step tour of how a run goes from
requirements to test results: Create a project, Add requirements, Review the analysis, Generate test cases, Run the
scripts. **Back**, **Next** and **Finish** move through it, a progress bar and "Step N of 5" show where you are, and
**Finish** shows "Tour complete" with **Start over**. Nothing is saved: every visit starts at step 1. Shortcuts (also
U-38) is still to do; the Guide is its own page, below. Code lives in `src/features/get-started/`.

## Guide (U-38)

`/guide` (sidebar: **Guide** under My Work, all roles) is read-only help with three tabs: **Pipeline** (an accordion of
the seven stages, one open at a time), **Standards** (ISO/IEC/IEEE 29148 and 29119-4, ISTQB, IREB) and **Glossary** (nine
terms with a search box). Nothing is saved: every visit starts on Pipeline with every stage closed. Code lives in
`src/features/guide/`.

## Profile (U-40, U-44)

`/profile` (sidebar: **Profile** under My Work, all roles) shows the account (email and role), an **Edit profile** form
(display name up to 40 characters, department) and a **Password** form (current, new of at least 8 characters, confirm).
The current password is checked against the signed-in built-in account's real password. **Nothing is saved**: a reload
shows the starting values, and sign-in keeps using the built-in passwords. Notification preferences are still to do.
Code lives in `src/features/profile/`.

## My TCG Time (U-36)

`/insights/my-time` (sidebar: **My TCG Time** under My Insights, all roles) lists the sessions you spent on the platform
(date, start, end, area, duration) over a **Start date** and **End date** you type as `YYYY-MM-DD`, with a summary (total
time, days with activity, busiest day). It is always your own time, for both roles. **Apply range** checks the dates (a
range is at most 31 days) and **Reset range** goes back to the seeded range. The sessions are seeded and **nothing is
saved**: every visit starts on the default range. Code lives in `src/features/my-time/`.

## Not included yet (by design)

Real auth/session (a user store, signup and password flows, the BFF's session cookie; sign-in above is a mock), real
RBAC capabilities, API integration, data fetching/state library, tests, build/lint CI, and the platform
`/admin` surface (P-xx). Add these as their features come up.
