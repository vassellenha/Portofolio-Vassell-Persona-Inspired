# Persona 5 Portfolio — Vassell Enha Atthayya

Portofolio full-stack bertema Persona 5, ultra-ringan.

- **/web** — Next.js (App Router, React Server Components) + Tailwind CSS v3 murni
- **/api** — Node.js + Express, data dari file JSON (`fs/promises`), tanpa database

Client Component hanya: `ThemeToggle`, `Jukebox` (+ `JukeboxLoader` tipis yang me-lazy-load Jukebox via `next/dynamic`). Tanpa library animasi/audio/UI tambahan.

## Jalankan lokal

Butuh Node.js >= 20.

**Satu perintah** (dari root, setelah dependency terpasang):

```bash
npm run install:all   # sekali saja
npm run dev           # API :4000 + Web :3000 sekaligus (Ctrl+C untuk berhenti)
```

**Atau manual**, dua terminal:

```bash
# Terminal 1 — API (http://localhost:4000)
cd api
npm install
npm run dev

# Terminal 2 — Web (http://localhost:3000)
cd web
cp .env.example .env.local     # isi API_URL (default http://localhost:4000)
npm install
npm run dev
```

Endpoint API: `GET /api/profile`, `GET /api/heists`, `GET /health`.
Web mengambil data **di server** (Server Components, ISR `revalidate = 60`); browser tidak fetch API langsung.

Edit data kamu di `api/data/profile.json` dan `api/data/heists.json`.
Status heist: `"Secured"` atau `"In Progress"`. Stats memakai level 1–9.

Build, lint, dan cek ukuran bundle:

```bash
cd web
npm run lint
npm run build      # Next 16 tidak lagi mencetak "First Load JS"; ukur dengan `npx next build --webpack`
```

## Menambah lagu

1. Taruh file `.mp3` di `web/public/music/`.
2. Daftarkan di `web/public/music/playlist.json`:

```json
{ "tracks": [
  { "title": "Judul Lagu", "artist": "Vassell (Suno)", "file": "judul-lagu.mp3", "duration": "3:12", "cover": "judul-lagu.jpg" }
] }
```

`cover` opsional (gambar di folder yang sama). Entri yang file mp3-nya belum ada otomatis disembunyikan; jika semua kosong, Jukebox menampilkan "No tracks yet". Playlist dibaca saat build, jadi **build/deploy ulang** setelah menambah lagu.

Catatan perilaku: musik tidak pernah autoplay (default OFF, butuh klik pertama). Volume, shuffle, dan lagu terakhir diingat di localStorage.

## Deploy

**API → Render** (Web Service)
- Root Directory: `api` · Build: `npm install` · Start: `npm start`
- Env opsional: `CORS_ORIGIN` (URL web). Render menyediakan `PORT` otomatis.
- Health check path: `/health`

**Web → Vercel**
- Root Directory: `web` · Framework: Next.js
- Env: `API_URL=https://<nama-api>.onrender.com`
- Free tier Render bisa tertidur; bila API tidak terjangkau saat build/revalidate, halaman memakai data fallback minimal dan akan memperbarui diri pada revalidate berikutnya.

## Catatan desain

- Tema: Tailwind `darkMode: 'class'` + CSS variables. Script inline di `<head>` membaca `localStorage` lalu fallback ke `prefers-color-scheme` sebelum paint (tanpa flash). Hanya warna yang berubah, jadi tidak ada layout shift.
- Font memakai system stack (Arial Black/Impact) — tanpa webfont, tanpa request tambahan. Hindari simbol di luar Latin dasar pada teks display (misalnya ★) karena memicu pencarian font fallback yang mahal; pakai SVG.
- Semua animasi CSS native dan menghormati `prefers-reduced-motion`.
