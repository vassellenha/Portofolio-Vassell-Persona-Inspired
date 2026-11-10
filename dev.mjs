// Menjalankan API (:4000) dan Web (:3000) sekaligus. Tanpa dependency tambahan.
import { spawn } from "node:child_process";

const procs = [
  ["api", "api", "\x1b[35m"],
  ["web", "web", "\x1b[36m"],
].map(([name, cwd, color]) => {
  const p = spawn("npm run dev", { cwd, shell: true, stdio: ["ignore", "pipe", "pipe"] });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (s, out) =>
    s.on("data", (d) =>
      String(d)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((l) => out.write(tag + l + "\n"))
    );
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on("exit", (code) => {
    console.log(`${tag}berhenti (kode ${code})`);
    stop();
  });
  return p;
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const p of procs) {
    // taskkill /T supaya anak proses (node/next) ikut mati di Windows
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
    else p.kill();
  }
  setTimeout(() => process.exit(0), 500);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
