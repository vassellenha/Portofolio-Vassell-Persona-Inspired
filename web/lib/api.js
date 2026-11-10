// Dipanggil hanya dari Server Components. Browser tidak pernah fetch API langsung.
const API_URL = process.env.API_URL || "http://localhost:4000";

export async function getJson(path, fallback) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 }, // ISR: data disegarkan paling cepat tiap 60 detik
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[api] gagal ambil ${path}:`, err?.message ?? err);
    return fallback;
  }
}

// Dipakai bila API mati saat build/revalidate, supaya halaman tetap tampil.
export const FALLBACK_PROFILE = {
  name: "Vassell Enha Atthayya",
  nickname: "Marcell",
  title: "Full Stack Developer",
  tagline: "Steal the spotlight. Ship the code.",
  bio: "",
  university: "Telkom University — Sistem Informasi",
  links: {
    github: "https://github.com/vassellenha",
    linkedin: "https://www.linkedin.com/in/vassell-enha-atthayya-182661323/",
    instagram: "https://instagram.com/vassellenha",
  },
  stats: [],
  confidants: [],
};
