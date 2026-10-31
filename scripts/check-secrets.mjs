import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const git = (...args) =>
  execFileSync("git", args, { maxBuffer: 32 * 1024 * 1024 });
const findings = new Set();
const flag = (path, category) =>
  findings.add(JSON.stringify({ path, category }));
const patterns = {
  private_key: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/,
  github_token:
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/,
  aws_access_key: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  service_token:
    /\b(?:xox[baprs]-[A-Za-z0-9-]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}|AIza[0-9A-Za-z_-]{35})\b/,
  jwt: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\b/,
};
function scan(path, buffer) {
  const name = path.split("/").at(-1);
  if (
    (name.startsWith(".env") &&
      ![".env.example", ".env.test.example"].includes(name)) ||
    /\.(?:key|pem|p12|pfx|sql\.gz|bundle|zip|cnf)$/i.test(name) ||
    (name.endsWith(".sql") &&
      !/^prisma\/migrations\/[^/]+\/migration\.sql$/.test(path))
  )
    flag(path, "sensitive_file");
  const text = buffer.toString("utf8");
  for (const [kind, pattern] of Object.entries(patterns))
    if (pattern.test(text)) flag(path, kind);
  for (const match of text.matchAll(
    /(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?|redis):\/\/[^\s:/"']+:([^\s@/"']+)@/g,
  )) {
    const placeholder =
      /^(?:pass|invalid|placeholder)$|troque|substitua|<|\$\{/i.test(match[1]);
    if (!placeholder) flag(path, "database_password_literal");
  }
  // Literais no código de aplicação: fixtures sintéticas são revisadas separadamente.
  if (path.startsWith("apps/") || path.startsWith("packages/"))
    for (const match of text.matchAll(
      /\b(?:password|passwd|apiKey|CSRF_SECRET)\s*[:=]\s*["']([^"'\n]{8,})["']/g,
    ))
      if (!/\brepeat\(|\.repeat\(/.test(match[0]))
        flag(path, "credential_literal");
}
const objects = git("rev-list", "--objects", "--all")
  .toString()
  .trim()
  .split("\n");
let blobs = 0;
for (const row of objects) {
  const space = row.indexOf(" ");
  if (space < 0) continue;
  const oid = row.slice(0, space),
    path = row.slice(space + 1);
  if (git("cat-file", "-t", oid).toString().trim() !== "blob") continue;
  scan(path, git("cat-file", "blob", oid));
  blobs++;
}
const files = git(
  "ls-files",
  "-z",
  "--cached",
  "--others",
  "--exclude-standard",
)
  .toString()
  .split("\0")
  .filter(Boolean);
for (const path of files) scan(path, readFileSync(path));
console.log(
  JSON.stringify({
    historicalBlobs: blobs,
    workingFiles: files.length,
    findings: [...findings].map(JSON.parse),
  }),
);
process.exitCode = findings.size ? 1 : 0;
