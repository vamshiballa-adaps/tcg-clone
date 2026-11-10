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
- **Check the accessibility tree, not only the markup.** A bare `<th>` in the Projects table showed up as an ordinary
  `cell` until it got `scope="col"`, and Mantine's `Badge` capitalises with CSS, so the screen said "ACTIVE" while the DOM
  said "Active" (set `tt="none"`). Probe with `locator.ariaSnapshot()` after building a table or a badge.
- **Keep names from colliding with a field's label.** Playwright's `getByLabel("Email")` is a case-insensitive substring
  match, so an alert titled "Check your email" also matched it. Also, after a client-side navigation Next keeps the
  previous page in the DOM, hidden: role locators skip it, but `getByLabel` still counts it, and its state comes back
  when you return (a form can reappear half-filled or showing last visit's result). Reset such state when the
  page is hidden (see `ForgotPasswordForm`).
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
- **Forgot password** (`/forgot-password`, open signed out, linked from sign-in as "Forgot password?"): heading "Forgot
  password", field "Email", button "Send reset link", link "Back to sign in". Same email messages as sign-in ("Enter your
  email address.", "Enter a valid email address."). Any well-formed address, known, unknown or locked, gets the same
  status titled "Reset link sent": "If an account exists for <email>, a link to reset your password is on its way."
  No mail is sent, and `/reset-password` is still a placeholder. The form is blank on every visit, including a return by
  client-side navigation.
- `AUTH_REQUIRED=false` (a runtime setting on the host, no rebuild) reverts to an open app for signed-out visitors, who
  get the build-time `NEXT_PUBLIC_DEV_ROLE`. Only the exact value `false` does that; unset or anything else keeps
  sign-in mandatory.

Code: `src/app/(auth)/{login,forgot-password}/`, `src/components/auth/`, `src/app/api/auth/{login,logout,session}/route.ts`,
`src/lib/auth/`, and `src/proxy.ts` (route gating). Pages and layouts never read the cookie: that would make them
dynamic and the Home startup screen would stop being prerendered, so the UI asks `/api/auth/session` after load.

Not secure by design: the passwords are public, and the session cookie is signed with `AUTH_SECRET` (a public default
if unset). Never put real data behind it.

## Projects (U-24, first slice)

`/projects` (all roles) lists the projects runs and documents are filed under. Built: the list, search, and New project.
Still to do: edit, changing status afterwards (U-42), the project's own page and tabs (U-45), Admin-maintained
departments (A-26, fixed in `src/config/departments.ts` for now). Code: `src/features/projects/`.

- Heading "Projects"; button "New project"; search box labelled "Search projects" (matches name, code, department or
  creator, ignoring case and surrounding spaces); a plain line "Showing N of M projects"; "No projects match "xyz"."
  replaces the table when nothing matches.
- Table named "Projects" with column headers Name, Code, Department, Created by, Inputs, Outputs, Runs, Last activity,
  Status. Five seeded rows, newest first: Payments Gateway (PAY, Engineering, Alex Admin, Active), Customer Portal (CPT,
  Product, Uma User, Active), Mobile Onboarding (MOB, QA, Uma User, Active), Legacy Billing (LBL, Finance, Sam Rivera,
  On hold), 2024 Audit Prep (AUD, Finance, Alex Admin, Archived). There is no delete anywhere (the catalogue has none).
- "New project" opens a dialog named "New project": Name, Department (select; Engineering, Finance, Product, QA), Code,
  Status (select; Active default, On hold, Archived), Description; buttons "Create project" and "Cancel". Messages under
  the fields: "Enter a project name.", "Project name must be 50 characters or fewer." (51+ fails, exactly 50 passes), "A
  project with this name already exists." (trimmed, case-insensitive, so "payments gateway" clashes), "Choose a
  department.", "Enter a project code.". Code and Description are not checked beyond that.
- A valid form closes the dialog, puts the project first (creator is the signed-in person, 0 inputs/outputs/runs, "Just
  now") and shows a status "Project created": `"<name>" was added to the list.` (button "Dismiss").
- **Nothing is saved.** The list lives in the page, so a full reload goes back to the five seeded rows; a client-side
  navigation away and back keeps what was added.

## TCG Runs (U-01)

`/tcg/runs` (all roles, sidebar link "TCG Runs" under My Work) lists the runs. It is a page where the **data** differs by
account: the "Mine" tab is the runs the signed-in person created. Code: `src/features/runs/` (the runs are in `data.ts`).
Still to do: drafts that resume at the right stage, the run history and a real run list.

- Heading "TCG Runs" (level 2); a link "Start a run" (to `/tcg/runs/start`, still a placeholder). The page waits for the
  session, so the tabs are not drawn from the wrong person's list for a moment. A tab list named "Run scope" with tabs
  "Mine" (selected first) and "Everyone". Only the open tab's content is in the page.
- Each tab has a box "Search runs" (matches run name, project or creator, ignoring case and surrounding spaces), a select
  "Filter by status" (All statuses, Draft, Running, Completed, Failed), a polite line "Showing N of M runs" (M is the
  runs under that tab, N what is left after the search and the filter) and a table named "Runs" with columns Run,
  Project, Created by, Stage, Status, Started and Test cases, newest first.
- The eight runs (Run: Project, creator, stage, status, started, test cases): Checkout flow, cycle 4: Payments Gateway,
  Alex Admin, Execute Scripts, Running, 2026-11-08, 24. Portal login hardening: Customer Portal, Uma User, Generate Test
  Cases, Running, 2026-11-07, 12. Onboarding happy path: Mobile Onboarding, Uma User, Reports & Exports, Completed,
  2026-11-05, 18. Refund edge cases: Payments Gateway, Alex Admin, Requirements Analysis, Draft, 2026-11-04, 0. Invoice
  export: Legacy Billing, Sam Rivera, Scenario Analyzer, Failed, 2026-10-29, 0. Profile page review: Customer Portal,
  Uma User, Reports & Exports, Completed, 2026-10-27, 21. Wallet payments: Payments Gateway, Alex Admin, Reports &
  Exports, Completed, 2026-10-22, 30. Audit evidence sweep: 2024 Audit Prep, Alex Admin, Requirements Input, Draft,
  2026-10-12, 0.
- **Mine** is 4 runs for the admin (Checkout flow, cycle 4; Refund edge cases; Wallet payments; Audit evidence sweep) and
  3 for the user (Portal login hardening; Onboarding happy path; Profile page review). **Everyone** is all 8 for both.
  Sam Rivera has no account to sign in with, so no one sees "Mine" as Sam.
- Each run name is a link to `/tcg/runs/<id>` (48, 47, ... 41), a placeholder named "Reports & Exports".
- Nothing left: `No runs match "xyz".` when a search finds nothing (it wins over the filter), otherwise `No failed runs.`
  (the status in lower case) when the filter finds nothing, for example Mine as the admin with Failed. The search and
  the filter stay when you switch tabs.
- **Nothing is saved**, and every visit starts on Mine with an empty search and every status: a full reload, and also a
  client-side navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## Compare Docs (U-28)

`/utilities/compare-docs` (all roles, sidebar link "Compare Docs" under My Work, same for both roles) shows what changed
between two versions of a document. Code: `src/features/compare-docs/` (the documents and the comparison are in
`data.ts`). Still to do: the AI-written report and real documents; the versions are seeded and the changes are computed
by passage reference, so there is no model behind it.

- Heading "Compare Docs" (level 2); section "Compare two versions" (level 3) with selects "Document" (a prompt "Select a
  document", then Payments Gateway Requirements, Customer Portal Requirements, Mobile Onboarding Requirements), "From
  version" and "To version" (a prompt "Select a version", then v1, v2, v3) and a button "Compare versions". Nothing is
  chosen at first and no report shows.
- Messages under the fields: "Choose a document.", "Choose a starting version.", "Choose an ending version.", "Choose two
  different versions." (the same version twice) and "The starting version must be older than the ending version." (v3 to
  v1; the last two show under To version). Focus goes to the first wrong field, in the order Document, From, To.
- A valid form shows a section "Comparison report" (level 3): `<document>: <from> to <to>`, a status "N added, N removed, N
  modified." and three lists under level 4 headings "Added (N)", "Removed (N)" and "Modified (N)", each `R<n>: <text>`
  (a modified one shows "Before:" and "After:"), or "None." when empty. Passages are matched by reference (R1, R2, ...).
  When nothing differs the status reads "0 added, 0 removed, 0 modified." and "No differences between these versions."
  replaces the three lists. **Changing any select removes the report**, so it always matches what is chosen.
- What a test can rely on: Payments Gateway v1 to v3 is "2 added, 1 removed, 2 modified." (R5 and R6 added, R3 removed,
  R2 and R4 modified); v1 to v2 is "1 added, 0 removed, 1 modified."; v2 to v3 is "1 added, 1 removed, 1 modified.".
  Customer Portal v2 to v3 has no differences; v1 to v3 is "0 added, 0 removed, 1 modified.". Mobile Onboarding v1 to v3
  is "2 added, 1 removed, 1 modified.".
- **Nothing is saved**, and every visit starts blank: a full reload, and also a client-side navigation away and back
  (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## My Inbox (U-29 to U-33)

`/inbox` (all roles, sidebar link "My Inbox" under My Work) lists the messages waiting on the signed-in person, and which
messages exist depends on the role. Code: `src/features/inbox/` (the messages are in `data.ts`). Still to do: Tasks,
Reviews / Approvals, the top-bar bell and notification preferences (U-44).

- Heading "My Inbox" (level 2). The page waits for the session, so a user never sees the admin's messages for a moment.
  A radio group "Show" with "All messages" (chosen first) and "Unread only", a button "Mark all as read" (disabled
  when nothing is unread), a polite line "N unread" (`role=status`, for example "2 unread"), a section "Messages"
  (level 3) with a line "Showing N of M messages" and the messages as a list.
- Each message shows its title, its text and "Received <YYYY-MM-DD HH:MM>"; an unread one also has a badge "Unread" and
  a button "Mark as read" whose accessible name is `Mark as read: <title>`. A read one has neither. There is no delete.
- **User** (4 messages, 2 unread, newest first): "Run 47 reached Generate Test Cases" (unread), "Report ready: Onboarding
  happy path" (unread), "Token usage at 62%", "Welcome to TCG".
- **Admin** (5 messages, 2 unread): "Token request from Uma User" (unread), "Run 48 is executing" (unread), "Token usage
  at 62%", "Project created: Customer Portal", "Welcome to TCG". The two accounts share only "Token usage at 62%" and
  "Welcome to TCG", both already read, so a test written with one account's unread messages fails with the other's.
- Marking one message reads it, drops "N unread" by one and, under "Unread only", removes it from the list. "Mark all as
  read" reads everything and leaves "0 unread"; under "Unread only" the list is then empty and `No unread messages.`
  replaces it. After any marking, focus moves to the "Messages" heading.
- **Nothing is saved**, and every visit starts with the seeded unread messages and "All messages": a full reload, and also
  a client-side navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## Help & Feedback (U-39)

`/help` (all roles, sidebar link "Help & Feedback" under My Work) is a form for reporting a problem, an idea or a
question. Code: `src/features/help/`.

- Heading "Help & Feedback" (level 2). Fields: "Kind" (radio group: Problem, Idea, Question; none chosen at first),
  "Area" (select: a prompt "Select an area" then Requirements input, Requirements analysis, Scenarios, Test cases,
  Automation scripts, Script execution, Reports & exports, Projects, Inbox, Administration, Integrations, CI/CD
  automation, Other; the same list for both roles), "Subject" (text) and "Details" (multi-line); button "Send feedback".
- Messages under the fields: "Choose a kind.", "Choose an area.", "Enter a subject.", "Subject must be 80 characters or
  fewer." (81+ fails, exactly 80 passes), "Enter some details.", "Details must be at least 10 characters." (9 fails,
  exactly 10 passes). Subject and Details are judged trimmed, so spaces alone count as empty. Focus moves to the first
  field that is wrong, in the order Kind, Area, Subject, Details.
- A valid form is replaced by a status titled "Feedback sent": `Your <kind in lower case> about <area> was sent:
  "<subject, trimmed>".` (for example `Your problem about Reports & exports was sent: "CSV export is empty".`), and a
  button "Send more feedback" that brings back a blank form.
- **Nothing is stored or sent**; there is no inbox or reference number. Leaving the page and coming back by client-side
  navigation always shows a blank form (state is reset when the page is hidden, as in `ForgotPasswordForm`), unlike
  Projects, which keeps what was added.

## Team Activity (A-09)

`/insights/team-activity` (all roles, sidebar link "Team Activity" under My Insights) lists the people on the team, and
is the app's one page where the **controls** differ by role, not only the data. Code: `src/features/team-activity/`
(the people and their activity are in `data.ts`). Still to do: real activity, and a range or filter.

- Heading "Team Activity" (level 2); section "People" (level 3). The page waits for the session, so a user never sees
  the admin's buttons for a moment.
- Table named "Team members", the same for both roles, with columns Person, Role, Runs this month and Last active and
  three rows in this order: Alex Admin (Workspace admin, 6, 2026-11-03), Sam Rivera (Workspace user, 3, 2026-10-29), Uma
  User (Workspace user, 9, 2026-11-03). The role reads "Workspace admin" or "Workspace user", so it never repeats the
  header's role badge. A polite line "Showing 3 people".
- **Admin:** a line "Select a person to open their activity." and each name is a **button** (`aria-expanded`, closed
  at first). Opening one shows a section "Activity for <name>" (level 3, focus moves to it) with a table named "Recent
  activity" (columns Date, Activity; Uma has 4 events, newest 2026-11-03 "Generated test cases for Customer Portal";
  Sam 3; Alex 4) and a button "Close details" (it also returns focus to that person's button). Opening another person
  replaces the section; clicking the open person closes it. Every person is openable, the admin's own row included.
- **User:** a line "Only a workspace admin can open a person's activity." and the names are plain text: there are no
  buttons in the page content, nothing opens, and there is no "Close details". Same rows, different accessibility tree.
- **Nothing is saved**, and every visit starts with nobody open: a full reload, and also a client-side navigation away
  and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## My Plan (U-40, A-23)

`/my-plan` (all roles, sidebar link "My Plan" under My Insights) shows the plan and a token meter, and the one place a
role changes what the page can do. Code: `src/features/plan/`. Still to do: the rest of the plan content (placeholder),
real top-ups and a history (Token Usage, U-35, is a separate screen).

- Heading "My Plan" (level 2); sections "Plan details" (Organisation "Northwind Quality Labs", Plan "Team", and a line
  "Other plan details are not available yet.") and "Token meter" (level 3).
- Token meter: a progress bar named "Share of tokens consumed" (0 to 100, now 62), the text "62% used", and the figures
  Token allowance 100,000, Tokens used 62,400, Tokens remaining 37,600 (numbers always written like 1,000,000).
- **Admin** sees a button "Add tokens"; **User** sees "Request tokens" (never both). The button shows once the session is
  known, not before: the stand-in role is admin, and a user would otherwise see the admin's button for a moment.
- Admin: dialog "Add tokens", field "Amount", buttons "Confirm top-up" and "Cancel". A good amount closes the dialog,
  raises the allowance, and shows a status "Top-up applied": `Added 5,000 tokens. You now have 42,600 tokens remaining.`
  The meter moves (105,000 / 62,400 / 42,600, 59%); tokens used never change.
- User: dialog "Request tokens", fields "Amount" and "Reason", buttons "Send request" and "Cancel". A good form closes the
  dialog and shows a status "Request sent": `Your request for 2,500 tokens was sent to your admin.` The meter does not
  move.
- Amount rules (both roles): spaces around it are ignored; commas are fine only as thousands separators ("5,000"; "1,00"
  and "5 000" are not); no decimals, signs or words. Messages: "Enter a number of tokens." (empty), "Enter a whole number
  greater than zero." (0, 1.5, -5, abc, +5), "You can add at most 1,000,000 tokens at a time." (or "request"; 1,000,001
  and up fails, exactly 1,000,000 passes). A user's empty Reason: "Tell your admin why you need them." (spaces alone
  count as empty). Focus goes to the first wrong field, Amount before Reason.
- Statuses have a "Dismiss" button. **Nothing is saved**: a full reload returns to 100,000 / 62,400 / 37,600. A
  client-side navigation away and back keeps an admin's new allowance but drops last visit's status.

## Inputs Registry (U-25, U-27)

`/inputs` (all roles, sidebar link "Inputs Registry" under My Work, same for both roles) lists the requirements inputs.
Code: `src/features/inputs/` (the inputs and the rules are in `data.ts`). Still to do: versioning, preview, delete and
filing by real projects; the five project names are the seeded ones from `src/features/projects/data.ts`.

- Heading "Inputs Registry" (level 2); button "Add input"; box "Search inputs" (matches name, project or source, ignoring
  case and surrounding spaces); select "Filter by type" (All types, Document, Jira, URL, Typed text); a plain line
  "Showing N of M inputs"; a table named "Inputs" with columns Name, Type, Project, Source, Added by, Version and Added,
  newest first.
- Six seeded rows (Name: type, project, source, added by, version): Checkout pages crawl: URL, Payments Gateway,
  https://shop.example.com/checkout, Alex Admin, v1. Portal login story: Jira, Customer Portal, CPT-31, Uma User, v2.
  Onboarding screens spec: Document, Mobile Onboarding, onboarding-spec.pdf, Uma User, v3. Refund rules: Typed text,
  Payments Gateway, "Refunds are allowed within 14 days.", Alex Admin, v1. Payments BRD: Document, Payments Gateway,
  payments-brd-v3.docx, Alex Admin, v3. Invoice export notes: Document, Legacy Billing, invoice-export.txt, Sam Rivera,
  v1. Types: three Documents, one each of the others.
- "Add input" opens a dialog named "Add input": "Input name", "Input type" (a prompt "Select a type", then Document,
  Jira, URL, Typed text), "Project" (a prompt "Select a project", then the five projects), "Source" (its hint changes
  with the type, "Depends on the input type." before one is chosen) and buttons "Save input" and "Cancel". The labels do
  not repeat each other or the page's "Search inputs" and "Filter by type".
- Messages under the fields: "Enter an input name.", "Input name must be 60 characters or fewer." (61+ fails, exactly 60
  passes), "An input with this name already exists." (trimmed, case-insensitive, so "payments brd" clashes), "Choose an
  input type.", "Choose a project.". **Source** is judged trimmed and its rule depends on the type: empty is "Enter a
  source." for every type (and the only Source message before a type is chosen); Document needs a file name with no
  spaces ending in .pdf, .docx or .txt (any case), otherwise "Enter a file name ending in .pdf, .docx or .txt."; Jira
  needs an upper-case key such as PAY-123, otherwise "Enter a Jira issue key such as PAY-123."; URL needs http:// or
  https:// and a host with a dot, otherwise "Enter a URL starting with http:// or https://."; Typed text allows up to 200
  characters ("Typed text must be 200 characters or fewer.", 201 fails, exactly 200 passes). Focus goes to the first
  wrong field, in the order Input name, Input type, Project, Source.
- A valid form closes the dialog, puts the input first (added by the signed-in person, version "v1", "Just now") and shows
  a status "Input added": `"<name>" was added to the list.` (button "Dismiss"). "Cancel" closes it and adds nothing.
- Nothing left: `No inputs match "xyz".` when a search finds nothing (it wins over the filter), otherwise `No inputs of
  type "Jira".` when the filter finds nothing.
- **Nothing is saved**, and every visit starts with the six rows, an empty search, every type and no dialog or status: a
  full reload, and also a client-side navigation away and back (state is reset when the page is hidden, as in
  `ForgotPasswordForm`).

## Token Usage (U-35)

`/insights/token-usage` (all roles, sidebar link "Token Usage" under My Insights) is a filterable log of where the tokens
went. Code: `src/features/token-usage/` (the rows are in `data.ts`). Still to do: the top-up history (U-35, A-23).

- Heading "Token Usage" (level 2); sections (level 3) "Summary" and "Usage log". The page waits for the session, so a
  user never sees the admin's view for a moment.
- **Admin** (whole workspace): Summary "Tokens added" 100,000, "Tokens consumed" 62,400, "Tokens remaining" 37,600,
  "Total in view" (the filtered rows); filters "Period" (All dates, November 2026, October 2026), "Operation" (All
  operations, Requirements analysis, Scenario generation, Test case generation, Script generation, Script execution) and
  "Person" (All people, Alex Admin, Sam Rivera, Uma User); table named "Token usage" with columns Date, Person,
  Operation, Tokens; 12 rows, newest first (the first is 2026-11-03, Uma User, Script generation, 8,400).
- **User** (own rows only, matched by email): Summary "Tokens you consumed" 29,100 and "Total in view" (no added or
  remaining); filters Period and Operation only; columns Date, Operation, Tokens; 5 rows. Alex's and Sam's rows never
  show. Sam Rivera has no built-in account, so only an admin sees those 3 rows.
- A plain line "Showing N of M entries" (M is the rows the role may see). Filters combine (all that are set must match).
  When nothing matches, "No usage matches these filters." replaces the table. "Clear filters" resets the three
  selects and is disabled while none is set. Total in view follows the filters; the other summary figures never do.
- The rows add up to the 62,400 My Plan shows ("Tokens used"; Uma 29,100, Alex 18,300, Sam 15,000), but they are
  seeded: an admin's top-up on My Plan does not appear here. Dates are shown as YYYY-MM-DD and numbers always like
  1,000,000, so the screen reads the same on any day and in any locale.
- **Nothing is saved**, and the filters start unfiltered on every visit: a full reload, and also a client-side
  navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## Get Started (U-38)

`/get-started` (all roles, sidebar link "Get Started" under My Work, same for both roles) is a five-step tour with no
data behind it. Code: `src/features/get-started/` (the steps are in `steps.ts`). Still to do: Shortcuts and the "What
next?" menu (also U-38); the Guide is its own page, below.

- Heading "Get Started" (level 2); a progress bar named "Tour progress" (value 20, 40, 60, 80, 100) and the text "Step 1
  of 5" (a polite live region; "Tour finished" at the end); an ordered list of the steps, whose current item has
  `aria-current="step"`.
- The list is not clickable; **Back**, **Next** and **Finish** are the only controls. Steps (list name, then the panel
  heading, level 3): Project / "Create a project", Requirements / "Add requirements", Analysis / "Review the analysis",
  Test cases / "Generate test cases", Scripts / "Run the scripts". The list says the short noun and the panel the verb
  phrase on purpose, so no text appears twice, and the panel has no links (a link named like a sidebar item would
  make `getByRole("link", { name: "Projects" })` match twice).
- Step 1: "Back" is disabled. Steps 1 to 4: "Next". Step 5: "Finish" replaces "Next". "Finish" replaces the panel with
  a status "Tour complete": "You have seen all 5 steps. You can start over any time." and a button "Start over" (back to
  step 1).
- **Nothing is saved.** Every visit starts at step 1: a full reload, and also a client-side navigation away and back
  (state is reset when the page is hidden, as in `ForgotPasswordForm`), so a half-finished tour is not resumed.

## Guide (U-38)

`/guide` (all roles, sidebar link "Guide" under My Work, same for both roles) is read-only help with three tabs, and the
app's one page of tabs and an accordion. Code: `src/features/guide/` (the text is in `data.ts`). Still to do: Shortcuts
and the "What next?" menu (also U-38).

- Heading "Guide" (level 2); a tab list named "Guide sections" with the tabs "Pipeline" (selected first), "Standards"
  and "Glossary". Only the open tab's content is in the page (`keepMounted` is off), so nothing hidden can answer a
  locator. Arrow keys move between tabs and select them.
- **Pipeline:** heading "Pipeline at a glance" (level 3) and an accordion of the seven stages, named exactly as on the
  pipeline rail (`src/config/pipeline.ts`): Requirements Input, Requirements Analysis, Scenario Analyzer, Generate Test
  Cases, Generate Automation Scripts, Execute Scripts, Reports & Exports. Each is a button with `aria-expanded`, all
  closed at first. **Only one is open at a time**: opening another closes the open one, and clicking the open one
  closes it. The two optional stages start their text with "Optional.".
- **Standards:** heading "Standards the platform follows" and a term/definition list: ISO/IEC/IEEE 29148, ISO/IEC/IEEE
  29119-4, ISTQB, IREB.
- **Glossary:** heading "Glossary", a box labelled "Search glossary", a polite line "Showing N of 9 terms" and nine terms
  in alphabetical order (Assumption, Coverage, Incremental run, Readiness score, Requirement, Scenario, Test case, Test
  type, Traceability). The search matches the term or its meaning, ignoring case and surrounding spaces (for example
  "test" leaves five terms, "trace" leaves Traceability). Nothing matching: `No terms match "zzz".` replaces the list.
- **Nothing is saved**, and every visit starts on Pipeline with every stage closed and an empty search: a full reload,
  and also a client-side navigation away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## Profile (U-40, U-44)

`/profile` (all roles, sidebar link "Profile" under My Work) shows the signed-in account, lets the person edit their
display name and department, and change their password. Code: `src/features/profile/`. Still to do: notification
preferences (U-44).

- Heading "Profile" (level 2); three sections (level 3): "Account" (Email and Role as a term/definition list; Role reads
  "Workspace admin" or "Workspace user", so it never repeats the header's role badge), "Edit profile" and "Password".
  The page waits for the session, so the fields start with that person's own values.
- **Edit profile:** "Display name" (starts as the account's name, "Alex Admin" or "Uma User") and "Department" (select:
  a prompt "Select a department", then Engineering, Finance, Product, QA; starts as Engineering for the admin and Product
  for the user); button "Save profile". Messages: "Enter your display name." (empty or spaces), "Display name must be 40
  characters or fewer." (41+ fails, exactly 40 passes), "Choose a department.". A valid form shows a status "Profile
  saved": `Your profile was updated: "<name, trimmed>" in <department>.` The header keeps showing the session's name.
- **Password:** "Current password", "New password", "Confirm password" (the last is not "Confirm new password" on
  purpose: `getByLabel("New password")` is a substring match and would find two fields); button "Change password".
  "Current password" is checked against the signed-in account's real built-in password, so the admin's password is wrong
  on the user's account and the reverse. Passwords are compared exactly: not trimmed, case-sensitive. Messages: "Enter
  your current password.", "Current password is incorrect.", "Enter a new password.", "New password must be at least 8
  characters." (7 fails, exactly 8 passes), "New password must be different from your current password." (only once the
  current one is right), "Confirm your new password.", "Passwords do not match.". A valid form clears the three fields
  and shows a status "Password changed": "Your password was changed."
- Focus goes to the first wrong field (Display name before Department; Current, New, Confirm in that order). Only one
  status shows at a time: a new submit removes the old one, and each has a "Dismiss" button.
- **Nothing is saved**, and signing in still uses the built-in passwords, so a test that signs out and signs in with
  the "new" password fails by design. A full reload, and also a client-side navigation away and back (state is reset
  when the page is hidden, as in `ForgotPasswordForm`), shows the starting values, empty password fields and no status.

## My TCG Time (U-36)

`/insights/my-time` (all roles, sidebar link "My TCG Time" under My Insights) is a log of the sessions a person spent on
the platform, over a date range they choose. Code: `src/features/my-time/` (the sessions are in `data.ts`). It is
always the signed-in person's own time, for both roles (Team Activity, A-09, is the separate screen that looks across
people, still a placeholder).

- Heading "My TCG Time" (level 2); sections (level 3) "Date range", "Summary" and "Time log". The page waits for the
  session, so a person never sees the admin's rows for a moment.
- **Rows** (matched by email): user (Uma) has 8 sessions, 6 h 30 min over 6 days, busiest day 2026-10-30 (2 h 0 min);
  admin (Alex) has 5 sessions, 4 h 25 min over 5 days, busiest day 2026-10-28 (1 h 30 min). Neither sees the other's.
  Dates are shown as YYYY-MM-DD and times as 24-hour HH:MM, so the screen reads the same on any day and in any locale.
- **Date range:** text fields "Start date" and "End date" (placeholder YYYY-MM-DD; they start as 2026-10-27 and
  2026-11-03, the days the seeded rows cover) and buttons "Apply range" and "Reset range" (disabled while the range is
  the starting one and nothing is wrong). The labels are not "From" and "To" on purpose: `getByLabel("To")` is a
  substring match and would find other things. The table changes only when "Apply range" passes; after an error it keeps
  showing the last good range.
- Messages under the fields: "Enter a start date.", "Enter an end date.", "Enter the start date as YYYY-MM-DD." (also
  for "2026-1-5", "27/10/2026" and an impossible date such as 2026-02-30), "Enter the end date as YYYY-MM-DD.", "The end
  date must be on or after the start date." and "Choose a range of 31 days or fewer." (both ends count: 32 days fails,
  exactly 31 passes; the last two show under End date). Dates are judged trimmed. Focus goes to the first wrong field,
  Start date before End date. A good range puts the trimmed dates back in the fields.
- **Summary** (follows the range): "Total time" (for example "6 h 30 min"; under an hour "45 min"; always spelled `H h M
  min`, so exactly two hours is "2 h 0 min"), "Days with activity" (days, not sessions) and "Busiest day" (`<date> (<time>)`,
  the later date wins a tie, "None" when the range is empty).
- **Time log:** table named "Time log" with columns Date, Started, Ended, Area, Duration, newest first (the first row for
  the user is 2026-11-03 14:00 to 14:30, Test cases, 30 min); a polite line "Showing N of M sessions from <start> to
  <end>" (M is that person's sessions). "No time recorded in this range." replaces the table when nothing falls in it.
  The columns are "Started" and "Ended", not "From" and "To", so no name repeats a field's label.
- **Nothing is saved**, and every visit starts on the starting range: a full reload, and also a client-side navigation
  away and back (state is reset when the page is hidden, as in `ForgotPasswordForm`).

## TCG CI/CD trigger workflow (local TCG, through a tunnel)

`.github/workflows/tcg-cicd-automation-run-4.yml` is TCG's generated GitHub Actions workflow for **run 4** (named "tcg
clone 2") of the **local** TCG (its CI/CD page is `/cicd-automation/33`). It fires when a PR merges into `main` (and on
manual dispatch) and posts the diff to TCG's trigger endpoint, from a GitHub-hosted runner (`ubuntu-latest`). The body
carries `run_number: 4`. Its repository secrets are `TCG_CICD_TOKEN_RUN_4` and `TCG_CICD_ENDPOINT_URL`.

- **One file and one token per run.** TCG's file says it is for run 4 only: a PR merged here becomes a new, incremental
  run built on run 4, so a later run gets its own file and its own `TCG_CICD_TOKEN_RUN_<n>` secret. Never use one run's
  file with another run's token. Keep only one such file in `.github/workflows/`: two would both fire on every merge,
  each against its own run. This file replaced `tcg-cicd-automation-run-1.yml` (run 1 of "cicd test", CI/CD page
  `/cicd-automation/28`), so the `TCG_CICD_TOKEN_RUN_1` secret is no longer used and can be deleted in GitHub. Earlier
  files, all unused now: `tcg-cicd-automation-run-40.yml` (run 40 of "testing cicd", page `/cicd-automation/20`, secret
  `TCG_CICD_TOKEN_RUN_40`) and `tcg-cicd-automation.yml`, which read a plain `TCG_CICD_TOKEN` (no run number, local
  project 16). Before those the connection was stage (project 546, `https://adaps.net/cicd-automation/546`), whose
  values were overwritten and cannot be shown again by GitHub, so they must be copied from TCG to bring stage back.

- **The endpoint secret must be a public URL, never `http://localhost:3000/...`.** The job runs on GitHub's computer, where
  `localhost` is that computer, not the developer's PC, so curl fails with "Failed to connect to localhost port 3000".
  Stage worked because `adaps.net` is on the internet. Give the local TCG a public address with a tunnel (for example a
  Cloudflare quick tunnel or ngrok pointed at port 3000) and set the secret to
  `https://<tunnel-host>/api/v1/tcg/cicd/trigger`. The token secret does not change when the tunnel does.
- A quick tunnel gets a new URL each time it restarts, so update `TCG_CICD_ENDPOINT_URL` then. The tunnel and the local TCG
  have to be running when a PR merges. While it is up, the tunnel exposes the whole local TCG app to anyone who has the
  URL, not only the trigger endpoint, so stop it when not in use.
- The workflow is TCG's file with one change: a `clean` step at the top of the trigger script that strips stray
  whitespace from both secrets. A secret pasted with a trailing newline or space made curl fail with "(3) URL rejected:
  Malformed input to a URL function" (the value looked right in GitHub's editor; the caret sat on a second line). If TCG
  regenerates its file, re-apply it, and the header comment about the tunnel. An earlier version also changed the project
  link in the last error message (stage's 546 to the local 16); the run 4 file already names the local TCG. PR #9 had
  moved the job to a self-hosted runner on the PC instead, which `localhost` would work from, but it needs a runner
  registered and online on that PC (the job sat queued with none), plus `jq` and a fork-approval setting; the tunnel
  avoids all of that.
- A run goes red at "Trigger TCG re-execution" when a secret is missing (a missing token shows up as TCG rejecting the
  request), when TCG answers 403 (the GitHub Actions method is not enabled in that project's CI/CD settings), or when TCG
  cannot be reached. Token and endpoint values live only in Settings, Secrets and variables, Actions; never in the repo or
  in anything that gets committed. Add `TCG_CICD_TOKEN_RUN_4` before merging the PR that brings this file in: that merge
  is itself a PR close, so the workflow runs for it.
- The local TCG picks the deployed URL to test from the project's last Execute Scripts run or crawl, so that target must
  be a URL the local TCG can reach.
- **This is the repo's only workflow.** A second one, `pr-requirement-input.yml` with
  `.github/scripts/build-requirement-input.mjs`, was removed on 2026-11-08. On every PR open or update and every push to
  `main` it recorded the PR's description and diff as `requirement-input.md` and `.json`, and delivered them to a
  workflow artifact and to the `requirements-inbox` branch (a bot commit each time). Its webhook step was skipped in
  every run checked (no `REQUIREMENTS_WEBHOOK_URL` secret), and no TCG endpoint is known to accept such a record, so
  nothing read it; the trigger workflow above already sends TCG the PR description and the diff itself. Nothing on
  `main` required its `record` check. The `requirements-inbox` branch is left in place as history and can be deleted.

## Open questions (close these when answered, then delete them here)

1. **Private-IP allowlist.** Not verified whether `CRAWL_ALLOWED_HOSTS` lets private addresses through, which decides
   whether a localhost or LAN deployment of this app can be crawled and executed against.

## Keeping this file current

Update this file in the same change whenever the repo's purpose or the TCG integration changes: a change to the
TCG CI/CD trigger workflow, an answered open question, a new TCG feature that touches the app, or a change to the build rules.
The TCG facts above come from `aihub`'s own docs as read on 2026-10-27; if they disagree with `aihub`, `aihub` wins.
