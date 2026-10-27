// Turns a GitHub event into a "requirement input": a markdown document (human/TCG-readable)
// and a JSON document (machine-readable) describing what the change does.
//
// Two kinds of event are understood:
//   pull_request - a PR was opened/updated: the PR's own diff (merge-base...head)
//   push         - something landed on a branch (a merged PR, a squash/rebase merge, a direct push):
//                  the diff of the push (before..after), plus the PR behind it when GitHub can name one
//
// PR metadata is read from the event payload (GITHUB_EVENT_PATH) rather than from interpolated
// workflow expressions, so attacker-controlled text (title, body) never touches a shell.
//
// Env: GITHUB_EVENT_PATH (required), GITHUB_EVENT_NAME, OUT_DIR (default "requirement-input"),
//      MAX_DIFF_CHARS (default 400000), GITHUB_REPOSITORY (optional, falls back to the payload),
//      GITHUB_TOKEN (optional, push events only: used to look up the merged PR),
//      GITHUB_API_URL (default https://api.github.com), GITHUB_OUTPUT (set by Actions).
// Outputs (to $GITHUB_OUTPUT when set): folder (e.g. "pr-7" or "merged/ab12cd34ef56"), slug (folder with "-").

import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.OUT_DIR || "requirement-input";
const MAX_DIFF_CHARS = Number(process.env.MAX_DIFF_CHARS) || 400_000;
const MAX_COMMITS = 100;

// Lockfiles are listed in the file table but their diff is noise for a requirement reader.
const DIFF_EXCLUDES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

// git's well-known empty tree: the "before" of a first push or an unreachable force-push base.
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const tryGit = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set");
const event = JSON.parse(readFileSync(eventPath, "utf8"));
const eventName = process.env.GITHUB_EVENT_NAME || (event.pull_request ? "pull_request" : "push");
const repo = process.env.GITHUB_REPOSITORY || event.repository?.full_name || "";

/** The PR GitHub associates with a commit on a branch, if any (best effort, never fatal). */
async function findPrForCommit(sha) {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !repo) return null;
  const api = process.env.GITHUB_API_URL || "https://api.github.com";
  try {
    const res = await fetch(`${api}/repos/${repo}/commits/${sha}/pulls`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`PR lookup for ${sha.slice(0, 12)} returned ${res.status}; continuing without it.`);
      return null;
    }
    const prs = await res.json();
    if (!Array.isArray(prs) || !prs.length) return null;
    return prs.find((p) => p.merge_commit_sha === sha) ?? prs.find((p) => p.merged_at) ?? prs[0];
  } catch (err) {
    console.warn(`PR lookup failed (${err.message}); continuing without it.`);
    return null;
  }
}

/** Everything that differs between the two event kinds, behind one shape. */
async function buildContext() {
  if (eventName === "pull_request") {
    const pr = event.pull_request;
    if (!pr) throw new Error("Event payload has no pull_request");
    return {
      kind: "pr",
      merged: false,
      pr,
      baseSha: pr.base.sha,
      headSha: pr.head.sha,
      baseRef: pr.base.ref,
      headRef: pr.head.ref,
      diffArgs: [`${pr.base.sha}...${pr.head.sha}`],
      folder: `pr-${pr.number}`,
      slug: `pr-${pr.number}`,
      title: pr.title,
      author: pr.user?.login ?? "",
      description: (pr.body ?? "").trim(),
      commits: [],
    };
  }

  if (eventName !== "push") throw new Error(`Unsupported event: ${eventName}`);

  const headSha = event.after || process.env.GITHUB_SHA;
  if (!headSha) throw new Error("Push event has no head commit");
  let baseSha = event.before;
  // New branch (all zeros) or a force-push whose old tip is gone: fall back to the first parent.
  if (!baseSha || /^0+$/.test(baseSha) || tryGit("cat-file", "-e", `${baseSha}^{commit}`) === null) {
    baseSha = tryGit("rev-parse", "--verify", "-q", `${headSha}^`) ?? EMPTY_TREE;
  }

  const range = baseSha === EMPTY_TREE ? [headSha] : [`${baseSha}..${headSha}`];
  const commits = git("log", `-n${MAX_COMMITS}`, "--format=%H%x1f%an%x1f%s%x1e", ...range)
    .split("\x1e")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [sha, author, subject] = r.split("\x1f");
      return { sha, author, subject };
    });
  const head = commits[0] ?? { author: "", subject: headSha.slice(0, 12) };
  const pr = await findPrForCommit(headSha);

  return {
    kind: "merge",
    merged: true,
    pr,
    baseSha,
    headSha,
    baseRef: (event.ref ?? "").replace(/^refs\/heads\//, ""),
    headRef: pr?.head?.ref ?? null,
    diffArgs: [baseSha, headSha],
    folder: `merged/${headSha.slice(0, 12)}`,
    slug: `merged-${headSha.slice(0, 12)}`,
    title: pr?.title ?? head.subject,
    author: pr?.user?.login ?? head.author,
    description: (pr?.body ?? tryGit("log", "-1", "--format=%b", headSha) ?? "").trim(),
    commits,
  };
}

const ctx = await buildContext();

/** name-status -z: `M\0path\0` or `R100\0old\0new\0`. */
function parseNameStatus(raw) {
  const t = raw.split("\0");
  const out = [];
  for (let i = 0; i < t.length && t[i]; ) {
    const status = t[i];
    if (status[0] === "R" || status[0] === "C") {
      out.push({ status: status[0], path: t[i + 2], oldPath: t[i + 1] });
      i += 3;
    } else {
      out.push({ status: status[0], path: t[i + 1] });
      i += 2;
    }
  }
  return out;
}

/** numstat -z: `1\t2\tpath\0` or, for renames, `1\t2\t\0old\0new\0`. Binary files report `-`. */
function parseNumstat(raw) {
  const t = raw.split("\0");
  const out = new Map();
  for (let i = 0; i < t.length && t[i]; ) {
    const [add, del, p] = t[i].split("\t");
    const path = p === "" ? t[i + 2] : p;
    i += p === "" ? 3 : 1;
    const binary = add === "-";
    out.set(path, { additions: binary ? 0 : Number(add), deletions: binary ? 0 : Number(del), binary });
  }
  return out;
}

const nameStatus = parseNameStatus(git("diff", "-M", "-z", "--name-status", ...ctx.diffArgs));
const numstat = parseNumstat(git("diff", "-M", "-z", "--numstat", ...ctx.diffArgs));
const files = nameStatus.map((f) => ({
  ...f,
  ...(numstat.get(f.path) ?? { additions: 0, deletions: 0, binary: false }),
}));
const totals = files.reduce(
  (s, f) => ({ additions: s.additions + f.additions, deletions: s.deletions + f.deletions }),
  { additions: 0, deletions: 0 },
);

let diff = git(
  "diff", "-M", "--no-color", ...ctx.diffArgs, "--", ".",
  ...DIFF_EXCLUDES.map((p) => `:(exclude)${p}`),
);
const fullDiffChars = diff.length;
const diffTruncated = fullDiffChars > MAX_DIFF_CHARS;
if (diffTruncated) diff = diff.slice(0, MAX_DIFF_CHARS);

const source = {
  repository: repo,
  event_name: eventName,
  event_action: event.action ?? "",
  merged: ctx.merged,
  pr_number: ctx.pr?.number ?? null,
  pr_url: ctx.pr?.html_url ?? null,
  title: ctx.title,
  author: ctx.author,
  base_ref: ctx.baseRef,
  head_ref: ctx.headRef,
  base_sha: ctx.baseSha,
  head_sha: ctx.headSha,
  generated_at: new Date().toISOString(),
};

// A fence longer than any backtick run inside the diff keeps the block from closing early.
const longestTicks = Math.max(0, ...(diff.match(/`+/g) ?? []).map((m) => m.length));
const fence = "`".repeat(Math.max(3, longestTicks + 1));

const escapeCell = (s) => s.replace(/\|/g, "\\|");
const fileRows = files.map((f) => {
  const name = f.oldPath ? `${escapeCell(f.oldPath)} → ${escapeCell(f.path)}` : escapeCell(f.path);
  const change = f.binary ? "binary" : `+${f.additions} / -${f.deletions}`;
  return `| ${f.status} | ${name} | ${change} |`;
});

const heading =
  ctx.kind === "pr"
    ? `# Change requirement input — PR #${ctx.pr.number}: ${ctx.title}`
    : `# Merged change requirement input — ${ctx.title}`;
const compared =
  ctx.baseSha === EMPTY_TREE ? `_(start of history)_...\`${ctx.headSha.slice(0, 12)}\`` : `\`${ctx.baseSha.slice(0, 12)}\`...\`${ctx.headSha.slice(0, 12)}\``;

const md = [
  heading,
  "",
  `- **Repository:** ${repo}`,
  ...(ctx.pr ? [`- **Pull request:** ${ctx.pr.html_url}`] : []),
  `- **Author:** ${ctx.author}`,
  ctx.kind === "pr"
    ? `- **Branch:** \`${ctx.headRef}\` → \`${ctx.baseRef}\``
    : `- **Merged into:** \`${ctx.baseRef}\`${ctx.headRef ? ` (from \`${ctx.headRef}\`)` : ""}`,
  `- **Compared:** ${compared}`,
  `- **Generated:** ${source.generated_at} (event: ${eventName}${source.event_action ? `/${source.event_action}` : ""})`,
  "",
  "## Description",
  "",
  ctx.description || "_No description provided._",
  "",
  ...(ctx.commits.length
    ? [
        `## Commits (${ctx.commits.length})`,
        "",
        ...ctx.commits.map((c) => `- \`${c.sha.slice(0, 12)}\` ${c.subject} — ${c.author}`),
        "",
      ]
    : []),
  `## Files changed (${files.length}, +${totals.additions} / -${totals.deletions})`,
  "",
  ...(files.length
    ? ["| Status | File | Lines |", "| --- | --- | --- |", ...fileRows]
    : ["_No file changes._"]),
  "",
  "## Diff",
  "",
  ...(diffTruncated
    ? [`> Diff truncated to ${MAX_DIFF_CHARS} of ${fullDiffChars} characters.`, ""]
    : []),
  `> Lockfile diffs (${DIFF_EXCLUDES.join(", ")}) are omitted; they still appear in the file table.`,
  "",
  `${fence}diff`,
  diff.trimEnd(),
  fence,
  "",
].join("\n");

const json = {
  source,
  description: ctx.description,
  stats: { files: files.length, ...totals },
  commits: ctx.commits,
  files,
  diff,
  diff_truncated: diffTruncated,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "requirement-input.md"), md);
writeFileSync(join(OUT_DIR, "requirement-input.json"), JSON.stringify(json, null, 2) + "\n");

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `folder=${ctx.folder}\nslug=${ctx.slug}\n`);
}

console.log(
  `${ctx.folder}: ${files.length} files, +${totals.additions} / -${totals.deletions}` +
    `${diffTruncated ? " (diff truncated)" : ""} -> ${OUT_DIR}/`,
);
