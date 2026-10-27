# Change requirement input — PR #1: Test/requirement input smoke

- **Repository:** vamshiballa-adaps/tcg-clone
- **Pull request:** https://github.com/vamshiballa-adaps/tcg-clone/pull/1
- **Author:** Bhargav-85
- **Branch:** `test/requirement-input-smoke` → `main`
- **Compared:** `bdd971294485`...`293c4872ccdd`
- **Generated:** 2026-10-27T10:33:49.496Z (event: pull_request/opened)

## Description

_No description provided._

## Files changed (4, +521 / -1)

| Status | File | Lines |
| --- | --- | --- |
| A | .github/scripts/build-requirement-input.mjs | +288 / -0 |
| A | .github/workflows/pr-requirement-input.yml | +122 / -0 |
| A | CLAUDE.md | +82 / -0 |
| M | README.md | +29 / -1 |

## Diff

> Lockfile diffs (package-lock.json, yarn.lock, pnpm-lock.yaml) are omitted; they still appear in the file table.

```diff
diff --git a/.github/scripts/build-requirement-input.mjs b/.github/scripts/build-requirement-input.mjs
new file mode 100644
index 0000000..2c6ea61
--- /dev/null
+++ b/.github/scripts/build-requirement-input.mjs
@@ -0,0 +1,288 @@
+// Turns a GitHub event into a "requirement input": a markdown document (human/TCG-readable)
+// and a JSON document (machine-readable) describing what the change does.
+//
+// Two kinds of event are understood:
+//   pull_request - a PR was opened/updated: the PR's own diff (merge-base...head)
+//   push         - something landed on a branch (a merged PR, a squash/rebase merge, a direct push):
+//                  the diff of the push (before..after), plus the PR behind it when GitHub can name one
+//
+// PR metadata is read from the event payload (GITHUB_EVENT_PATH) rather than from interpolated
+// workflow expressions, so attacker-controlled text (title, body) never touches a shell.
+//
+// Env: GITHUB_EVENT_PATH (required), GITHUB_EVENT_NAME, OUT_DIR (default "requirement-input"),
+//      MAX_DIFF_CHARS (default 400000), GITHUB_REPOSITORY (optional, falls back to the payload),
+//      GITHUB_TOKEN (optional, push events only: used to look up the merged PR),
+//      GITHUB_API_URL (default https://api.github.com), GITHUB_OUTPUT (set by Actions).
+// Outputs (to $GITHUB_OUTPUT when set): folder (e.g. "pr-7" or "merged/ab12cd34ef56"), slug (folder with "-").
+
+import { execFileSync } from "node:child_process";
+import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
+import { join } from "node:path";
+
+const OUT_DIR = process.env.OUT_DIR || "requirement-input";
+const MAX_DIFF_CHARS = Number(process.env.MAX_DIFF_CHARS) || 400_000;
+const MAX_COMMITS = 100;
+
+// Lockfiles are listed in the file table but their diff is noise for a requirement reader.
+const DIFF_EXCLUDES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];
+
+// git's well-known empty tree: the "before" of a first push or an unreachable force-push base.
+const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
+
+const git = (...args) =>
+  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
+const tryGit = (...args) => {
+  try {
+    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
+  } catch {
+    return null;
+  }
+};
+
+const eventPath = process.env.GITHUB_EVENT_PATH;
+if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set");
+const event = JSON.parse(readFileSync(eventPath, "utf8"));
+const eventName = process.env.GITHUB_EVENT_NAME || (event.pull_request ? "pull_request" : "push");
+const repo = process.env.GITHUB_REPOSITORY || event.repository?.full_name || "";
+
+/** The PR GitHub associates with a commit on a branch, if any (best effort, never fatal). */
+async function findPrForCommit(sha) {
+  const token = process.env.GITHUB_TOKEN;
+  if (!token || !repo) return null;
+  const api = process.env.GITHUB_API_URL || "https://api.github.com";
+  try {
+    const res = await fetch(`${api}/repos/${repo}/commits/${sha}/pulls`, {
+      headers: {
+        Authorization: `Bearer ${token}`,
+        Accept: "application/vnd.github+json",
+        "X-GitHub-Api-Version": "2022-11-28",
+      },
+      signal: AbortSignal.timeout(10_000),
+    });
+    if (!res.ok) {
+      console.warn(`PR lookup for ${sha.slice(0, 12)} returned ${res.status}; continuing without it.`);
+      return null;
+    }
+    const prs = await res.json();
+    if (!Array.isArray(prs) || !prs.length) return null;
+    return prs.find((p) => p.merge_commit_sha === sha) ?? prs.find((p) => p.merged_at) ?? prs[0];
+  } catch (err) {
+    console.warn(`PR lookup failed (${err.message}); continuing without it.`);
+    return null;
+  }
+}
+
+/** Everything that differs between the two event kinds, behind one shape. */
+async function buildContext() {
+  if (eventName === "pull_request") {
+    const pr = event.pull_request;
+    if (!pr) throw new Error("Event payload has no pull_request");
+    return {
+      kind: "pr",
+      merged: false,
+      pr,
+      baseSha: pr.base.sha,
+      headSha: pr.head.sha,
+      baseRef: pr.base.ref,
+      headRef: pr.head.ref,
+      diffArgs: [`${pr.base.sha}...${pr.head.sha}`],
+      folder: `pr-${pr.number}`,
+      slug: `pr-${pr.number}`,
+      title: pr.title,
+      author: pr.user?.login ?? "",
+      description: (pr.body ?? "").trim(),
+      commits: [],
+    };
+  }
+
+  if (eventName !== "push") throw new Error(`Unsupported event: ${eventName}`);
+
+  const headSha = event.after || process.env.GITHUB_SHA;
+  if (!headSha) throw new Error("Push event has no head commit");
+  let baseSha = event.before;
+  // New branch (all zeros) or a force-push whose old tip is gone: fall back to the first parent.
+  if (!baseSha || /^0+$/.test(baseSha) || tryGit("cat-file", "-e", `${baseSha}^{commit}`) === null) {
+    baseSha = tryGit("rev-parse", "--verify", "-q", `${headSha}^`) ?? EMPTY_TREE;
+  }
+
+  const range = baseSha === EMPTY_TREE ? [headSha] : [`${baseSha}..${headSha}`];
+  const commits = git("log", `-n${MAX_COMMITS}`, "--format=%H%x1f%an%x1f%s%x1e", ...range)
+    .split("\x1e")
+    .map((r) => r.trim())
+    .filter(Boolean)
+    .map((r) => {
+      const [sha, author, subject] = r.split("\x1f");
+      return { sha, author, subject };
+    });
+  const head = commits[0] ?? { author: "", subject: headSha.slice(0, 12) };
+  const pr = await findPrForCommit(headSha);
+
+  return {
+    kind: "merge",
+    merged: true,
+    pr,
+    baseSha,
+    headSha,
+    baseRef: (event.ref ?? "").replace(/^refs\/heads\//, ""),
+    headRef: pr?.head?.ref ?? null,
+    diffArgs: [baseSha, headSha],
+    folder: `merged/${headSha.slice(0, 12)}`,
+    slug: `merged-${headSha.slice(0, 12)}`,
+    title: pr?.title ?? head.subject,
+    author: pr?.user?.login ?? head.author,
+    description: (pr?.body ?? tryGit("log", "-1", "--format=%b", headSha) ?? "").trim(),
+    commits,
+  };
+}
+
+const ctx = await buildContext();
+
+/** name-status -z: `M\0path\0` or `R100\0old\0new\0`. */
+function parseNameStatus(raw) {
+  const t = raw.split("\0");
+  const out = [];
+  for (let i = 0; i < t.length && t[i]; ) {
+    const status = t[i];
+    if (status[0] === "R" || status[0] === "C") {
+      out.push({ status: status[0], path: t[i + 2], oldPath: t[i + 1] });
+      i += 3;
+    } else {
+      out.push({ status: status[0], path: t[i + 1] });
+      i += 2;
+    }
+  }
+  return out;
+}
+
+/** numstat -z: `1\t2\tpath\0` or, for renames, `1\t2\t\0old\0new\0`. Binary files report `-`. */
+function parseNumstat(raw) {
+  const t = raw.split("\0");
+  const out = new Map();
+  for (let i = 0; i < t.length && t[i]; ) {
+    const [add, del, p] = t[i].split("\t");
+    const path = p === "" ? t[i + 2] : p;
+    i += p === "" ? 3 : 1;
+    const binary = add === "-";
+    out.set(path, { additions: binary ? 0 : Number(add), deletions: binary ? 0 : Number(del), binary });
+  }
+  return out;
+}
+
+const nameStatus = parseNameStatus(git("diff", "-M", "-z", "--name-status", ...ctx.diffArgs));
+const numstat = parseNumstat(git("diff", "-M", "-z", "--numstat", ...ctx.diffArgs));
+const files = nameStatus.map((f) => ({
+  ...f,
+  ...(numstat.get(f.path) ?? { additions: 0, deletions: 0, binary: false }),
+}));
+const totals = files.reduce(
+  (s, f) => ({ additions: s.additions + f.additions, deletions: s.deletions + f.deletions }),
+  { additions: 0, deletions: 0 },
+);
+
+let diff = git(
+  "diff", "-M", "--no-color", ...ctx.diffArgs, "--", ".",
+  ...DIFF_EXCLUDES.map((p) => `:(exclude)${p}`),
+);
+const fullDiffChars = diff.length;
+const diffTruncated = fullDiffChars > MAX_DIFF_CHARS;
+if (diffTruncated) diff = diff.slice(0, MAX_DIFF_CHARS);
+
+const source = {
+  repository: repo,
+  event_name: eventName,
+  event_action: event.action ?? "",
+  merged: ctx.merged,
+  pr_number: ctx.pr?.number ?? null,
+  pr_url: ctx.pr?.html_url ?? null,
+  title: ctx.title,
+  author: ctx.author,
+  base_ref: ctx.baseRef,
+  head_ref: ctx.headRef,
+  base_sha: ctx.baseSha,
+  head_sha: ctx.headSha,
+  generated_at: new Date().toISOString(),
+};
+
+// A fence longer than any backtick run inside the diff keeps the block from closing early.
+const longestTicks = Math.max(0, ...(diff.match(/`+/g) ?? []).map((m) => m.length));
+const fence = "`".repeat(Math.max(3, longestTicks + 1));
+
+const escapeCell = (s) => s.replace(/\|/g, "\\|");
+const fileRows = files.map((f) => {
+  const name = f.oldPath ? `${escapeCell(f.oldPath)} → ${escapeCell(f.path)}` : escapeCell(f.path);
+  const change = f.binary ? "binary" : `+${f.additions} / -${f.deletions}`;
+  return `| ${f.status} | ${name} | ${change} |`;
+});
+
+const heading =
+  ctx.kind === "pr"
+    ? `# Change requirement input — PR #${ctx.pr.number}: ${ctx.title}`
+    : `# Merged change requirement input — ${ctx.title}`;
+const compared =
+  ctx.baseSha === EMPTY_TREE ? `_(start of history)_...\`${ctx.headSha.slice(0, 12)}\`` : `\`${ctx.baseSha.slice(0, 12)}\`...\`${ctx.headSha.slice(0, 12)}\``;
+
+const md = [
+  heading,
+  "",
+  `- **Repository:** ${repo}`,
+  ...(ctx.pr ? [`- **Pull request:** ${ctx.pr.html_url}`] : []),
+  `- **Author:** ${ctx.author}`,
+  ctx.kind === "pr"
+    ? `- **Branch:** \`${ctx.headRef}\` → \`${ctx.baseRef}\``
+    : `- **Merged into:** \`${ctx.baseRef}\`${ctx.headRef ? ` (from \`${ctx.headRef}\`)` : ""}`,
+  `- **Compared:** ${compared}`,
+  `- **Generated:** ${source.generated_at} (event: ${eventName}${source.event_action ? `/${source.event_action}` : ""})`,
+  "",
+  "## Description",
+  "",
+  ctx.description || "_No description provided._",
+  "",
+  ...(ctx.commits.length
+    ? [
+        `## Commits (${ctx.commits.length})`,
+        "",
+        ...ctx.commits.map((c) => `- \`${c.sha.slice(0, 12)}\` ${c.subject} — ${c.author}`),
+        "",
+      ]
+    : []),
+  `## Files changed (${files.length}, +${totals.additions} / -${totals.deletions})`,
+  "",
+  ...(files.length
+    ? ["| Status | File | Lines |", "| --- | --- | --- |", ...fileRows]
+    : ["_No file changes._"]),
+  "",
+  "## Diff",
+  "",
+  ...(diffTruncated
+    ? [`> Diff truncated to ${MAX_DIFF_CHARS} of ${fullDiffChars} characters.`, ""]
+    : []),
+  `> Lockfile diffs (${DIFF_EXCLUDES.join(", ")}) are omitted; they still appear in the file table.`,
+  "",
+  `${fence}diff`,
+  diff.trimEnd(),
+  fence,
+  "",
+].join("\n");
+
+const json = {
+  source,
+  description: ctx.description,
+  stats: { files: files.length, ...totals },
+  commits: ctx.commits,
+  files,
+  diff,
+  diff_truncated: diffTruncated,
+};
+
+mkdirSync(OUT_DIR, { recursive: true });
+writeFileSync(join(OUT_DIR, "requirement-input.md"), md);
+writeFileSync(join(OUT_DIR, "requirement-input.json"), JSON.stringify(json, null, 2) + "\n");
+
+if (process.env.GITHUB_OUTPUT) {
+  appendFileSync(process.env.GITHUB_OUTPUT, `folder=${ctx.folder}\nslug=${ctx.slug}\n`);
+}
+
+console.log(
+  `${ctx.folder}: ${files.length} files, +${totals.additions} / -${totals.deletions}` +
+    `${diffTruncated ? " (diff truncated)" : ""} -> ${OUT_DIR}/`,
+);
diff --git a/.github/workflows/pr-requirement-input.yml b/.github/workflows/pr-requirement-input.yml
new file mode 100644
index 0000000..766ddb3
--- /dev/null
+++ b/.github/workflows/pr-requirement-input.yml
@@ -0,0 +1,122 @@
+name: PR / merge diff → requirement input
+
+# Records what a change does and hands it to the requirement input:
+#   - a PR is opened or updated            -> pr-<number>/
+#   - anything lands on main (merged PR, squash/rebase merge, direct push) -> merged/<sha12>/
+# Each record is delivered to:
+#   1. always: a workflow artifact + job summary
+#   2. same-repo PRs and pushes: committed to the `requirements-inbox` branch
+#   3. optional: POSTed to REQUIREMENTS_WEBHOOK_URL (repo secret) if set
+on:
+  pull_request:
+    types: [opened, reopened, synchronize, ready_for_review]
+  push:
+    branches: [main]
+
+permissions:
+  contents: write # push to the requirements-inbox branch
+  pull-requests: read # find the PR behind a merge commit
+
+concurrency:
+  group: requirement-input-${{ github.event.pull_request.number || github.sha }}
+  # A newer push to a PR supersedes the older run; never cancel a merge record.
+  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
+
+env:
+  INBOX_BRANCH: requirements-inbox
+
+jobs:
+  record:
+    runs-on: ubuntu-latest
+    timeout-minutes: 10
+    env:
+      REQUIREMENTS_WEBHOOK_URL: ${{ secrets.REQUIREMENTS_WEBHOOK_URL }}
+      REQUIREMENTS_WEBHOOK_TOKEN: ${{ secrets.REQUIREMENTS_WEBHOOK_TOKEN }}
+    steps:
+      - uses: actions/checkout@v4
+        with:
+          fetch-depth: 0 # the diff needs the merge base / the pushed range
+          persist-credentials: false
+
+      - name: Build requirement input from the diff
+        id: build
+        run: node .github/scripts/build-requirement-input.mjs
+        env:
+          OUT_DIR: ${{ runner.temp }}/requirement-input
+          GITHUB_TOKEN: ${{ github.token }}
+
+      - name: Upload as workflow artifact
+        uses: actions/upload-artifact@v4
+        with:
+          name: requirement-input-${{ steps.build.outputs.slug }}
+          path: ${{ runner.temp }}/requirement-input/
+          retention-days: 30
+
+      - name: Job summary
+        run: |
+          {
+            echo "### Requirement input recorded: ${{ steps.build.outputs.slug }}"
+            echo
+            echo "- Branch \`$INBOX_BRANCH\`, folder \`${{ steps.build.outputs.folder }}/\` (same-repo PRs and pushes only)"
+            echo "- Artifact \`requirement-input-${{ steps.build.outputs.slug }}\`"
+            [ -n "$REQUIREMENTS_WEBHOOK_URL" ] && echo "- Webhook delivery attempted"
+            true
+          } >> "$GITHUB_STEP_SUMMARY"
+
+      # Fork PRs only get a read-only token, so they skip the branch push (artifact still uploaded).
+      - name: Publish to requirements-inbox branch
+        if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository
+        env:
+          GH_TOKEN: ${{ github.token }}
+          FOLDER: ${{ steps.build.outputs.folder }}
+          SLUG: ${{ steps.build.outputs.slug }}
+          HEAD_SHA: ${{ github.event.pull_request.head.sha || github.sha }}
+          SRC_DIR: ${{ runner.temp }}/requirement-input
+        run: |
+          set -euo pipefail
+          inbox="$RUNNER_TEMP/inbox"
+          git init -q "$inbox"
+          cd "$inbox"
+          git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
+          git config user.name "github-actions[bot]"
+          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
+
+          for attempt in 1 2 3 4 5; do
+            if git fetch -q --depth 1 origin "$INBOX_BRANCH"; then
+              git checkout -q -B "$INBOX_BRANCH" FETCH_HEAD
+            else
+              git checkout -q --orphan "$INBOX_BRANCH"
+              git rm -rfq . 2>/dev/null || true
+            fi
+
+            mkdir -p "$FOLDER"
+            cp "$SRC_DIR/requirement-input.md" "$SRC_DIR/requirement-input.json" "$FOLDER/"
+            git add -A
+
+            if git diff --cached --quiet; then
+              echo "No change to ${FOLDER}; nothing to publish."
+              exit 0
+            fi
+
+            git commit -q -m "requirement input: ${SLUG} @ ${HEAD_SHA:0:12}"
+            if git push -q origin "HEAD:refs/heads/${INBOX_BRANCH}"; then
+              echo "Published ${FOLDER} to ${INBOX_BRANCH}."
+              exit 0
+            fi
+            echo "Push raced with another run (attempt ${attempt}); retrying."
+            sleep $((attempt * 2))
+            rm -rf "$FOLDER"
+          done
+          echo "Could not publish after retries." >&2
+          exit 1
+
+      - name: Send to webhook
+        if: env.REQUIREMENTS_WEBHOOK_URL != ''
+        run: |
+          set -euo pipefail
+          args=(-sS --fail-with-body --max-time 30 --retry 3 -X POST -H "Content-Type: application/json")
+          if [ -n "$REQUIREMENTS_WEBHOOK_TOKEN" ]; then
+            args+=(-H "Authorization: Bearer $REQUIREMENTS_WEBHOOK_TOKEN")
+          fi
+          curl "${args[@]}" --data-binary @"$RUNNER_TEMP/requirement-input/requirement-input.json" \
+            "$REQUIREMENTS_WEBHOOK_URL"
diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..a84571b
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,82 @@
+# tcg-clone: what this repo is for
+
+**This repo is the "application under test" for TCG.** TCG (Test Case Generation, part of AI Hub) turns requirements
+into test cases, then Playwright automation scripts, then runs them against a live web app. `tcg-clone` is that live web
+app. Treat it as a realistic app an automation tester has been handed, not a product with its own business goals. The
+point of the repo is to exercise and improve TCG's crawl, script-generation, script-execution and CI/CD features.
+
+The TCG backend (Go orchestration, Python core, the real AI Hub frontend) lives in a separate repo, `aihub`
+(`c:\Users\ChinthalapudiBhargav\aihub`). Work in this repo is front-end only; do not edit `aihub` from here.
+
+Today the pages are still `PagePlaceholder`s built from `TCG_BRD_Feature_Catalogue.md` (see `README.md` for layout). The
+user/admin role is faked at build time by `NEXT_PUBLIC_DEV_ROLE`; there is no real auth yet (S-01).
+
+## How each TCG feature touches this app
+
+1. **Crawl the application (U-05).** TCG is given a URL (plus optional login). Headless Chromium crawls it
+   breadth-first and reads each page's accessibility tree (ARIA roles and accessible names, not pixels). It follows only
+   links, tabs, menus and "tap to open" style controls, stays on the same origin, and never activates a control whose
+   accessible name looks destructive (delete, remove, ...). An LLM turns the crawl into an "Application Behaviour
+   Specification" that becomes a requirements document for a run.
+2. **Test case generation.** Requirements (uploaded documents, Jira, Confluence, typed text, or the crawl) go through
+   requirements analysis, then scenarios, then test cases written as plain steps such as
+   `Login ... | navigate to ... | verify ...`.
+3. **Generate Automation Scripts.** TCG writes Playwright scripts and checks them live against this app. Elements are
+   found via the accessibility tree: role plus accessible name, then label, text, placeholder and a few attribute
+   fallbacks. The last resort is a vision-model click.
+4. **Execute Scripts.** TCG re-runs each test case's steps live against the target URL, resolving each step the same
+   way, and streams a video of the browser. Credentials are asked per run and never stored.
+5. **CI/CD automation (A-20).** A client wires their pipeline (GitHub Actions, Jenkins, or a plain API call) to a
+   token-protected TCG trigger endpoint. When a PR merges, TCG selects the relevant subset of the project's existing
+   test cases for that change and runs them through the same Execute engine. For this repo the goal is to rehearse the
+   whole loop: PR merged, relevant tests selected, tests run, results reported.
+
+## Build rules (derived from the above)
+
+- **Semantic, accessible markup comes first.** Real labels on inputs, buttons and links with meaningful accessible
+  names, proper headings, correct roles for tabs and menus. TCG cannot see or click what the accessibility tree does
+  not expose.
+- **Deterministic, visibly different behaviour per page**, so a generated test can genuinely pass or fail. Build a real
+  login flow with a role-gated UI, since TCG's steps usually start with "Login ...".
+- **Never give two different destructive actions the same label**, and expect TCG never to click destructive-named
+  controls during a crawl.
+- **Reachability.** TCG's crawler and Execute Scripts block private, loopback and link-local addresses (an SSRF guard,
+  with a `CRAWL_ALLOWED_HOSTS` allowlist). Do not assume `localhost` or LAN URLs work; plan on a publicly reachable
+  deployment, and ask the user if that is not possible.
+- Both roles can't be shown by one build, because the role comes from the build-time `NEXT_PUBLIC_DEV_ROLE`.
+
+## PR diff to requirement input (workflow)
+
+`.github/workflows/pr-requirement-input.yml` and `.github/scripts/build-requirement-input.mjs` record what a change does
+(description, file table and diff; lockfile diffs omitted, capped at 400k chars) as `requirement-input.md` and `.json`.
+They run when:
+
+- **anything lands on `main`** (a merged PR by any method, or a direct push): the push's diff, commit list and, when
+  GitHub can name it, the PR behind it, in `merged/<sha12>/`. This is the record that matters; the requirement is the
+  change that actually landed. `source.merged` is `true` in its JSON.
+- a **PR is opened or updated** (opened, reopened, synchronize, ready_for_review): the PR's own diff in `pr-<n>/`, a
+  draft that may never land (`source.merged` is `false`). Delete the `pull_request:` trigger to record merges only.
+
+Each record is delivered to:
+
+- a workflow artifact (always),
+- the `requirements-inbox` branch (pushes, and same-repo PRs; fork PRs get a read-only token),
+- a POST to the `REQUIREMENTS_WEBHOOK_URL` secret, if set (optional `REQUIREMENTS_WEBHOOK_TOKEN` as a bearer token).
+
+**Status (2026-10-27):** written and tested locally only (script for both event kinds including the PR lookup against
+a mock API, and the branch-publish logic against a local bare repo). It has not yet run on GitHub. The artifact and the
+`requirements-inbox` branch are the safe delivery paths; do not rely on the webhook landing anywhere yet. Details are
+in `README.md`.
+
+## Open questions (close these when answered, then delete them here)
+
+1. **Webhook landing place.** No TCG endpoint is known that accepts an external push as a requirement input. The
+   `aihub` routes seen were document upload, Jira, Confluence, typed text and crawl.
+2. **Private-IP allowlist.** Not verified whether `CRAWL_ALLOWED_HOSTS` lets private addresses through, which decides
+   whether a localhost or LAN deployment of this app can be crawled and executed against.
+
+## Keeping this file current
+
+Update this file in the same change whenever the repo's purpose or the TCG integration changes: a new delivery path
+for the PR workflow, an answered open question, a new TCG feature that touches the app, or a change to the build rules.
+The TCG facts above come from `aihub`'s own docs as read on 2026-10-27; if they disagree with `aihub`, `aihub` wins.
diff --git a/README.md b/README.md
index 4838db0..b9ec3b0 100644
--- a/README.md
+++ b/README.md
@@ -42,7 +42,35 @@ already work.
 3. Set `status` to `"in-progress"`, then `"done"` when merged.
 4. Need a new screen? Add it to `routes.ts` **and** create its `page.tsx`.
 
+## PR diff → requirement input
+
+[`.github/workflows/pr-requirement-input.yml`](./.github/workflows/pr-requirement-input.yml) records what a change does
+(description, file table, diff; lockfile diffs omitted, diff capped at 400k chars) via
+[`.github/scripts/build-requirement-input.mjs`](./.github/scripts/build-requirement-input.mjs). It runs in two cases:
+
+| Trigger | Diff recorded | Folder |
+| --- | --- | --- |
+| PR opened, reopened, new commits, ready for review | the PR's own diff (merge base...head) | `pr-<n>/`, overwritten on each push to the PR |
+| **Anything lands on `main`**: merged PR (merge, squash or rebase) or a direct push | the push's diff (before..after), with the commit list and, when GitHub can name it, the PR behind it | `merged/<sha12>/`, one per push, never overwritten |
+
+Each record is delivered to:
+
+| Destination | When | Where |
+| --- | --- | --- |
+| Workflow artifact | always | `requirement-input-pr-<n>` or `requirement-input-merged-<sha12>` on the run (30 days) |
+| `requirements-inbox` branch | pushes, and PRs from this repo (fork PRs get a read-only token) | the folder above, as `requirement-input.md` and `.json` |
+| Webhook | repo secret `REQUIREMENTS_WEBHOOK_URL` is set | `POST` of the `.json` body; optional `REQUIREMENTS_WEBHOOK_TOKEN` is sent as `Authorization: Bearer` |
+
+The `.json` shape is `{ source, description, stats, commits[], files[], diff, diff_truncated }`. `source.merged` is
+`true` for a record made when a change landed on `main` and `false` for a PR-time draft, so a consumer that only wants
+merged changes can filter on it (or delete the `pull_request:` trigger from the workflow). Point the webhook at
+whatever ingests requirements (e.g. the Inputs Registry API once it exists) and the branch/artifact keep working as a
+fallback.
+
+> Smoke test: this line was added in a throwaway PR to check that the workflow runs when a change is merged to
+> `main`. Safe to delete.
+
 ## Not included yet (by design)
 
-Auth/session, real RBAC capabilities, API integration, data fetching/state library, tests, CI, and the platform
+Auth/session, real RBAC capabilities, API integration, data fetching/state library, tests, build/lint CI, and the platform
 `/admin` surface (P-xx). Add these as their features come up.
```
