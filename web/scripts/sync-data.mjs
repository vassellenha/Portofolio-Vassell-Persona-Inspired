// Menyalin api/data/*.json -> web/data/*.json (salinan fallback saat API mati).
// Jalankan: npm run sync-data   (dari folder web). Commit kedua folder setelahnya.
import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../../api/data/", import.meta.url));
const to = fileURLToPath(new URL("../data/", import.meta.url));
await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
console.log("data disalin:", from, "->", to);
