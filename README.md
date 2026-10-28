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
| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). Only login is built (mock). |
| `src/app/api/auth/…`, `src/lib/auth/`, `src/proxy.ts` | Mock sign-in: login/logout/session endpoints, the signed session cookie, route gating. See "Sign in (mock auth)". |
| `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle, who's signed in. |
| `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
| `src/lib/role.ts` | Tenant roles + `canAccess`. Signed out, `NEXT_PUBLIC_DEV_ROLE=admin\|user` is the role; signed in, the account's role wins. |
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

Other outcomes: "Enter your email address.", "Enter a valid email address.", "Enter your password.", and "Invalid email
or password." for a wrong password or unknown email. A successful sign-in always lands on the Dashboard (A-24). The
header then shows the person's name, role and **Sign out**; the sidebar follows their role.

- **Session:** a signed, httpOnly cookie (`tcg_session`, 8 hours). The UI asks `/api/auth/session`; pages and layouts
  never read the cookie, so they stay prerendered.
- **Gating (`src/proxy.ts`):** a signed-in role too low for a page sees "Access denied" at that URL (status 200); a
  signed-in person opening `/login` goes to the Dashboard.
- **Settings** (`.env.example`): `AUTH_REQUIRED=true` redirects signed-out visitors to `/login`. It is a runtime setting
  (no rebuild) and off by default, so the app stays open. `AUTH_SECRET` signs the cookie; set a long random value on
  any deployed copy.
- **Not secure:** the passwords are printed on the sign-in screen. Don't put real data behind it.

## PR diff → requirement input

[`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
(description, file table, diff; lockfile diffs omitted, diff capped at 400k chars) via
[`.github/scripts/build-requirement-input.mjs`](./.github/scripts/build-requirement-input.mjs). It runs in two cases:

| Trigger | Diff recorded | Folder |
| --- | --- | --- |
| PR opened, reopened, new commits, ready for review | the PR's own diff (merge base...head) | `pr-<n>/`, overwritten on each push to the PR |
| **Anything lands on `main`**: merged PR (merge, squash or rebase) or a direct push | the push's diff (before..after), with the commit list and, when GitHub can name it, the PR behind it | `merged/<sha12>/`, one per push, never overwritten |

Each record is delivered to:

| Destination | When | Where |
| --- | --- | --- |
| Workflow artifact | always | `requirement-input-pr-<n>` or `requirement-input-merged-<sha12>` on the run (30 days) |
| `requirements-inbox` branch | pushes, and PRs from this repo (fork PRs get a read-only token) | the folder above, as `requirement-input.md` and `.json` |
| Webhook | repo secret `REQUIREMENTS_WEBHOOK_URL` is set | `POST` of the `.json` body; optional `REQUIREMENTS_WEBHOOK_TOKEN` is sent as `Authorization: Bearer` |

The `.json` shape is `{ source, description, stats, commits[], files[], diff, diff_truncated }`. `source.merged` is
`true` for a record made when a change landed on `main` and `false` for a PR-time draft, so a consumer that only wants
merged changes can filter on it (or delete the `pull_request:` trigger from the workflow). Point the webhook at
whatever ingests requirements (e.g. the Inputs Registry API once it exists) and the branch/artifact keep working as a
fallback.

## Not included yet (by design)

Real auth/session (a user store, signup and password flows, the BFF's session cookie; sign-in above is a mock), real
RBAC capabilities, API integration, data fetching/state library, tests, build/lint CI, and the platform
`/admin` surface (P-xx). Add these as their features come up.
