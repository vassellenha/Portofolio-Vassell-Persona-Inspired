import { readFile, access } from "node:fs/promises";
import path from "node:path";
import "./globals.css";
import Header from "../components/Header";
import JukeboxLoader from "../components/JukeboxLoader";

export const metadata = {
  title: "Vassell Enha Atthayya — Full Stack Developer",
  description: "Portofolio Vassell Enha Atthayya (Marcell), Full Stack Developer & mahasiswa Sistem Informasi Telkom University.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

// Dijalankan sebelum paint: baca localStorage, fallback ke prefers-color-scheme. Mencegah flash tema.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

// Baca playlist.json di server saat build; hanya lagu yang file-nya benar-benar ada yang dikirim ke client.
async function loadTracks() {
  const dir = path.join(process.cwd(), "public", "music");
  try {
    const raw = JSON.parse(await readFile(path.join(dir, "playlist.json"), "utf8"));
    const list = Array.isArray(raw) ? raw : raw.tracks ?? [];
    const safe = (f) => {
      if (typeof f !== "string" || !f.trim()) return null;
      const p = path.posix.normalize(f.replace(/\\/g, "/"));
      return p === "." || p.startsWith("..") || p.startsWith("/") ? null : p;
    };
    const out = [];
    for (const t of list) {
      const file = safe(t.file);
      if (!file) continue;
      try {
        await access(path.join(dir, file));
      } catch {
        continue;
      }
      const cover = safe(t.cover);
      let coverOk = false;
      if (cover) {
        try {
          await access(path.join(dir, cover));
          coverOk = true;
        } catch {}
      }
      out.push({
        title: String(t.title ?? file),
        artist: String(t.artist ?? ""),
        file: `/music/${file}`,
        duration: t.duration ?? "",
        cover: coverOk ? `/music/${cover}` : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }) {
  const tracks = await loadTracks();
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        <a
          href="#main"
          className="absolute left-2 top-2 z-[60] -translate-y-20 bg-red px-4 py-2 font-black uppercase text-[#f5f5f5] focus:translate-y-0"
        >
          Lewati ke konten
        </a>
        <Header />
        {children}
        {/* Di root layout: tetap bermain saat navigasi antar halaman */}
        <JukeboxLoader tracks={tracks} />
      </body>
    </html>
  );
}
