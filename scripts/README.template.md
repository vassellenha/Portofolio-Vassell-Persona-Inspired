<div align="center">

<img src="assets/hero.svg" alt="{{NAME}} — {{TITLE}}" width="100%"/>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-{{NEXT_V}}-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-{{TAILWIND_V}}-DC0000?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-API-F5F5F5?style=for-the-badge&logo=express&logoColor=black)](https://expressjs.com)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-API-DC0000?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

**{{HEIST_COUNT}} proyek · {{SECURED_COUNT}} selesai · {{TRACK_COUNT}} lagu original · tanpa database**

</div>

<img src="assets/divider.svg" width="100%" alt=""/>

## ◣ What is this?

Portofolio **{{NAME}}** (*{{NICK}}*) — {{TITLE}}, {{UNIVERSITY}}.
Konten dibuat formal dan profesional, sementara antarmukanya meminjam gaya visual **Persona 5**: kotak miring, merah-hitam-putih, menu perintah berbentuk kipas, intro kaca pecah, dan **Jukebox** dengan musik original (Suno).

> _{{TAGLINE}}_

{{BIO}}

<img src="assets/divider.svg" width="100%" alt=""/>

<img src="assets/stats.svg" width="100%" alt="Status screen"/>

<details><summary>Versi teks</summary>

| Stat | Level | Skill |
|---|---|---|
{{STATS_TABLE}}

</details>

<img src="assets/skills.svg" width="100%" alt="Skills"/>

<details><summary>Versi teks</summary>

{{SKILLS_LIST}}

</details>

<img src="assets/heists.svg" width="100%" alt="Proyek"/>

<details><summary>Versi teks</summary>

| Proyek | Status | Deskripsi | Teknologi |
|---|---|---|---|
{{HEISTS_TABLE}}

</details>

<img src="assets/confidant.svg" width="100%" alt="Referensi"/>

<details><summary>Versi teks</summary>

| Peran | Nama |
|---|---|
{{CONFIDANT_TABLE}}

</details>

<img src="assets/jukebox.svg" width="100%" alt="Jukebox"/>

| # | Track | Durasi |
|---|---|---|
{{TRACK_TABLE}}

<img src="assets/divider.svg" width="100%" alt=""/>

## ◣ Pengalaman

{{EXPERIENCE_LIST}}

## ◣ Fitur interaktif

- **Intro kaca pecah** — animasi pembuka canvas (tinta putih, kaca retak, kolase keping, OC) sekali per sesi, bisa dilewati
- **Stat Allocator** — alokasikan poin, naik level
- **Menu cepat** — tekan `M` untuk menu perintah ala Persona
- **Pecahkan Kaca** — panel kontak tertutup kaca merah: klik 3x untuk meretakkan, memecahkan, dan membuka kontak
- **Playground** — mini-game & tools yang bisa dimainkan
- **Jukebox** — shuffle, repeat, Media Session (kontrol dari lockscreen), preferensi tersimpan
- **SFX** — efek suara Web Audio (klik, flip, buka panel), bisa dimatikan
- **Dark / Light mode** — kontras hover diaudit di kedua tema

## ◣ Struktur

```
.
├── api/        Express 5 — membaca api/data/*.json (tanpa database)
├── web/        Next.js App Router + Tailwind 3 (fallback data di web/data)
├── scripts/    gen-readme.mjs · template · font untuk SVG
├── assets/     SVG animasi README (dibuat otomatis)
└── dev.mjs     jalankan api + web sekaligus
```

## ◣ Jalankan lokal

```bash
npm install            # root: dev tooling
npm --prefix api install
npm --prefix web install
node dev.mjs           # api :4000 · web :3000
```

## ◣ Update README otomatis

README ini **dibuat oleh generator** dari data proyek — jangan edit `README.md` langsung.

```bash
npm run readme   # regenerasi README.md + assets/*.svg
npm run hooks    # pasang pre-commit hook: README ikut ter-update tiap commit
```

Sumber: `api/data/*.json`, `web/public/music/playlist.json`, dan `scripts/README.template.md` untuk teks statis.

<img src="assets/calling-card.svg" width="100%" alt="Mari berkolaborasi"/>

<div align="center">

[GitHub]({{GITHUB}}) · [LinkedIn]({{LINKEDIN}}) · [Instagram]({{INSTAGRAM}})

<sub>Dibuat otomatis oleh <code>scripts/gen-readme.mjs</code></sub>

</div>
