import { readFile, access } from "node:fs/promises";
import path from "node:path";
import "./globals.css";
import Header from "../components/Header";
import JukeboxLoader from "../components/JukeboxLoader";
import GlobalFx from "../components/GlobalFx";
import Intro from "../components/Intro";


const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://web-nu-wine-25.vercel.app";
const DESC = "Portofolio Vassell Enha Atthayya (Marcell), Full Stack Developer & mahasiswa Sistem Informasi Telkom University — bertema Persona 5.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Vassell Enha Atthayya — Full Stack Developer", template: "%s | Vassell Enha Atthayya" },
  description: DESC,
  keywords: ["Vassell Enha Atthayya", "Marcell", "Full Stack Developer", "Next.js", "Telkom University", "portfolio"],
  authors: [{ name: "Vassell Enha Atthayya", url: SITE }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: SITE, siteName: "Vassell Enha Atthayya", title: "Vassell Enha Atthayya — Full Stack Developer", description: DESC, locale: "id_ID" },
  twitter: { card: "summary_large_image", title: "Vassell Enha Atthayya — Full Stack Developer", description: DESC },
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
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);if(!sessionStorage.getItem('p5:intro')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro');if(localStorage.getItem('p5:secret')==='1')document.documentElement.setAttribute('data-secret','')}catch(e){}})()`;

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
    // Lagu pembuka (opsional): hanya dipakai bila file-nya ada di daftar di atas.
    const iFile = safe(raw.intro?.file);
    const cueAt = Number(raw.intro?.cue);
    const cue = iFile && Number.isFinite(cueAt) && out.some((t) => t.file === `/music/${iFile}`) ? { src: `/music/${iFile}`, at: cueAt } : null;
    return { tracks: out, cue };
  } catch {
    return { tracks: [], cue: null };
  }
}

export default async function RootLayout({ children }) {
  const { tracks, cue } = await loadTracks();
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
        <div aria-hidden="true" className="wipe">
          <i className="w-b" />
          <i className="w-a" />
        </div>
        <Intro cue={cue} />
        <Header />
        {children}
        {/* Di root layout: tetap bermain saat navigasi antar halaman */}
        <JukeboxLoader tracks={tracks} />
        <GlobalFx />
      </body>
    </html>
  );
}
