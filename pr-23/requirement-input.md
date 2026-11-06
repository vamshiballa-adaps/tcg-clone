# Change requirement input — PR #23: Switch the TCG CI/CD trigger workflow to run 1 (project 28)

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/23
- **Author:** Bhargav-85
- **Branch:** `chore/tcg-cicd-run-1` → `main`
- **Compared:** `e404461a9afa`...`e1c51337580f`
- **Generated:** 2026-11-06T09:44:43.401Z (event: pull_request/opened)

## Description

## What

Switches the GitHub Actions workflow that triggers TCG from **run 40** (its CI/CD page `/cicd-automation/20`) to **run 1**, named "cicd test" (its CI/CD page `/cicd-automation/28`). It is TCG's generated RUN-1 file. No page, label, message or behaviour of the app changes; only CI configuration and its documentation.

- **File:** `.github/workflows/tcg-cicd-automation-run-40.yml` is renamed to `.github/workflows/tcg-cicd-automation-run-1.yml`. Only one TCG trigger file stays in `.github/workflows/`: two would both fire on every merge, each against its own run.
- **What differs from the run 40 file** (checked line by line against it): `run_number` is 1, the token secret is `TCG_CICD_TOKEN_RUN_1`, the workflow name is "TCG CI/CD Automation Testing (RUN-1)", and the error message for an unresolved selector points to `http://localhost:3000/cicd-automation/28`. Nothing else in the file changes.
- **Unchanged:** the triggers (a pull request closed with `merged == true`, and manual dispatch), the endpoint secret `TCG_CICD_ENDPOINT_URL`, the request body fields (`run_number`, `commit_sha`, `branch`, `pr_number`, `pr_title`, `pr_description`, `git_diff`, `trigger_reason`, `client`), and the `Idempotency-Key` and `X-TCG-CICD-Token` headers.
- **Kept from the repo's earlier edits, as TCG's file does not have them:** the header comment about the public tunnel URL, and the `clean` step at the top of the trigger script that strips stray whitespace from both secrets.
- **Docs:** the "TCG CI/CD trigger workflow" section of `CLAUDE.md` now describes run 1 and says the `TCG_CICD_TOKEN_RUN_40` secret is no longer used.
- `pr-requirement-input.yml` is not touched.

## Why this is useful for TCG

A merge after this PR is posted to run 1 of its project instead of run 40 of the old one, so this is the switch of the CI/CD loop to the new project. This diff changes no screen and no behaviour of the app, so TCG's test selector should find nothing test-relevant in it (a "skipped" or a "fallback pending" outcome is possible, not a failure of the file itself).

## Before merging

Add the repository secret `TCG_CICD_TOKEN_RUN_1` (Settings, Secrets and variables, Actions) with the trigger token from run 1's CI/CD settings. Merging this PR is itself a PR close, so the workflow runs for it and fails at "Trigger TCG re-execution" if that secret is missing. `TCG_CICD_ENDPOINT_URL` keeps its name and must hold the live public tunnel address, so the tunnel and the local TCG have to be running at that moment. Project 28 must also have the GitHub Actions method enabled in its CI/CD settings and an earlier Execute Scripts run or crawl against a URL the local TCG can reach.

## Merge safety

Branched from the current `main` (`e404461`). No merge conflicts with `main`, and none with the other open PRs (#20 `feature/guide`, #21 `feature/compare-docs`, #22 `feature/team-activity`), checked with `git merge-tree` against each. The `CLAUDE.md` change stays inside the "TCG CI/CD trigger workflow" section, which none of them touches.

## Checked

- The workflow file parses as YAML (js-yaml) and the `run:` script of the trigger step passes `bash -n`.
- The `clean` helper returns the bare URL for a value with a trailing space and newline, and an empty string for an empty value.
- The file contains no leftover `40`, `RUN_40` or `/cicd-automation/20`.
- Not checked: the workflow has not run on GitHub, and project 28's CI/CD settings and its target URL were not verified from here.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Files changed (2, +24 / -22)

| Status | File | Lines |
| --- | --- | --- |
| R | .github/workflows/tcg-cicd-automation-run-40.yml → .github/workflows/tcg-cicd-automation-run-1.yml | +9 / -9 |
| M | CLAUDE.md | +15 / -13 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/.github/workflows/tcg-cicd-automation-run-40.yml b/.github/workflows/tcg-cicd-automation-run-1.yml
similarity index 94%
rename from .github/workflows/tcg-cicd-automation-run-40.yml
rename to .github/workflows/tcg-cicd-automation-run-1.yml
index 8351c94..91b73c6 100644
--- a/.github/workflows/tcg-cicd-automation-run-40.yml
+++ b/.github/workflows/tcg-cicd-automation-run-1.yml
@@ -1,17 +1,17 @@
-# This workflow targets the TCG running on the developer's own PC (run 40; its CI/CD page is /cicd-automation/20),
-# reached through a tunnel. The repository secrets TCG_CICD_TOKEN_RUN_40 and TCG_CICD_ENDPOINT_URL hold that run's token
+# This workflow targets the TCG running on the developer's own PC (run 1; its CI/CD page is /cicd-automation/28),
+# reached through a tunnel. The repository secrets TCG_CICD_TOKEN_RUN_1 and TCG_CICD_ENDPOINT_URL hold that run's token
 # and the PUBLIC tunnel URL, for example https://<random>.trycloudflare.com/api/v1/tcg/cicd/trigger. It must not be
 # http://localhost:3000/...: this job runs on a GitHub-hosted runner, where "localhost" is the runner itself, not the
 # developer's PC, so curl fails with "Failed to connect to localhost port 3000". Quick tunnels get a new URL each time
 # they restart, so update the TCG_CICD_ENDPOINT_URL secret when that happens, and keep the tunnel and the local TCG
 # running when a PR merges.
-# This is TCG's generated file for run 40 with one change: a "clean" step at the top of the trigger script that strips
+# This is TCG's generated file for run 1 with one change: a "clean" step at the top of the trigger script that strips
 # stray whitespace from both secrets (see the comment there). Never put the token or the endpoint URL in this file.
 #
 # CI/CD Automation Testing — generated by TCG (testcasegen.ai),
 # powered by Adaps (adaps.com).
 #
-# THIS FILE IS FOR RUN-40 (testing cicd) ONLY. Every full run has its own pipeline file and its own
+# THIS FILE IS FOR RUN-1 (cicd test) ONLY. Every full run has its own pipeline file and its own
 # trigger token: a pull request merged in the repository this file runs in becomes a
 # NEW RUN in TCG, an incremental run built on top of this one. Do not use this file
 # with another run's token, or another run's file with this one's.
@@ -26,7 +26,7 @@
 # Save TWO repository secrets before this runs (Settings -> Secrets and
 # variables -> Actions -> New repository secret) — values for both are
 # shown on this project's own CI/CD settings screen:
-#   TCG_CICD_TOKEN_RUN_40   the trigger token from this project's CI/CD settings
+#   TCG_CICD_TOKEN_RUN_1   the trigger token from this project's CI/CD settings
 #   TCG_CICD_ENDPOINT_URL   TCG's own trigger endpoint, copied from this project's CI/CD
 #                    settings — kept as a secret, not a literal in this file,
 #                    so a fork/PR diff of this workflow never has to show it
@@ -34,7 +34,7 @@
 # Which of the triggers below are present is controlled by this project's
 # own CI/CD settings (the "Trigger types" section) — re-download this file
 # after changing that picker to pick up the change.
-name: TCG CI/CD Automation Testing (RUN-40)
+name: TCG CI/CD Automation Testing (RUN-1)
 
 on:
   # Fires once a PR is merged into the default branch.
@@ -72,7 +72,7 @@ jobs:
 
       - name: Trigger TCG re-execution
         env:
-          TCG_CICD_TOKEN: ${{ secrets.TCG_CICD_TOKEN_RUN_40 }}
+          TCG_CICD_TOKEN: ${{ secrets.TCG_CICD_TOKEN_RUN_1 }}
           TCG_CICD_ENDPOINT_URL: ${{ secrets.TCG_CICD_ENDPOINT_URL }}
           # Read as env vars, NEVER interpolated directly into this script —
           # a PR's title/description are attacker-controlled on any repo
@@ -116,7 +116,7 @@ jobs:
             --arg sha "${{ steps.diff.outputs.commit_sha }}" \
             --arg branch "${{ steps.diff.outputs.branch }}" \
             --argjson pr '${{ github.event.pull_request.number || 0 }}' \
-            --argjson run_number 40 \
+            --argjson run_number 1 \
             --arg reason "${{ github.event_name == 'pull_request' && 'pr_merge' || (github.event_name == 'schedule' && 'scheduled' || 'manual') }}" \
             '{
               run_number: $run_number,
@@ -190,7 +190,7 @@ jobs:
             # step loudly (rather than a silent 202) so it shows up as a red
             # run in the Actions tab, with a direct pointer to the manual
             # resolve action instead of leaving the diff untested unnoticed.
-            echo "::error::TCG CI/CD Automation Testing did not run any tests for this change (reason: ${REASON:-selector could not confidently narrow this diff}). Open the TCG app at http://localhost:3000/cicd-automation/20 and click \"Run full suite\" in the On Demand section of the trigger history to manually run the full test suite, or turn on \"Run full suite if no test-relevant files changed\" in this project's CI/CD settings to do this automatically next time."
+            echo "::error::TCG CI/CD Automation Testing did not run any tests for this change (reason: ${REASON:-selector could not confidently narrow this diff}). Open the TCG app at http://localhost:3000/cicd-automation/28 and click \"Run full suite\" in the On Demand section of the trigger history to manually run the full test suite, or turn on \"Run full suite if no test-relevant files changed\" in this project's CI/CD settings to do this automatically next time."
             exit 1
           elif [ "$STATUS" = "skipped" ]; then
             echo "::notice::TCG found nothing test-relevant in this diff (reason: ${REASON:-no relevant files changed}) — no execution was started."
diff --git a/CLAUDE.md b/CLAUDE.md
index f60802d..b522223 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -324,17 +324,19 @@ in `README.md`.
 
 ## TCG CI/CD trigger workflow (local TCG, through a tunnel)
 
-`.github/workflows/tcg-cicd-automation-run-40.yml` is TCG's generated GitHub Actions workflow for **run 40** of the
-**local** TCG (its CI/CD page is `/cicd-automation/20`). It fires when a PR merges into `main` (and on manual dispatch) and
-posts the diff to TCG's trigger endpoint, from a GitHub-hosted runner (`ubuntu-latest`). The body carries
-`run_number: 40`. Its repository secrets are `TCG_CICD_TOKEN_RUN_40` and `TCG_CICD_ENDPOINT_URL`.
-
-- **One file and one token per run.** TCG's file says it is for run 40 only: a PR merged here becomes a new, incremental
-  run built on run 40, so a later run gets its own file and its own `TCG_CICD_TOKEN_RUN_<n>` secret. Never use one run's
-  file with another run's token. This file replaced `tcg-cicd-automation.yml`, which read a plain `TCG_CICD_TOKEN` (no
-  run number, local project 16); that secret is no longer used and can be deleted in GitHub. Before that the connection
-  was stage (project 546, `https://adaps.net/cicd-automation/546`), whose values were overwritten and cannot be shown
-  again by GitHub, so they must be copied from TCG to bring stage back.
+`.github/workflows/tcg-cicd-automation-run-1.yml` is TCG's generated GitHub Actions workflow for **run 1** (named "cicd
+test") of the **local** TCG (its CI/CD page is `/cicd-automation/28`). It fires when a PR merges into `main` (and on
+manual dispatch) and posts the diff to TCG's trigger endpoint, from a GitHub-hosted runner (`ubuntu-latest`). The body
+carries `run_number: 1`. Its repository secrets are `TCG_CICD_TOKEN_RUN_1` and `TCG_CICD_ENDPOINT_URL`.
+
+- **One file and one token per run.** TCG's file says it is for run 1 only: a PR merged here becomes a new, incremental
+  run built on run 1, so a later run gets its own file and its own `TCG_CICD_TOKEN_RUN_<n>` secret. Never use one run's
+  file with another run's token. Keep only one such file in `.github/workflows/`: two would both fire on every merge,
+  each against its own run. This file replaced `tcg-cicd-automation-run-40.yml` (run 40 of "testing cicd", CI/CD page
+  `/cicd-automation/20`), so the `TCG_CICD_TOKEN_RUN_40` secret is no longer used and can be deleted in GitHub. Before
+  that came `tcg-cicd-automation.yml`, which read a plain `TCG_CICD_TOKEN` (no run number, local project 16; also unused
+  now), and before that the connection was stage (project 546, `https://adaps.net/cicd-automation/546`), whose values
+  were overwritten and cannot be shown again by GitHub, so they must be copied from TCG to bring stage back.
 
 - **The endpoint secret must be a public URL, never `http://localhost:3000/...`.** The job runs on GitHub's computer, where
   `localhost` is that computer, not the developer's PC, so curl fails with "Failed to connect to localhost port 3000".
@@ -348,14 +350,14 @@ posts the diff to TCG's trigger endpoint, from a GitHub-hosted runner (`ubuntu-l
   whitespace from both secrets. A secret pasted with a trailing newline or space made curl fail with "(3) URL rejected:
   Malformed input to a URL function" (the value looked right in GitHub's editor; the caret sat on a second line). If TCG
   regenerates its file, re-apply it, and the header comment about the tunnel. An earlier version also changed the project
-  link in the last error message (stage's 546 to the local 16); the run 40 file already names the local TCG. PR #9 had
+  link in the last error message (stage's 546 to the local 16); the run 1 file already names the local TCG. PR #9 had
   moved the job to a self-hosted runner on the PC instead, which `localhost` would work from, but it needs a runner
   registered and online on that PC (the job sat queued with none), plus `jq` and a fork-approval setting; the tunnel
   avoids all of that.
 - A run goes red at "Trigger TCG re-execution" when a secret is missing (a missing token shows up as TCG rejecting the
   request), when TCG answers 403 (the GitHub Actions method is not enabled in that project's CI/CD settings), or when TCG
   cannot be reached. Token and endpoint values live only in Settings, Secrets and variables, Actions; never in the repo or
-  in anything that gets committed. Add `TCG_CICD_TOKEN_RUN_40` before merging the PR that brings this file in: that merge
+  in anything that gets committed. Add `TCG_CICD_TOKEN_RUN_1` before merging the PR that brings this file in: that merge
   is itself a PR close, so the workflow runs for it.
 - The local TCG picks the deployed URL to test from the project's last Execute Scripts run or crawl, so that target must
   be a URL the local TCG can reach.
```
