#!/usr/bin/env node
// Pasang pre-commit hook: tiap `git commit`, README + assets otomatis diregenerasi dan ikut ter-commit.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(ROOT, ".git", "hooks");
if (!fs.existsSync(path.join(ROOT, ".git"))) {
  console.error("Bukan repo git — jalankan `git init` dulu.");
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, "pre-commit");
const hook = `#!/bin/sh
# README auto-update (dibuat oleh scripts/install-hook.mjs)
node scripts/gen-readme.mjs >/dev/null 2>&1 && git add README.md assets/*.svg
exit 0
`;
fs.writeFileSync(file, hook, { mode: 0o755 });
console.log("Hook terpasang:", path.relative(ROOT, file));
