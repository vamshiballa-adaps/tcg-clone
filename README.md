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
| `src/app/(auth)/…` | Login, signup, forgot/reset/set password (no shell). |
| `src/components/shell/` | App shell, sidebar (filtered by role), theme toggle. |
| `src/components/PagePlaceholder.tsx` | Temporary page body listing the catalogue features still to build. |
| `src/lib/role.ts` | Tenant roles + `canAccess`. `NEXT_PUBLIC_DEV_ROLE=admin\|user` fakes the role until real auth (S-01) lands. |
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

## Not included yet (by design)

Auth/session, real RBAC capabilities, API integration, data fetching/state library, tests, CI, and the platform
`/admin` surface (P-xx). Add these as their features come up.
