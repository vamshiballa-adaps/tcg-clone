// Turns a pull_request event into a "requirement input": a markdown document (human/TCG-readable)
// and a JSON document (machine-readable) describing what the PR changes.
//
// Reads the PR metadata from the event payload (GITHUB_EVENT_PATH) rather than from interpolated
// workflow expressions, so attacker-controlled text (title, body) never touches a shell.
//
// Env: GITHUB_EVENT_PATH (required), OUT_DIR (default "requirement-input"),
//      MAX_DIFF_CHARS (default 400000), GITHUB_REPOSITORY (optional, falls back to the payload).

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.OUT_DIR || "requirement-input";
const MAX_DIFF_CHARS = Number(process.env.MAX_DIFF_CHARS) || 400_000;

// Lockfiles are listed in the file table but their diff is noise for a requirement reader.
const DIFF_EXCLUDES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set");
const event = JSON.parse(readFileSync(eventPath, "utf8"));
const pr = event.pull_request;
if (!pr) throw new Error("Event payload has no pull_request");

const baseSha = pr.base.sha;
const headSha = pr.head.sha;
const range = `${baseSha}...${headSha}`;

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

const nameStatus = parseNameStatus(git("diff", "-M", "-z", "--name-status", range));
const numstat = parseNumstat(git("diff", "-M", "-z", "--numstat", range));
const files = nameStatus.map((f) => ({
  ...f,
  ...(numstat.get(f.path) ?? { additions: 0, deletions: 0, binary: false }),
}));
const totals = files.reduce(
  (s, f) => ({ additions: s.additions + f.additions, deletions: s.deletions + f.deletions }),
  { additions: 0, deletions: 0 },
);

let diff = git("diff", "-M", "--no-color", range, "--", ".", ...DIFF_EXCLUDES.map((p) => `:(exclude)${p}`));
const fullDiffChars = diff.length;
const diffTruncated = fullDiffChars > MAX_DIFF_CHARS;
if (diffTruncated) diff = diff.slice(0, MAX_DIFF_CHARS);

const repo = process.env.GITHUB_REPOSITORY || event.repository?.full_name || "";
const source = {
  repository: repo,
  pr_number: pr.number,
  pr_url: pr.html_url,
  title: pr.title,
  author: pr.user?.login ?? "",
  event_action: event.action ?? "",
  base_ref: pr.base.ref,
  head_ref: pr.head.ref,
  base_sha: baseSha,
  head_sha: headSha,
  generated_at: new Date().toISOString(),
};
const description = (pr.body ?? "").trim();

// A fence longer than any backtick run inside the diff keeps the block from closing early.
const longestTicks = Math.max(0, ...(diff.match(/`+/g) ?? []).map((m) => m.length));
const fence = "`".repeat(Math.max(3, longestTicks + 1));

const escapeCell = (s) => s.replace(/\|/g, "\\|");
const fileRows = files.map((f) => {
  const name = f.oldPath ? `${escapeCell(f.oldPath)} → ${escapeCell(f.path)}` : escapeCell(f.path);
  const change = f.binary ? "binary" : `+${f.additions} / -${f.deletions}`;
  return `| ${f.status} | ${name} | ${change} |`;
});

const md = [
  `# Change requirement input — PR #${pr.number}: ${pr.title}`,
  "",
  `- **Repository:** ${repo}`,
  `- **Pull request:** ${pr.html_url}`,
  `- **Author:** ${source.author}`,
  `- **Branch:** \`${pr.head.ref}\` → \`${pr.base.ref}\``,
  `- **Compared:** \`${baseSha.slice(0, 12)}\`...\`${headSha.slice(0, 12)}\``,
  `- **Generated:** ${source.generated_at} (event: ${source.event_action})`,
  "",
  "## Description",
  "",
  description || "_No description provided._",
  "",
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
  description,
  stats: { files: files.length, ...totals },
  files,
  diff,
  diff_truncated: diffTruncated,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "requirement-input.md"), md);
writeFileSync(join(OUT_DIR, "requirement-input.json"), JSON.stringify(json, null, 2) + "\n");

console.log(
  `PR #${pr.number}: ${files.length} files, +${totals.additions} / -${totals.deletions}` +
    `${diffTruncated ? " (diff truncated)" : ""} -> ${OUT_DIR}/`,
);
