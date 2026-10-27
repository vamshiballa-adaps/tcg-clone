# TCG – Business Requirements Document (Feature Catalogue)

Oct 26, 2026 · Prepared by bhargav

## 1. Document overview

AI Hub (TCG) turns raw requirements into a reviewed, exportable test suite, and optionally into runnable Playwright automation. This BRD catalogues every feature in the repository as of 26 Oct 2026, grouped by role, with a description and the functionality each one delivers.

**Purpose.** Give product, QA, engineering and client stakeholders one authoritative list of what TCG does, who can do it, and which delivery window shipped it.

**Scope.** Everything in the monorepo under `apps/`: the Next.js web app (`experience`), the Go backend-for-frontend (`orchestration`), the Python AI core (`core`), the Adapto assistant (`adapto`), plus the stub Rust engine and Kafka telemetry consumer. Focus is the two tenant roles, Admin and User. Platform-only features are listed briefly for completeness.

**Source of truth.** Feature behaviour is taken from `CLAUDE.md`, `docs/*.md`, the RBAC seed (`internal/seed/rbac.go`), the capability map (`internal/authz/capabilities.go`), the route tree under `apps/experience/src/app`, and the git history on `dev`.

**Product in one paragraph.** A user supplies requirements (BRD upload, Jira or Confluence import, typed text, or a crawl of a live application). TCG scores them against ISO 29148, extracts scenarios, generates test cases in the project's own format, and can generate and execute Playwright scripts. Sign-off gates, token budgets, projects, integrations and an in-app assistant (Adapto) surround that pipeline.

### 1.1 Business problem

Test teams spend large amounts of manual effort turning requirement documents into test cases. Requirements are often vague, scattered across documents, Jira and Confluence, and change mid-project. Test suites then miss requirements, cannot be traced back to their source, and are slow to update. Approvals happen informally, and nobody can see how much effort or AI spend a project has consumed.

### 1.2 Business objectives

| ID | Objective |
| --- | --- |
| BO-1 | Produce traceable test cases from requirements in any common form (document, Jira, Confluence, typed, dictated, or a live application). |
| BO-2 | Measure how testable the requirements are before testing begins, using ISO/IEC/IEEE 29148, and let analysts correct them. |
| BO-3 | Keep humans in control through reviewable scenarios, assumptions, fixes and formal sign-off gates. |
| BO-4 | Deliver output where teams already work: PDF, CSV, Excel and Word exports, Zephyr Scale, Confluence, Playwright code and CI/CD pipelines. |
| BO-5 | Let each client administer its own people, structure, policy and integrations, with strict isolation between clients. |
| BO-6 | Give clients visibility and control of AI consumption through token allowances and usage reporting. |
| BO-7 | Help users learn and operate the product through an in-app assistant, guide and feedback channel. |

### 1.3 Stakeholders and users

| Stakeholder | Interest |
| --- | --- |
| User (tester, analyst, business analyst) | Generates, reviews and exports test cases and scripts; works with inputs, projects, tasks and approvals. |
| Admin (client QA lead or workspace owner) | Configures people, departments, sign-off policy, integrations, CI/CD and project settings; oversees workspace usage. |
| Reviewer and approver | Any User named by policy or by request to sign off a run's artefacts. |
| Platform and System Admin (Adaps) | Operates clients, subscriptions, observability and cross-client support. |
| Client management | Needs traceability, coverage reporting and spend visibility. |

### 1.4 Scope

**In scope:** requirements input and analysis, scenario and test case generation, optional Playwright script generation and execution, reports and exports, projects, inputs and outputs registries, review and approval workflow, tasks and messages, notifications, Administration, integrations (Jira, Confluence, Zephyr Scale, Microsoft Entra ID), CI/CD automation, token metering, the Adapto assistant, and platform administration.

**Out of scope or planned:** Selenium and REST Assured script generation, push of test cases to Jira, a hosted test-execution engine beyond the live browser run, and non-English languages. Items are listed in section 6.3.

### 1.5 Assumptions and constraints

- Users sign in with an account created or invited by an Admin of their client.
- Generation depends on a configured large-language-model provider and a per-client token allowance.
- Jira, Confluence and Zephyr Scale features require an Admin to connect the client's Atlassian site first.
- Zephyr Scale push requires the Jira connection.
- Execution of scripts requires a reachable test application URL.
- Generated content is advisory and must be reviewed by a person before use.

### 1.6 Success measures

| Measure | Target behaviour |
| --- | --- |
| Requirement coverage | Every requirement is mapped to at least one scenario, or listed as uncovered with a reason. |
| Traceability | Every test case links to a scenario and a requirement. |
| Readiness | Each analysis reports a score out of 100 with a verdict (Ready from 75, Proceed with caution 50 to 74, Not ready below 50). |
| Governance | Required sign-offs hold a run until decided. |
| Spend visibility | Remaining tokens are visible to every user at all times. |

### Pipeline at a glance

| Step | Stage | Optional | Screen |
| --- | --- | --- | --- |
| 1 | Requirements Input | No | `/tcg/runs/start` |
| 2 | Requirements Analysis (RI) | No | `/tcg/runs/ri/[docId]` |
| 3 | Scenario Analyzer | No | `/tcg/runs/scenario/[docId]` |
| 4 | Generate Test Cases | No | `/tcg/runs/generate/[jobId]` |
| 5 | Generate Automation Scripts | Yes | `/tcg/runs/scripts/[jobId]` |
| 6 | Execute Scripts | Yes | `/tcg/runs/execute/[jobId]` |
| 7 | Reports & Exports | No | `/tcg/runs/[id]` |

"Upload Test Results" exists as a hidden rail placeholder with no screen, so users see seven steps.

### Glossary

| Term | Meaning |
| --- | --- |
| Tenant / client | One customer workspace. All data is isolated per tenant by explicit Go-side checks. |
| Project (folder) | A node in the department/team tree. Every document and run belongs to exactly one. Formerly "Workbench". |
| Session | The resumable draft of one wizard journey, saved from the first input. |
| Run / job | A session becomes a job (gets a `job_id`) only when Generate Test Cases starts. |
| RI | Requirements Analysis: ISO 29148 scorecard, findings and requirement register. |
| Gate / sign-off | A required review or approval before a stage may proceed. |
| Capability | A UI-shaped key (for example `run.start`) computed from a user's permissions. |
| Adapto | The in-app AI assistant with a RAG knowledge base and live run-status chat. |

## 2. Roles and permissions

TCG ships four built-in roles. Admin and User are the tenant roles this BRD focuses on; Admin includes everything a User can do. Access is enforced server-side by a \~130-entry permission catalogue resolved through a cached bitmask, and the UI reads opaque capability keys (for example `run.start`, `user.manage`) derived from those permissions.

| Role (slug) | Scope | Who it is for | Summary |
| --- | --- | --- | --- |
| User (`project_member`) | One tenant | Testers, analysts, BAs | Default role. Runs the whole pipeline, manages projects and inputs, reviews and approves. |
| Admin (`admin`) | One tenant | Workspace owner, QA lead | Everything a User can do, plus people, roles, org chart, sign-off policy, integrations, CI/CD and project configuration. |
| Platform Admin (`platform_admin`) | All tenants | Adaps operations | Every permission across every tenant. |
| System Admin (`super_admin`) | All tenants | Adaps engineering | Same mask as Platform Admin; separate slug used by route gating and the platform error log. |

### Access matrix (tenant roles)

| Capability area | User | Admin |
| --- | --- | --- |
| Dashboard (personal numbers) | Yes | Yes, counts the whole workspace plus a Users box |
| Start, resume, retry, cancel, reproduce, delete own runs | Yes | Yes |
| Requirements input, analysis, scenarios, test cases, scripts, execution, reports | Yes | Yes |
| Projects: create, edit, status | Yes | Yes |
| Inputs Registry and Output Artefacts | Yes | Yes |
| Review and approval inbox, tasks, messages, notifications | Yes | Yes |
| Use Jira, Confluence, Zephyr (import and push) | Yes | Yes |
| View project config (test case format) | Yes | Yes |
| Token usage and My TCG Time (own) | Yes | Yes |
| Team activity | Yes | Yes, plus any user's activity |
| Administration hub (5 tabs) | No | Yes |
| Create, edit, invite, deactivate, delete users | No | Yes |
| Roles, groups, role assignment | No | Yes |
| Org chart, departments, org profile | No | Yes |
| Workflow Setup (sign-off policy) | No | Yes |
| Integration connections (Jira, Confluence, Zephyr, Entra ID) | Use only | Configure |
| CI/CD Automation | No | Yes |
| Project Config (Jira mapping, test case format, Zephyr mapping) | View only | Manage |
| Audit log, token history, security | No | Yes |

An Admin can switch their active role to User from the account menu to see the personal view; the sidebar's My Organization section disappears while acting as User. Roles nest by design: a promotion never loses a permission the junior role had.

## 3. Admin role features

The Admin configures and governs one workspace. Every feature below is tenant-scoped; cross-tenant isolation is enforced by explicit Go-side tenant checks on every API. Admins also hold every User feature (section 4).

### 3.1 Administration hub (`/administration`)

Five tabs under My Organization › Administration. It is reachable only to users holding the Administration capability (Admins).

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-01 | Org Profile | The workspace's identity and its commercial agreement with Adaps. | Edit organisation name, logo (PNG, JPEG, SVG) or up to three initials, website. Edit main contact, email, phone, address. Read-only agreement card: plan, status, agreed users, token allowance, billing, PO number, account manager. |
| A-02 | Departments | First-class department records, separate from the org chart. | Create, rename and delete departments. Assign one Head from a people picker. Shows People count per department. Projects can be filed under a department. |
| A-03 | Users & Hierarchy | One screen for the people roster, outstanding data fixes and the reporting chart. | Roster columns: person, ingestion status (Complete, Incomplete, Blocked), added via (manual, org chart, Azure users, CSV), user status, department, role, last seen. Filters: All, Active, Awaiting sign-in, Suspended, Inactive, plus a "N need fixing" chip. Per-row invite, edit, remove. Open a person for contribution summary, profile and reporting line. |
| A-04 | Org-chart import and directory sync | Bulk load or sync people and reporting lines. | Import an org chart from CSV with a review step and Save as draft. Get users from Microsoft Entra ID through a directory-sync dialog. Reconcile an uploaded chart against the directory. Only real directory employees can be added when trusted domains are configured. |
| A-05 | Workflow Setup | The tenant-wide sign-off policy, shown as a RACI matrix. | One row per artefact kind: Requirements Analysis, Test scenarios, Test cases, Execute Scripts, Test script, Document. Assign Responsible, Accountable (approver), Consulted (reviewer), Informed. Switch review on or off per row, set whether a rule blocks the run, set escalation if nobody answers. Also viewable By person. Rules do not reach back onto already-completed runs. |
| A-06 | Project Config | Settings that belong to one project. See 3.4. | Projects list grouped as Configured, Yet to be configured, Needs attention. Three tabs per project. |

### 3.2 User, role and access administration

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-07 | User lifecycle | Create and manage workspace accounts. | Create, update, invite, resend invite, deactivate, reactivate, delete users. Admin-triggered password reset and session revoke. Bulk status filters and search by name, email, department. |
| A-08 | Roles and groups | Compose access beyond the built-in roles. | Create, update, delete custom roles from the permission catalogue. Assign and revoke roles. Create groups with parent groups and members. Guards stop one Admin stripping another's role or granting rights they do not hold. |
| A-09 | Per-user activity | An audit view of what one person did. | Four stat tiles (runs, scenarios, test cases, documents) with drill-in, plus a filterable event timeline of sign-ins and run lifecycle events with geo and device enrichment. Tabs for profile, time on platform and access. |
| A-10 | Audit log and security | Tenant-visible audit and account protection. | Audit log list and read. Security page for organisation-level controls. Token history for the workspace. |
| A-11 | Office hours | Working-hours definition used for time tracking and escalation. | Manage office hours for the tenant. |

### 3.3 Integrations (`/integrations`)

Admins connect the workspace to outside systems. Once connected, every User can import and push. Credentials are never returned to the browser; changing a connection requires a real signed-in person, not an admin key.

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-12 | Jira Cloud connection | Source of requirements. | Store site URL and credentials, test the connection, browse projects and issues. Import issues as run inputs; issue pictures are downloaded and described by vision. Push to Jira is switched off; import only. |
| A-13 | Confluence Cloud connection | Pages as requirements; pages as output. | Connect, preview and import pages including screenshots. Optional push of generated test cases or automation suites back to a page. |
| A-14 | Zephyr Scale connection | Push-only test management target. | Connect (including an AU region option), then push generated test cases as native Zephyr entities in batches. Requires the Jira connection. |
| A-15 | Microsoft Entra ID directory | Validate people against the corporate directory. | Check the live Graph connection, set trusted email domains, drive directory sync for A-04. |
| A-16 | Integrations summary | Landing view of what is connected. | Tick, warning or cross per product for the workspace. Platform actors see a client-by-integration matrix. |

### 3.4 Project Config

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-17 | Jira requirement mapping | Which Jira fields a project's runs read. | Select extra Jira fields to be read as requirements in addition to the defaults. |
| A-18 | Test case format | The format a project's test cases are generated and downloaded in. | Choose Adaps Standard (15 columns, display columns pickable) or upload a custom template. Generation copies the project's format into each run and fixes it once generation starts. |
| A-19 | Zephyr mapping | How test cases map to Zephyr Scale fields on push. | Map columns to Zephyr fields. A format change stamps a signature; if it changes after the mapping was saved, the project is flagged Needs attention and pushes are refused with a 409 until the mapping is saved again. |

### 3.5 CI/CD Automation Testing (`/cicd-automation`)

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-20 | CI/CD trigger setup | Re-run a project's generated Playwright suite whenever code merges. | Lists runs with a finished suite. Per run, three independent tabs: GitHub Actions, Jenkins, API & webhooks. Generate setup creates a one-time-visible token; Rotate token; copy token and endpoint; copy or download a ready-made workflow YAML, Jenkinsfile stage or example command. |
| A-21 | Pause, disconnect and fallback policy | Operate the pipeline safely. | Active or Paused switch per method, Disconnect clears token and settings but keeps history, and a "Run full suite if no test-relevant files changed" option. Trigger history with manual Run full suite. |

### 3.6 Admin oversight of work

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-22 | Workspace-wide Dashboard | Where the work stands across the tenant. | Six boxes (Inputs Registry, TCG Runs, Output Artefacts, Tokens, My Inbox, Users). The Users box and workspace-wide counts are Admin only. |
| A-23 | Token governance | Visibility of the tenant token allowance. | Token Usage by person, operation and date with top-ups; Token History from the admin surface; a sidebar meter for the month. |
| A-24 | Admin role switch | Same screens, two views. | An Admin can switch the active role to User in the account menu to see the personal view; sign-in and the logo always land on the Dashboard. Platform tiers can additionally act on behalf of any client. |

### 3.7 Additional Admin features

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| A-25 | Acting-role switch | Admins can work as a User. | Account menu lets an Admin switch the active role to User; the personal Dashboard appears and the My Organization section is hidden until switched back. |
| A-26 | Department-aware projects | Organise projects by department. | Projects are filed under a department; the department list is maintained in Administration. |
| A-27 | Trusted email domains | Restrict who can be added. | Admins configure trusted domains so only addresses in the corporate directory domains can be invited. |
| A-28 | Org-chart review drafts | Safe bulk import. | Imports are reviewed before they apply and can be parked as a draft. |
| A-29 | Sign-off escalation | Nobody answering never stalls a run indefinitely. | Accountable approvals climb the org chart when no approver is named; rules can escalate if nobody answers in time. |

## 4. User role features

The User is the working role: it runs the full pipeline end to end. Every feature here is also available to Admins. The sidebar groups them as My Work, My Insights and (Admin only) My Organization.

### 4.1 Run pipeline (the core product)

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| U-01 | TCG Runs list | One table of runs with filters, drafts and history. | Tabs Mine (opens by default) and Everyone (every run in the workspace, open to all members), count badges, search by name, run id, person or project, four filter dropdowns, sortable columns, 10/25/50 per page. Draft sessions appear as rows and resume at the right stage. Incremental versions fold into one row with a v-of-N badge. |
| U-02 | Start a run | Name the run and pick its project. | Run name up to 30 characters, unique inside a project. A permanent per-workspace Run ID is assigned at Next. Drafts autosave; discarding a draft releases its ID. |
| U-03 | Stage 1: Requirements Input | A CHOOSE INPUTS rail of ways to supply requirements. | Seven rows: questionnaire and input (conversational Q&A), requirement documents, Jira, Confluence, URLs, dictated requirements, and reviewers and approvers. Mark each input Main Req or For Context. Any one of the first six is enough. Shows "Available to this run" count and a token-budget gate. Inputs are scoped to the run's project plus Common. |
| U-04 | Typed and dictated requirements | Requirements without a file. | Type requirements directly or dictate them by speech; stored as inputs in the registry. |
| U-05 | Crawl the application | Derive an Application Behaviour Specification from a live app. | Enter an https URL, optional login (used for that crawl only, never stored) and crawl depth 1 to 100 (default 10). The crawler follows links, tabs, menus and scrolled content and produces a requirements source. |
| U-06 | Pictures in requirements | Read screenshots, not just text. | Images in Word, PowerPoint, HTML, Jira attachments and Confluence pages are described by a vision model and analysed with the text. Icons under 48 px are skipped; an unreadable picture never stops a run. |
| U-07 | Incremental TCG | Update test cases when requirements change. | Choose Full run or Based on an existing run. Pick from the workspace's 500 most recent completed runs. Only changed requirements re-enter the pipeline; scenarios carry Still valid, Changed, New or Obsolete pills; Requirements Analysis shows a Since last run column. |
| U-08 | Per-run sign-off roster | Add reviewers and approvers to one run. | Add extra reviewers and approvers per kind (analysis, scenarios, test cases, execute scripts, automation scripts) on top of the workspace policy. |
| U-09 | Stage 2: Requirements Analysis | ISO/IEC/IEEE 29148 readiness scoring. | Counts of inputs, requirements and findings; findings table by severity (Critical to Low) and dimension (Testability, Clarity, Consistency, Completeness, Atomicity, Identifiability); requirements register with priority; overall verdict: Ready (75 or more), Proceed with caution (50 to 74), Not ready (below 50). Acceptance criteria are extracted as written, never invented. Abort supported. |
| U-10 | Accept or type a fix | Turn a finding into an agreed requirement wording. | Accept a suggested rewrite or type your own; a lightweight model checks typed fixes (advisory, Accept anyway overrides). Accepted fixes are carried into scenarios and test cases. |
| U-11 | Assumptions review | Confirm what the analysis guessed. | A dialog lists each assumption to mark True or Not true, with an optional correction. Not true triggers Redo the analysis. Skipping leaves unreviewed guesses explicitly not assumed. Proceed is held until reviewed or skipped. |
| U-12 | Completeness backstops | Every stated rule reaches the register and a scenario. | Rule-based extra register rows for table rules, acceptance-criterion labels and numbered obligations (cap 40). A requirement with no scenario is listed with the reason. |
| U-13 | Stage 3: Scenario Analyzer | Review scenarios derived per ISO/IEC/IEEE 29119-4. | Counts for inputs, requirements, scenarios and not covered. Scenario cards with priority, 16 test-type tags, user-story description, linked requirement IDs, optional Given/When/Then and "rests on" lines. Select, filter by type, edit, delete, add manually, merge. User-added and user-edited markers. Export scenarios. |
| U-14 | Test types and additional checks | Control what gets generated. | Dialog lists all 16 test types with counts; untick types to skip or tick types no scenario carries to add them. Optional Additional checks. Choice is stored per run. |
| U-15 | Test case format on the run | Show which format will be generated. | Displays the project's format (Adaps Standard or custom template) and column count. Fixed once generation starts. |
| U-16 | Stage 4: Generate Test Cases | Expand each scenario into executable test cases. | Seven-step live tracker (Parse, Analyse, Scenarios, Expand, Coverage, Trace, Done) with Abort. Result table with ID, title, scenario, priority, steps, complexity, status, type; row detail with acceptance criterion, preconditions, steps, expected result, test data, labels and traced requirements. Titles read "Verify that ..." with numbered steps. Search and filter by test type. |
| U-17 | Test case authoring permissions | Curate the suite. | The User role holds create-manual, update, delete, bulk-action and link-requirement permissions on test cases, exercised through the platform API. |
| U-18 | Push to Zephyr Scale | Deliver test cases to test management. | Push generated cases in batches using the project's Zephyr mapping. Jira push is switched off. |
| U-19 | Stage 5: Generate Automation Scripts (optional) | Convert test cases to Playwright code. | Choose source suite, framework (Playwright TypeScript, or Playwright Java as a JUnit 5 and Maven project; Selenium and REST Assured shown as Coming soon), mode and selection; generate, review code per script, regenerate one script, download ZIP. Text-only, never drives a browser. |
| U-20 | Stage 6: Execute Scripts (optional) | Run test cases against a real application. | Enter the target URL; an agent drives a real browser one case at a time with a live CDP video view and a step log; progress card and Abort; CSV results download. |
| U-21 | Upload test results | Bring manual execution results back. | Upload an .xlsx of results into a project; the sheet is matched by column name. (Rail step is hidden; results box lives on the project.) |
| U-22 | Stage 7: Reports & Exports | Per-run reporting. | Seven viewable tabs (Summary, Documents, Conversation, Requirements, Scenarios, Test cases, Coverage) and a full-report preview. Downloads: PDF, CSV, Excel, Word; traceability matrix; coverage report; full run report ZIP; scenarios and requirements exports. Test-case exports carry S.No, TC ID, AC, complexity, steps, expected result, labels, test data, status and defect ID. |
| U-23 | Run controls | Operate a run safely. | Cancel, resume (where supported), retry, reproduce, delete own runs. Aborted analysis, scenario and generation stages cannot be resumed; start a new run. |

### 4.2 Projects, inputs and outputs

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| U-24 | Projects | The flat list that runs and documents are filed under. | Search by name, code, department or creator. New project: name (50 chars, unique, case-insensitive), department, code, status, description. Columns for inputs, outputs, runs, last activity, status; edit via pencil; no delete. Project page tabs include Artefacts and Reviews / Approvals. |
| U-25 | Inputs Registry | Every requirements input in the workspace. | Table with source (Document, Jira, Confluence, URL, Questionnaire, Dictation), filing (project, Common or unfiled), last touched, run usage count; add, file under projects, version, preview, delete. AI suggests tags on upload. |
| U-26 | Output Artefacts | Everything runs produced, traceable to the run. | Five kinds derived from run data (analysis, scenarios, test cases, script suites, test results) each with its own tab; download any artefact. |
| U-27 | Document versioning and preview | Versioned documents in SeaweedFS. | Upload new versions, preview any version in a modal (PDF, spreadsheet, prose), version timeline. |
| U-28 | Compare Docs (Utilities) | Diff two versions of one document. | Pick a document and From/To versions; an AI report lists added, removed and modified passages. |

### 4.3 Collaboration

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| U-29 | My Inbox | One screen for everything waiting on you. | Tabs: Tasks, Reviews / Approvals, Messages. Always personal. |
| U-30 | Reviews and approvals | Sign-off on run artefacts and ad-hoc asks. | Two sections: Raised by the pipeline (gates a run) and Asked of you by name (gates nothing). Reviews and Approvals pills, slices (All, In your queue, Raised by you, Closed), search, project filter, approve or reject with comment and undo. Send for review or approval from a stage's sign-off banner. |
| U-31 | My Tasks | Direct request from one person to another. | Raise a task for anyone, assign, update, reopen, close, withdraw, reassign. |
| U-32 | Messages | One-way notes with fixed reactions. | Send up to 1,000 characters to people, optionally pointing at a run, document or project; recipients reply Got it, Will do, Done, Will discuss or Not for me. |
| U-33 | Notifications | Bell and email for events. | Cards for tasks, reviews, approvals and messages, plus run events; per-user preferences on the Profile Notifications tab. Nobody is notified of their own action. |

### 4.4 Insights, help and account

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| U-34 | Dashboard (home) | Where your work stands. | Five boxes for a User (Inputs Registry, TCG Runs, Output Artefacts, Tokens, My Inbox) counting only your own work. |
| U-35 | Token Usage | Tenant token spend and balance. | Tokens consumed card with total added, consumed, remaining, top-ups; breakdown by person, operation and date; sidebar token meter. Embedding, vision and execute-script usage is metered. |
| U-36 | My TCG Time | Time you actually spent on the platform. | Minute-by-minute self-scoped usage over a date range. |
| U-37 | Adapto assistant | In-app AI help. | RAG-backed answers from a per-feature knowledge base, live status of your runs, activity and time lookups; docks on the right. Replaces the legacy in-core assistant. |
| U-38 | Get Started, Guide, Shortcuts | Orientation. | Get Started walkthrough, an in-app Guide of the pipeline and ISO/ISTQB/IREB standards, a Shortcuts launcher, a What next? top-bar menu. |
| U-39 | Help and feedback | Report problems and ideas. | Submit issue or idea with kind (problem, idea, question) and area picker. |
| U-40 | Profile and My Plan | Self-service account. | Edit profile and department, change password, view token meter on My Plan (other plan content is placeholder). |
| U-41 | Region and theme | Personal display settings. | Light or dark theme persisted in the browser; Region menu (language English only, currency, time zone) stored locally. |

### 4.5 Additional user features

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| U-42 | Project status | Each project carries a lifecycle state. | Status is Active (default), On hold or Archived; changed from the project's Edit dialog. |
| U-43 | Saved questionnaires | Reuse requirement Q&A across runs. | Questionnaire answers can be saved and added to later runs as an input, with suggested-answer help while answering. |
| U-44 | Browser notifications | Alerts outside the app. | Each notification event can be switched on or off separately for the in-app bell, email and browser notifications. |
| U-45 | Project tabs | A project's own workspace. | Artefacts tab (documents, suites, scripts, results) and Reviews / Approvals tab scoped to the project; runs are filed under it. |
| U-46 | Local time display | Dates in your own time zone. | Run start times and request dates are shown in the user's region time zone, and the page states which one. |
| U-47 | Main Req and For Context roles | Control how an input is used. | Each input on a run is either the main requirement source or supporting context only; criteria that appear only in context documents are not kept as acceptance criteria. |
| U-48 | Legal links | Terms and privacy. | Privacy and terms links are available from the application shell. |

## 5. Platform roles and shared system features

Platform Admin and System Admin hold every permission across every tenant. They reach a separate surface at `/admin` (plus Client 360, User 360 and Subscriptions) that tenant users never see. Everything a tenant Admin does can also be done by them on behalf of any client.

| ID | Feature | Description | Functionality |
| --- | --- | --- | --- |
| P-01 | Clients (tenants) | Create and manage customer workspaces. | List, create, view, edit tenants; set the tenant admin role; platform pages Client 360 and Subscriptions. |
| P-02 | Platform Users and Roles | Cross-tenant people and access. | List and manage users across all tenants, edit custom roles, switch acting role (every switch lands on the new tier's Dashboard). |
| P-03 | Cross-tenant User Activity | Platform-wide activity and audit. | Per-user timeline across tenants, audit log, security page and token history. |
| P-04 | Integrations summary and Document store | Client-by-integration matrix and file-system mappings. | One row per client with Jira, Confluence, Zephyr Scale, Entra ID and Document store status; create, edit and test SeaweedFS file-system mappings including Tailscale tunnel reachability and a write-key test. |
| P-05 | Platform observability | Health and diagnostics. | Health page, test-case observability, platform log search (platform-only, spans every tenant), error log, Tokens Monitor across tenants, Grafana, Prometheus, Loki and Tempo dashboards. |
| P-06 | Reports | Platform-level reporting from the admin surface. | Admin reports page. |

### Shared system capabilities used by every role

| ID | Capability | Description |
| --- | --- | --- |
| S-01 | Authentication and sessions | Login, signup, forgot, reset and set-password flows; signed session cookie carrying capability keys; session revoke by Admin. |
| S-02 | Role-based access control | Permission catalogue with stable bit indexes, cached bitmask resolution, capability keys for the UI, route gating at the edge and per-route permission gates in Go. |
| S-03 | Tenant isolation | Every API carries an explicit tenant check, because database row-level security is a no-op under the superuser connection. |
| S-04 | Run orchestration | Temporal workflows coordinate requirements analysis, scenario and test case generation, script generation and execution, with liveness judged by events rather than timeouts. |
| S-05 | Live progress | Server-sent events stream generation progress to the browser; a WebSocket carries execution video. |
| S-06 | Notifications pipeline | Kafka events fan out to the bell and email, filtered by each user's preferences. |
| S-07 | Token metering | Every LLM, embedding and vision call is metered into a per-tenant ledger that drives allowances, usage dashboards and top-ups. |
| S-08 | User activity log | Sign-in and run lifecycle events with geo and device enrichment feed the activity views. |
| S-09 | Universal search and destination registry | Role-aware destinations for Adapto and navigation; the top-bar search field was removed. |

## 6. Non-functional requirements and architecture

### 6.1 Services

| Service | Stack | Responsibility |
| --- | --- | --- |
| `apps/experience` | Next.js 16, TypeScript, Mantine 9 (migrating from Ant Design) | Web UI: run wizard, projects, inbox, Administration, platform admin. |
| `apps/orchestration` | Go, chi, GORM, Postgres | Backend-for-frontend: auth, RBAC, tenants and users, sessions and jobs, Jira and Confluence clients, Temporal triggering, Swagger REST API, notifications. |
| `apps/core` | Python, FastAPI and gRPC | AI system of record: ingestion, requirements analysis, scenario and test case generation, crawl, script generation, execution, exports. Provider-agnostic model tiers. |
| `apps/adapto` | Python, FastAPI | In-app assistant with its own schema, RAG knowledge base and live run lookups through the Go API. |
| `apps/engine` | Rust | Execution engine stub, no tests yet. |
| `apps/telemetry` | Go | Stub Kafka consumer draining browser telemetry into the OTel log pipeline. |
| Infra | Postgres, Temporal, Kafka, SeaweedFS, Ollama, Grafana, Loki, Tempo, Prometheus, OTel Collector | State, workflows, events, document bytes, local embeddings, observability. |

### 6.2 Non-functional requirements observed in the repository

| Area | Requirement | How it is met |
| --- | --- | --- |
| Security | A tenant must never read another tenant's data. | Explicit tenant check on every API, per-route permission gate, no-self-enumeration of permissions, X-Admin-Key refused for credential changes. |
| Security | Uploaded files and dependencies are scanned. | Upload malware scan, Gitleaks, Trivy, Go vulnerability check and dependency-update workflows. |
| Privacy | Client artefacts are not retained by pipeline helpers. | Jira and Confluence reads are live; image descriptions cached in memory for 6 hours only; crawl passwords never stored. |
| Reliability | Healthy long runs must not be aborted by a fixed deadline. | Liveness is judged by emitted events, not wall-clock timeouts; Temporal worker reliability work. |
| Quality | Generated output must stay faithful to the source. | Versioned prompts (RQA v7, scenario v4, generation v8 default), fidelity rules, eval harness as release gate, deterministic backstops. |
| Cost control | Token spend is bounded and visible. | Per-tenant allowance, token-budget gate at run start, ledger for chat, embeddings, vision and execution. |
| Observability | Operators can see health and trace failures. | OpenTelemetry traces, metrics and logs; platform health and error log pages. |
| Usability | Consistent light and dark UI. | Mantine design contract, design-check lint ratchet, both themes verified. |
| Test coverage | Each layer carries its own automated tests. | Go, Python and frontend suites run per layer; CI builds and deploys the images. |

### 6.3 Out of scope and planned items

| Item | State |
| --- | --- |
| Selenium and REST Assured script generation | Shown as Coming soon. |
| Upload Test Results rail step | Hidden placeholder; no screen. |
| Push to Jira | Switched off; Zephyr push works. |
| My Plan | Only organisation name and token meter are live. |
| `/settings`, `/tcg/documents`, `/tcg/common-documents`, `/tcg/history` | Unlinked from navigation. |
| Execute Scripts | Runs one case at a time in a single browser. |
| Usage metering of Jira and Confluence image reads | Planned. |
| Rust engine and telemetry consumer | Stubs. |

## 7. Delivery history by sprint window

The repository carries no explicit sprint markers. Work flows from feature and bug branches into `dev` through numbered pull requests (about 990 by 25 Oct), with ticket IDs such as TCG-110 and ADO-3568 in branch names. The windows below are two-week blocks derived from merged pull-request dates and branch names.

| Window | Delivered features (branch themes) | Roles served |
| --- | --- | --- |
| 3 to 16 Aug | Users admin, org structure, speech input, work-items UI, notifications UI, reports and exports | Admin, User |
| 17 to 30 Aug | Token usage and meter, platform observability health, plans and pricing, report-issue, Adapto fixes, cross-tenant authorization fix | User, Admin, Platform |
| 31 Aug to 13 Sep | Jira UI and import, roles catalogue, workflow setup, compare docs, projects, crawl-the-application phase 1, display time zones, SeaweedFS client integration, My Tasks, Confluence integration, ADO feedback integration | Admin, User |
| 14 to 27 Sep | New projects page, execute-scripts live video, browser notifications, new sidebar, Administration redesign, What next menu, CI security scanning and upload malware scan, tenant authz and XSS fixes, My Inbox | Admin, User, Platform |
| 28 Sep to 11 Oct | Help and feedback, requirement inputs rebuild fixes, Temporal worker reliability, CI/CD automation, query optimisation, clients screen | Admin, User, Platform |
| 12 to 25 Oct | Departments, assumptions review, accepted-fix linking and coverage backstops, CI/CD UI, typed-text requirement input, pictures in requirements, scenario test-type selection, baseline search, runs filter dropdowns, directory trusted domains, Project Config with Zephyr needs-attention flag, test case template, UX improvements, security fixes | Admin, User |
