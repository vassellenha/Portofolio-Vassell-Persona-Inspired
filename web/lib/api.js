// Dipanggil hanya dari Server Components. Browser tidak pernah fetch API langsung.
// Ketahanan: timeout 4 detik + fallback otomatis ke salinan lokal (web/data/*.json).
// Situs tidak pernah kosong walau API mati / cold start.
import profileLocal from "../data/profile.json";
import heistsLocal from "../data/heists.json";
import confidantsLocal from "../data/confidants.json";

const API_URL = process.env.API_URL || "http://localhost:4000";
const TIMEOUT_MS = 4000;

async function fetchApi(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 }, // ISR: disegarkan paling cepat tiap 60 detik
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[api] ${path} -> pakai data lokal (${err?.message ?? err})`);
    return null;
  }
}

const nonEmptyArray = (v) => (Array.isArray(v) && v.length > 0 ? v : null);

export async function getSiteData() {
  const [p, h, c] = await Promise.all([
    fetchApi("/api/profile"),
    fetchApi("/api/heists"),
    fetchApi("/api/confidants"),
  ]);
  const profile = { ...profileLocal, ...(p && typeof p === "object" ? p : {}) };
  // Field array kosong dari API tidak boleh menimpa data lokal
  for (const k of ["stats", "skills", "experience"]) profile[k] = nonEmptyArray(profile[k]) ?? profileLocal[k] ?? [];
  return {
    profile,
    heists: nonEmptyArray(h) ?? heistsLocal,
    confidants: nonEmptyArray(c) ?? nonEmptyArray(p?.confidants) ?? confidantsLocal,
  };
}
