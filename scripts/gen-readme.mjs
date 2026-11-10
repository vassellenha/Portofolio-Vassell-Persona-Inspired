#!/usr/bin/env node
// Generator README + aset SVG animasi bertema Persona 5.
//
//   npm run readme
//
// Sumber data (satu-satunya yang perlu kamu edit):
//   api/data/profile.json · api/data/heists.json · api/data/confidants.json · web/public/music/playlist.json
//   scripts/README.template.md  (teks statis README)
// Hasil:
//   README.md · assets/*.svg
//
// Teks di SVG dikonversi jadi path vektor dari font Inter Black Italic (scripts/fonts),
// jadi tampil identik di GitHub tanpa perlu memuat font. Tanpa JavaScript, hanya animasi SVG/CSS.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let opentype;
try {
  opentype = (await import("opentype.js")).default;
} catch {
  console.error("opentype.js belum terpasang. Jalankan dulu:  npm install   (di root project)");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = (...p) => path.join(ROOT, ...p);
const readJson = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(P(rel), "utf8"));
  } catch {
    return fallback;
  }
};
const loadFont = (name) => {
  const b = fs.readFileSync(P("scripts/fonts", name));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};

const RED = "#dc0000";
const RT = "#ff5252";
const BLK = "#0f0f0f";
const WHT = "#f5f5f5";
const MUT = "#b5b5b5";

// Satu font saja (Inter Black Italic, lisensi OFL): heavy-italic yang tegas & bersih — gaya Persona datang dari kotak miring & warna.
const MARKIN = loadFont("inter-black-italic.otf");
const F = { display: MARKIN, accent: MARKIN, body: MARKIN };

/* ------------------------------------------------------------------ teks -> path */
const has = (font, ch) => font.charToGlyphIndex(ch) > 0;

// Teks -> satu path. Karakter yang tidak ada di font utama (mis. & / @ di Persona 5 Menu) jatuh ke Markin.
function text(fontKey, str, size, { ls = 0, upper = true } = {}) {
  const s = upper ? String(str).toUpperCase() : String(str);
  const main = F[fontKey];
  let x = 0;
  const parts = [];
  let bb = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const ch of s) {
    const f = ch === " " || has(main, ch) ? main : F.body;
    const g = f.getPath(ch, x, 0, size);
    const b = g.getBoundingBox();
    if (ch !== " " && Number.isFinite(b.x1)) {
      bb = { x1: Math.min(bb.x1, b.x1), y1: Math.min(bb.y1, b.y1), x2: Math.max(bb.x2, b.x2), y2: Math.max(bb.y2, b.y2) };
      parts.push(g.toPathData(1));
    }
    x += f.getAdvanceWidth(ch, size) + ls * size;
  }
  if (!Number.isFinite(bb.x1)) bb = { x1: 0, y1: -size * 0.7, x2: 0, y2: 0 };
  return { d: parts.join(""), w: x, bb, bw: bb.x2 - bb.x1, bh: bb.y2 - bb.y1 };
}

function wrap(fontKey, str, size, maxW, opts) {
  const words = String(str).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && text(fontKey, t, size, opts).bw > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Path teks yang bbox-nya ditaruh dengan sudut kiri-atas di (x,y)
const place = (t, x, y, fill, extra = "") =>
  `<path d="${t.d}" fill="${fill}" transform="translate(${r(x - t.bb.x1)} ${r(y - t.bb.y1)})" ${extra}/>`;
// ... atau bbox-nya dipusatkan di (0,0)
const center = (t, fill, extra = "") =>
  `<path d="${t.d}" fill="${fill}" transform="translate(${r(-t.bb.x1 - t.bw / 2)} ${r(-t.bb.y1 - t.bh / 2)})" ${extra}/>`;
const realItem = (x) => !/^\[?\s*edit/i.test(String(x));
const r = (n) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ komponen SVG */
// Kotak miring ala potongan majalah, teks tetap tegak. (cx,cy) = pusat kotak.
function tile({ t, cx, cy, padX = 16, padY = 10, fill = WHT, ink = BLK, stroke = "", sw = 4, rot = 0, skew = -12, cls = "", style = "", shadow = "" }) {
  const w = t.bw + padX * 2;
  const h = t.bh + padY * 2;
  return `<g transform="translate(${r(cx)} ${r(cy)}) rotate(${rot})"><g class="${cls}" style="${style}"><g transform="skewX(${skew})">
${shadow ? `<rect x="${r(-w / 2 + 7)}" y="${r(-h / 2 + 7)}" width="${r(w)}" height="${r(h)}" fill="${shadow}"/>` : ""}
<rect x="${r(-w / 2)}" y="${r(-h / 2)}" width="${r(w)}" height="${r(h)}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}/>
<g transform="skewX(${-skew})">${center(t, ink)}</g></g></g></g>`;
}
const tileSize = (t, padX = 16, padY = 10) => ({ w: t.bw + padX * 2, h: t.bh + padY * 2 });

// Tag kecil dengan pojok kiri-atas di (x,y)
function chip({ t, x, y, padX = 12, padY = 7, fill = "none", ink = WHT, stroke = WHT, sw = 2.5, skew = -12, cls = "", style = "" }) {
  const w = t.bw + padX * 2;
  const h = t.bh + padY * 2;
  return {
    w,
    h,
    svg: `<g transform="translate(${r(x + w / 2)} ${r(y + h / 2)})"><g class="${cls}" style="${style}"><g transform="skewX(${skew})">
<rect class="bx" x="${r(-w / 2)}" y="${r(-h / 2)}" width="${r(w)}" height="${r(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
<g transform="skewX(${-skew})">${center(t, ink)}</g></g></g></g>`,
  };
}

const star = (cx, cy, rad, fill) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? rad * 0.42 : rad;
    pts.push(`${r(cx + Math.cos(a) * rr)},${r(cy + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
};

// PRNG deterministik supaya hasil generator stabil (diff git bersih)
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const BASE_CSS = `
.a{transform-box:fill-box}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;

function svg({ w, h, title, css = "", defs = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>${defs}</defs>
<style>${BASE_CSS}${css}</style>
${body}
</svg>
`;
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const write = (name, content) => {
  fs.mkdirSync(P("assets"), { recursive: true });
  fs.writeFileSync(P("assets", name), content);
  console.log(`  assets/${name}  ${(content.length / 1024).toFixed(0)} KB`);
};

// Latar gelap + titik halftone merah + pecahan kaca, dipakai semua aset
function backdrop(w, h, { shards = true, seed = 3 } = {}) {
  const rand = rng(seed);
  const sh = shards
    ? `<g class="a drift"><polygon points="${w - 380},0 ${w},0 ${w},${h * 0.62} ${w - 130},${h * 0.9} ${w - 250},${h * 0.5} ${w - 330},${h * 0.3}" fill="${RED}"/></g>
<polygon points="0,${h * 0.78} ${w * 0.2},${h} 0,${h}" fill="#1c1c1c"/>
<polygon points="0,0 ${w * 0.1},0 ${w * 0.04},${h * 0.2}" fill="#1c1c1c"/>`
    : "";
  let dust = "";
  for (let i = 0; i < 14; i++) {
    const x = r(rand() * w);
    const y = r(rand() * h);
    const s = r(5 + rand() * 9);
    dust += `<rect class="a fl" x="${x}" y="${y}" width="${s}" height="${s * 1.6}" fill="${i % 3 ? WHT : RED}" opacity="${i % 3 ? 0.18 : 0.6}" transform="skewX(-12)" style="animation-delay:${r(rand() * -9)}s;animation-duration:${r(7 + rand() * 7)}s"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="${BLK}"/>
<rect width="${w}" height="${h}" fill="url(#dots)"/>${sh}${dust}`;
}
const DOTS = `<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2" fill="${RED}" opacity=".22"/></pattern>`;
const COMMON_CSS = `
.drift{animation:drift 9s ease-in-out infinite alternate}
@keyframes drift{from{transform:translate(0,0)}to{transform:translate(-18px,14px)}}
.fl{animation:fl 10s ease-in-out infinite}
@keyframes fl{0%,100%{transform:translateY(0) skewX(-12deg)}50%{transform:translateY(-26px) skewX(-12deg)}}
`;

/* ------------------------------------------------------------------ HERO */
function hero(profile) {
  const W = 1200;
  const H = 640;
  const [n1, ...restName] = profile.name.toUpperCase().split(" ");
  const names = [n1, restName[0] ?? "", restName.slice(1).join(" ")].filter(Boolean);
  const specs = [
    { fill: WHT, ink: BLK, rot: -1.6, dx: 0, size: 96 },
    { fill: RED, ink: WHT, rot: 1.1, dx: 70, size: 96 },
    { fill: BLK, ink: WHT, stroke: WHT, rot: -0.7, dx: 20, size: 84 },
  ];
  let y = 120;
  let tiles = "";
  names.forEach((n, i) => {
    const s = specs[i % 3];
    const t = text("display", n, s.size, { ls: 0.02 });
    const { w, h } = tileSize(t, 34, 16);
    const cx = 76 + w / 2 + s.dx;
    tiles += `<g class="a wig" style="animation-delay:${i * -1.7}s;transform-origin:${r(cx)}px ${r(y + h / 2)}px">${tile({ t, cx, cy: y + h / 2, padX: 34, padY: 16, fill: s.fill, ink: s.ink, stroke: s.stroke, sw: 5, rot: s.rot, cls: `a in${i + 1}`, shadow: i === 0 ? RED : "" })}</g>`;
    y += h - 4;
  });

  const kicker = text("body", "Portofolio // 2026", 21, { ls: 0.04 });
  const k = chip({ t: kicker, x: 78, y: 52, padX: 16, padY: 9, fill: BLK, ink: WHT, stroke: WHT, sw: 3, cls: "a in0" });

  const sub = text("display", profile.title, 34, { ls: 0.03 });
  const subTile = tile({ t: sub, cx: 78 + (sub.bw + 36) / 2, cy: y + 38, padX: 18, padY: 10, fill: WHT, ink: BLK, cls: "a in4" });
  const aka = text("body", `a.k.a. “${profile.nickname}”`, 20, { ls: 0.03 });
  const akaX = 78 + kicker.bw + 16 * 2 + 22;

  const tagLines = wrap("body", profile.tagline, 22, 480, { upper: false });
  const tagY = y + 92;

  // marquee
  const seg = `${profile.title} // ${profile.nickname} // Sistem Informasi // Telkom University // `;
  const mt = text("accent", seg, 30, { ls: 0.03 });
  const reps = Math.max(1, Math.ceil(W / mt.w));
  const one = Array.from({ length: reps }, (_, i) => `<use href="#mq" x="${r(i * mt.w)}"/>`).join("");
  const segW = r(reps * mt.w);
  const tkY = H - 64;

  const OC = fs.existsSync(P("scripts/oc-small.jpg")) ? fs.readFileSync(P("scripts/oc-small.jpg")).toString("base64") : "";
  const oc = OC ? `<g clip-path="url(#ocp)"><image href="data:image/jpeg;base64,${OC}" x="330" y="0" width="${(H * 16) / 9}" height="${H}" preserveAspectRatio="xMidYMid slice" class="a ocin"/></g><polygon points="760,0 748,0 600,${H} 612,${H}" fill="${WHT}" opacity=".9"/>` : "";
  const body = `
${backdrop(W, H, { seed: 11 })}
${oc}
<g class="a sweep"><rect x="-260" y="-40" width="150" height="${H + 80}" fill="url(#sw)" transform="skewX(-20)"/></g>
${k.svg}
${tiles}
${subTile}
<g class="a in5"><path d="${aka.d}" fill="${WHT}" transform="translate(${r(akaX - aka.bb.x1)} ${r(52 + 17 - aka.bh / 2 - aka.bb.y1)})"/></g>
<g class="a in6"><rect x="78" y="${tagY - 22}" width="7" height="${tagLines.length * 28 + 6}" fill="${RED}"/>${tagLines.map((ln, li) => { const tg = text("body", ln, 22, { upper: false }); return `<path d="${tg.d}" fill="${WHT}" transform="translate(${r(100 - tg.bb.x1)} ${r(tagY - 20 + li * 28 - tg.bb.y1)})"/>`; }).join("")}</g>
<g transform="translate(0 ${tkY}) skewY(-1.2)"><rect x="-20" y="0" width="${W + 40}" height="56" fill="${WHT}"/><rect x="-20" y="0" width="${W + 40}" height="5" fill="${RED}"/>
<g clip-path="url(#tk)"><g class="tick" transform="translate(0 40)"><g class="tk">${one}<g transform="translate(${segW} 0)">${one}</g></g></g></g></g>`;

  return svg({
    w: W,
    h: H,
    title: `${profile.name} — ${profile.title}`,
    defs: `${DOTS}<path id="mq" d="${mt.d}" fill="${BLK}"/><linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${WHT}" stop-opacity="0"/><stop offset=".5" stop-color="${WHT}" stop-opacity=".16"/><stop offset="1" stop-color="${WHT}" stop-opacity="0"/></linearGradient><clipPath id="ocp"><polygon points="760,0 1200,0 1200,${H} 612,${H}"/></clipPath><clipPath id="tk"><rect x="-20" y="2" width="${W + 40}" height="54"/></clipPath>`,
    css: `${COMMON_CSS}
.in0,.in1,.in2,.in3,.in4,.in5,.in6{animation:inL .9s cubic-bezier(.16,1,.3,1) both}
.in0{animation-delay:.05s}.in1{animation-delay:.2s}.in2{animation-delay:.38s}.in3{animation-delay:.56s}.in4{animation-delay:.8s}.in5{animation-delay:.95s}.in6{animation-delay:1.1s}
@keyframes inL{0%{transform:translateX(-780px)}62%{transform:translateX(26px)}100%{transform:none}}
.ocin{animation:ocin 1.2s .1s cubic-bezier(.16,1,.3,1) both}@keyframes ocin{from{transform:translateX(120px)}to{transform:none}}
.wig{animation:wig 7s ease-in-out infinite}
@keyframes wig{0%,90%,100%{transform:rotate(0)}92%{transform:rotate(-.7deg)}94.5%{transform:rotate(.6deg)}97%{transform:rotate(-.3deg)}}
.sweep{animation:sweep 6.5s ease-in-out infinite}
@keyframes sweep{0%,60%{transform:translateX(0)}100%{transform:translateX(1900px)}}
.tk{animation:tk 24s linear infinite}
@keyframes tk{to{transform:translateX(-${segW}px)}}`,
    body,
  });
}

/* ------------------------------------------------------------------ header section (kicker + judul) */
function header(label, title, { w = 1200, y = 40 } = {}) {
  const k = text("body", label, 20, { ls: 0.05 });
  const kc = chip({ t: k, x: 64, y, padX: 14, padY: 8, fill: BLK, ink: WHT, stroke: WHT, sw: 3, cls: "a in0" });
  const t = text("display", title, 86, { ls: 0.03 });
  const tt = tileSize(t, 30, 14);
  return {
    height: y + kc.h + 24 + tt.h,
    svg: `${kc.svg}${tile({ t, cx: 64 + tt.w / 2 + 6, cy: y + kc.h + 24 + tt.h / 2, padX: 30, padY: 14, fill: RED, ink: WHT, rot: -1.2, cls: "a in1", shadow: WHT })}`,
  };
}
const HEAD_CSS = `
.in0,.in1{animation:hin 1s cubic-bezier(.16,1,.3,1) both}.in1{animation-delay:.12s}
@keyframes hin{0%{transform:translateX(-500px)}60%{transform:translateX(18px)}100%{transform:none}}`;

/* ------------------------------------------------------------------ STATS */
function stats(profile) {
  const W = 1200;
  const hd = header("Ringkasan profil", "Profil");
  const rows = profile.stats ?? [];
  const top = hd.height + 50;
  const RH = 104;
  const H = top + rows.length * RH + 60;
  let body = "";
  rows.forEach((s, i) => {
    const y = top + i * RH;
    const nm = text("display", s.key, 46, { ls: 0.03 });
    const ds = wrap("body", s.skill, 19, 560, { upper: false })[0];
    const dt = text("body", ds + (wrap("body", s.skill, 19, 560, { upper: false }).length > 1 ? "…" : ""), 19, { upper: false });
    body += `<g class="row" style="animation-delay:${r(i * 0.12)}s">
${star(84, y + 40, 15, RT)}
${place(nm, 118, y + 18, WHT)}
${place(dt, 120, y + 66, MUT)}`;
    const lvl = Math.min(9, s.level);
    for (let p = 0; p < 9; p++) {
      const px = 700 + p * 42;
      body += `<g transform="translate(${px} ${y + 28}) skewX(-12)"><rect width="32" height="26" fill="none" stroke="${WHT}" stroke-width="3"/>${
        p < lvl
          ? `<rect class="a pip" x="0" y="0" width="32" height="26" fill="${RED}" stroke="${WHT}" stroke-width="3" style="animation-delay:${r(i * 0.4 + p * 0.1)}s"/>`
          : ""
      }</g>`;
    }
    const lv = text("body", `LV ${lvl}`, 22, { ls: 0.05 });
    body += place(lv, W - 64 - lv.bw, y + 28 + 2, RT);
    body += `<rect x="64" y="${y + RH - 8}" width="${W - 128}" height="2" fill="${WHT}" opacity=".12"/></g>`;
  });
  const cur = `<g class="a cur"><rect x="52" y="${top - 6}" width="${W - 104}" height="${RH - 8}" fill="${WHT}" opacity=".07" transform="skewX(-6)"/><polygon points="40,${top + 26} 62,${top + 40} 40,${top + 54}" fill="${RED}"/></g>`;
  const steps = rows.length || 1;
  const kf = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * 100;
    const b = ((i + 0.8) / steps) * 100;
    return `${r(a)}%,${r(b)}%{transform:translateY(${i * RH}px)}`;
  }).join("");
  return svg({
    w: W,
    h: H,
    title: "Ringkasan profil — kompetensi",
    defs: DOTS,
    css: `${COMMON_CSS}${HEAD_CSS}
.row{animation:rowin .8s cubic-bezier(.16,1,.3,1) both}
@keyframes rowin{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
.pip{transform-origin:left center;animation:pip 9s ease-in-out infinite}
@keyframes pip{0%,4%{opacity:0;transform:scaleX(.1)}9%,86%{opacity:1;transform:none}94%,100%{opacity:0;transform:scaleX(.1)}}
.cur{animation:cur ${steps * 2.4}s ease-in-out infinite}
@keyframes cur{${kf}}`,
    body: `${backdrop(W, H, { seed: 5 })}${hd.svg}${cur}${body}`,
  });
}

/* ------------------------------------------------------------------ SKILLS */
function stack(profile) {
  const W = 1200;
  const hd = header("Keahlian & teknologi", "Skills");
  const groups = profile.skills ?? [];
  const colW = 520;
  let body = "";
  let maxY = 0;
  let tagN = 0;
  groups.forEach((g, gi) => {
    const col = gi % 2;
    const x0 = 64 + col * (colW + 50);
    const prev = groups.slice(0, gi).filter((_, j) => j % 2 === col);
    const yBase = hd.height + 50 + (col === 0 ? rowY.l : rowY.r);
    void prev;
    let y = yBase;
    const lab = text("body", g.group, 24, { ls: 0.05 });
    const lc = tile({ t: lab, cx: x0 + (lab.bw + 36) / 2, cy: y + 20, padX: 18, padY: 9, fill: WHT, ink: BLK, rot: -1 });
    body += lc;
    y += 62;
    let x = x0;
    for (const it of g.items.filter(realItem)) {
      const t = text("body", it, 19, { ls: 0.03 });
      const w = t.bw + 28;
      if (x + w > x0 + colW) {
        x = x0;
        y += 52;
      }
      const c = chip({ t, x, y, padX: 14, padY: 8, ink: WHT, stroke: WHT, cls: "tg", style: `animation-delay:${r(tagN * 0.42)}s` });
      body += c.svg;
      x += w + 14;
      tagN++;
    }
    const used = y + 52 - yBase + 20;
    if (col === 0) rowY.l += used;
    else rowY.r += used;
    maxY = Math.max(maxY, y + 52);
  });
  const H = maxY + 50;
  return svg({
    w: W,
    h: H,
    title: "Skills — keahlian & teknologi",
    defs: DOTS,
    css: `${COMMON_CSS}${HEAD_CSS}
.tg .bx{animation:hi 16s ease-in-out infinite;animation-delay:inherit}
.tg{animation:none}
.tg .bx{animation-delay:inherit}
@keyframes hi{0%,5%,100%{fill:transparent}1.5%{fill:${RED}}}`,
    body: `${backdrop(W, H, { seed: 8 })}${hd.svg}${body}`,
  });
}
const rowY = { l: 0, r: 0 };

/* ------------------------------------------------------------------ HEISTS */
function heists(list) {
  const W = 1200;
  const hd = header("Daftar proyek", "Proyek");
  const top = hd.height + 56;
  const CW = 520;
  const CH = 210;
  const rowsN = Math.ceil(list.length / 2);
  const H = top + rowsN * (CH + 46) + 30;
  let body = "";
  list.forEach((h, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 74 + col * (CW + 70);
    const y = top + row * (CH + 46) + (col ? 30 : 0);
    const d = r(i * 0.35);
    const done = h.status === "Secured" || h.status === "Selesai";
    const stLabel = done ? "Selesai" : "Berjalan";
    const idt = text("body", `Proyek ${String(i + 1).padStart(2, "0")}`, 16, { ls: 0.06 });
    const nm = wrap("accent", h.codename, 34, CW - 60, { ls: 0.02 }).slice(0, 2);
    let inner = place(idt, 24, 22, RED);
    const st = text("body", stLabel, 14, { ls: 0.06 });
    const stc = chip({ t: st, x: CW - 24 - (st.bw + 24) - 8, y: 16, padX: 12, padY: 6, fill: BLK, ink: WHT, stroke: BLK, sw: 1 });
    inner += stc.svg;
    nm.forEach((ln, k) => {
      const t = text("accent", ln, 34, { ls: 0.02 });
      inner += place(t, 24, 60 + k * 44, BLK);
    });
    let lx = 24;
    let ly = CH - 52;
    (h.loot ?? []).filter(realItem).slice(0, 6).forEach((l) => {
      const t = text("body", l, 14, { ls: 0.03 });
      const w = t.bw + 24;
      if (lx + w > CW - 24) {
        lx = 24;
        ly -= 34;
      }
      inner += chip({ t, x: lx, y: ly, padX: 10, padY: 5, ink: BLK, stroke: BLK, sw: 2 }).svg;
      lx += w + 10;
    });
    const stamp = text("accent", stLabel, 30, { ls: 0.04 });
    const sw = stamp.bw + 30;
    const stampSvg = `<g transform="translate(${CW - 40 - sw / 2} ${CH - 60}) rotate(-12)"><g class="a st" style="animation-delay:${r(d + 1.2)}s"><rect x="${r(-sw / 2)}" y="-27" width="${r(sw)}" height="54" fill="none" stroke="${done ? RED : BLK}" stroke-width="5"/>${center(stamp, done ? RED : BLK)}</g></g>`;
    body += `<g transform="translate(${x} ${y}) skewX(-6)"><g class="a card" style="animation-delay:${d}s">
<rect x="9" y="9" width="${CW}" height="${CH}" fill="${done ? RED : WHT}"/>
<rect width="${CW}" height="${CH}" fill="${WHT}" stroke="${BLK}" stroke-width="4"/>
<g transform="skewX(6)">${inner}${stampSvg}</g></g></g>`;
  });
  return svg({
    w: W,
    h: H,
    title: "Proyek — daftar proyek",
    defs: DOTS,
    css: `${COMMON_CSS}${HEAD_CSS}
.card{animation:card 12s cubic-bezier(.16,1,.3,1) infinite}
@keyframes card{0%{opacity:0;transform:translateY(46px)}5%,90%{opacity:1;transform:none}98%,100%{opacity:0;transform:translateY(-20px)}}
.st{animation:st 12s cubic-bezier(.2,1.4,.3,1) infinite;opacity:0}
@keyframes st{0%,2%{opacity:0;transform:scale(3.2)}7%,90%{opacity:1;transform:scale(1)}98%,100%{opacity:0}}`,
    body: `${backdrop(W, H, { seed: 13 })}${hd.svg}${body}`,
  });
}

/* ------------------------------------------------------------------ CONFIDANT */
function confidants(list) {
  const W = 1200;
  const hd = header("Relasi profesional", "Referensi");
  const top = hd.height + 56;
  const n = Math.max(1, Math.min(4, list.length));
  const CW = (W - 128 - (n - 1) * 36) / n - 10;
  const CH = 400;
  const H = top + CH + 70;
  let body = "";
  list.slice(0, 4).forEach((c, i) => {
    const x = 74 + i * (CW + 46);
    const rn = text("display", String(i + 1).padStart(2, "0"), 70, { ls: 0.02 });
    const ar = wrap("display", c.role ?? "", 26, CW - 56, { ls: 0.01 });
    let inner = place(rn, 24, 30, RT);
    ar.slice(0, 3).forEach((ln, k) => (inner += place(text("display", ln, 26, { ls: 0.01 }), 24, 130 + k * 34, WHT)));
    const nm = realItem(c.name) ? wrap("body", c.name ?? "", 16, CW - 50, { upper: false }).slice(0, 2) : [];
    nm.forEach((ln, k) => (inner += place(text("body", ln, 16, { upper: false }), 24, 130 + Math.min(ar.length, 3) * 34 + 12 + k * 24, MUT)));
    body += `<g transform="translate(${r(x)} ${top}) skewX(-6)"><g class="a cd" style="animation-delay:${r(i * -1.3)}s">
<rect x="11" y="11" width="${r(CW)}" height="${CH}" fill="${RED}"/>
<rect width="${r(CW)}" height="${CH}" fill="${BLK}" stroke="${WHT}" stroke-width="4"/>
<g transform="skewX(6)">${inner}</g>
<g class="a shine"><rect x="-120" y="0" width="70" height="${CH}" fill="url(#sh)" transform="skewX(-14)" style="animation-delay:${r(i * 0.9)}s"/></g></g></g>`;
  });
  return svg({
    w: W,
    h: H,
    title: "Referensi — relasi profesional",
    defs: `${DOTS}<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="${WHT}" stop-opacity="0"/><stop offset=".5" stop-color="${WHT}" stop-opacity=".22"/><stop offset="1" stop-color="${WHT}" stop-opacity="0"/></linearGradient>`,
    css: `${COMMON_CSS}${HEAD_CSS}
.cd{animation:cd 5.5s ease-in-out infinite}
@keyframes cd{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-12px) rotate(.5deg)}}
.shine rect{animation:shine 6s ease-in-out infinite}
@keyframes shine{0%,55%{transform:translateX(0)}100%{transform:translateX(${CW + 260}px)}}`,
    body: `${backdrop(W, H, { seed: 21 })}${hd.svg}${body}`,
  });
}

/* ------------------------------------------------------------------ JUKEBOX */
function jukebox(tracks) {
  const W = 1200;
  const H = 560;
  const PX = 210;
  const PW = 780;
  const PY = 70;
  const PH = 440;
  const list = tracks.length ? tracks : [{ title: "No tracks yet", duration: "" }];

  const jk = text("display", "Juke", 62, { ls: 0.02 });
  const bx = text("display", "Box", 62, { ls: 0.02 });
  const bgm = text("body", "BGM", 15, { ls: 0.08 });
  const j1 = tile({ t: jk, cx: PX + 28 + (jk.bw + 36) / 2, cy: PY - 8, padX: 18, padY: 10, fill: WHT, ink: BLK, rot: -3, shadow: RED });
  const j2 = tile({ t: bx, cx: PX + 28 + jk.bw + 36 + (bx.bw + 36) / 2 - 6, cy: PY - 6, padX: 18, padY: 10, fill: BLK, ink: WHT, rot: 2, shadow: RED });
  const j3 = tile({ t: bgm, cx: PX + 28 + jk.bw + bx.bw + 80 + (bgm.bw + 24) / 2, cy: PY + 12, padX: 12, padY: 6, fill: WHT, ink: BLK, rot: -1, shadow: RED });

  const first = text("display", list[0].title, 40, { ls: 0.02 });
  const np = text("body", "Now playing", 14, { ls: 0.06 });
  let rows = "";
  list.slice(0, 5).forEach((t, i) => {
    const ry = PY + 292 + i * 44;
    const nm = text("body", t.title, 19, { ls: 0.02 });
    const dur = text("body", t.duration || "", 16);
    const num = text("body", String(i + 1), 15);
    rows += `<g transform="translate(${PX + 54} ${ry}) skewX(-12)"><rect width="${PW - 108}" height="38" fill="${BLK}"${i === 0 ? ` stroke="${WHT}" stroke-width="2.5"` : ` opacity=".55"`}/></g>
<circle cx="${PX + 54 + 30}" cy="${ry + 19}" r="12" fill="${i === 0 ? RT : WHT}"/>
<g transform="translate(${PX + 54 + 30} ${ry + 19})">${center(num, BLK)}</g>
${place(nm, PX + 54 + 56, ry + 19 - nm.bh / 2, WHT)}${dur.bw ? place(dur, PX + PW - 54 - 24 - dur.bw, ry + 19 - dur.bh / 2, WHT) : ""}`;
  });

  const bars = Array.from({ length: 5 }, (_, i) => `<rect class="a eqb" x="${PX + PW - 120 + i * 16}" y="${PY + 78}" width="9" height="40" fill="${WHT}" style="animation-delay:${r(i * -0.23)}s;animation-duration:${r(0.7 + i * 0.13)}s"/>`).join("");

  const ctrl = (x, w, fill, ink, iconD, bw = 3) =>
    `<g transform="translate(${x} ${PY + 220}) skewX(-12)"><rect width="${w}" height="52" fill="${fill}" stroke="${fill === WHT ? BLK : WHT}" stroke-width="${bw}"/><g transform="skewX(12) translate(${w / 2} 26)">${iconD(ink)}</g></g>`;
  const prev = (c) => `<polygon points="8,-11 -6,0 8,11" fill="${c}"/><rect x="-12" y="-11" width="4" height="22" fill="${c}"/>`;
  const next = (c) => `<polygon points="-8,-11 6,0 -8,11" fill="${c}"/><rect x="8" y="-11" width="4" height="22" fill="${c}"/>`;
  const play = (c) => `<polygon points="-8,-13 12,0 -8,13" fill="${c}"/>`;
  const shuf = (c) => `<path d="M-14 -8 H-6 L6 8 H14 M-14 8 H-6 L-2 3 M2 -3 L6 -8 H14" stroke="${c}" stroke-width="3.2" fill="none"/>`;

  const body = `${backdrop(W, H, { seed: 31, shards: false })}
<g transform="rotate(-1.5 ${PX + PW} ${PY + PH})"><g filter="url(#dsh)">
<polygon points="${PX},${PY + 14} ${PX + PW},${PY} ${PX + PW - 12},${PY + PH} ${PX + 12},${PY + PH - 12}" fill="${RED}"/></g>
${j1}${j2}${j3}
${tile({ t: text("body", "x", 22), cx: PX + PW - 14, cy: PY - 22, padX: 11, padY: 9, fill: BLK, ink: WHT, stroke: WHT, sw: 3 })}
<g class="a np"><rect x="${PX + 40}" y="${PY + 58}" width="${r(np.bw + 20)}" height="${r(np.bh + 12)}" fill="${WHT}" transform="skewX(-12)"/>${place(np, PX + 50, PY + 64, BLK)}</g>
<g transform="translate(${PX + 40} ${PY + 92}) skewX(-12)"><rect width="${PW - 200}" height="${r(first.bh + 28)}" fill="${BLK}"/><rect x="6" y="6" width="${PW - 200}" height="${r(first.bh + 28)}" fill="none" stroke="${WHT}" stroke-width="3"/><g transform="skewX(12)">${place(first, 24, 14, WHT)}</g></g>
${bars}
<g transform="translate(${PX + 40} ${PY + 176}) skewX(-12)"><rect width="${PW - 80}" height="10" fill="${WHT}"/><rect class="a prog" width="${PW - 80}" height="10" fill="${BLK}"/></g>
${place(text("body", "0:00", 14), PX + 44, PY + 194, WHT)}${place(text("body", list[0].duration || "", 14), PX + PW - 44 - text("body", list[0].duration || "", 14).bw, PY + 194, WHT)}
${ctrl(PX + 60, 62, BLK, WHT, prev)}${ctrl(PX + 190, 92, WHT, BLK, play)}${ctrl(PX + 350, 62, BLK, WHT, next)}${ctrl(PX + 480, 62, BLK, WHT, shuf)}
${rows}</g>`;

  return svg({
    w: W,
    h: H,
    title: "Jukebox — playlist original (Suno)",
    defs: `${DOTS}<filter id="dsh" x="-5%" y="-5%" width="115%" height="120%"><feDropShadow dx="9" dy="9" stdDeviation="0" flood-color="${WHT}"/></filter>`,
    css: `${COMMON_CSS}
.eqb{transform-origin:bottom;transform-box:fill-box;animation:eq .9s ease-in-out infinite}
@keyframes eq{0%,100%{transform:scaleY(.2)}50%{transform:scaleY(1)}}
.prog{transform-origin:right center;animation:prog 12s linear infinite}
@keyframes prog{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.trk{opacity:0;animation:trk 8s steps(1,end) infinite}
@keyframes trk{0%{opacity:1}50%{opacity:0}}
.np{animation:np 1.6s ease-in-out infinite}
@keyframes np{0%,100%{opacity:1}50%{opacity:.55}}`,
    body,
  });
}

/* ------------------------------------------------------------------ KARTU FOOTER */
function callingCard(profile) {
  const W = 1200;
  const H = 440;
  const big = text("display", "Mari berkolaborasi", 132, { ls: 0.02 });
  const bw = Math.min(big.bw, W - 160);
  const sc = bw / big.bw;
  const cx = W / 2;
  const cy = 190;
  const layer = (dx, dy, fill, cls, extra = "") =>
    `<g transform="translate(${cx + dx} ${cy + dy}) skewX(-8) scale(${r(sc)})"><g class="${cls}">${center(big, fill, extra)}</g></g>`;
  const slashes = [-1, 1].map((s, i) => `<g class="a bar${i}"><rect x="${s < 0 ? -40 : W - 360}" y="${s < 0 ? 40 : 410}" width="400" height="14" fill="${i ? WHT : RED}" transform="skewX(-30)"/></g>`).join("");
  const tag = text("body", profile.tagline, 28, { upper: false });
  const links = [
    ["GitHub", profile.links?.github],
    ["LinkedIn", profile.links?.linkedin],
    ["Instagram", profile.links?.instagram],
  ].filter(([, u]) => u);
  let lx = 0;
  const chips = links.map(([n], i) => {
    const t = text("body", n, 20, { ls: 0.05 });
    const w = t.bw + 40;
    const c = chip({ t, x: lx, y: 0, padX: 20, padY: 9, fill: i === 1 ? RED : i === 2 ? WHT : BLK, ink: i === 2 ? BLK : WHT, stroke: i === 2 ? BLK : WHT, sw: 3 });
    lx += w + 24;
    return c.svg;
  });
  const lw = lx - 24;
  const body = `${backdrop(W, H, { seed: 41 })}${slashes}
<g class="a g3">${layer(7, 5, RED, "")}</g>
<g class="a g2">${layer(-5, -3, WHT, "", 'opacity=".55"')}</g>
${layer(0, 0, WHT, "a main")}
<g transform="translate(${W / 2} 322)"><path d="${tag.d}" fill="${WHT}" transform="translate(${r(-tag.bw / 2 - tag.bb.x1)} ${r(-tag.bh / 2 - tag.bb.y1)})"/></g>
<g transform="translate(${r((W - lw) / 2)} 356)">${chips.join("")}</g>`;
  return svg({
    w: W,
    h: H,
    title: "Mari berkolaborasi",
    defs: DOTS,
    css: `${COMMON_CSS}
.g3{animation:g3 3.2s steps(1,end) infinite}
@keyframes g3{0%,86%{transform:translate(0,0)}88%{transform:translate(8px,-3px)}90%{transform:translate(-6px,2px)}92%,100%{transform:translate(0,0)}}
.g2{animation:g2 3.2s steps(1,end) infinite}
@keyframes g2{0%,85%{transform:translate(0,0)}87%{transform:translate(-9px,2px)}89%{transform:translate(7px,-2px)}91%,100%{transform:translate(0,0)}}
.main{animation:pop 3.2s ease-in-out infinite}
@keyframes pop{0%,86%,100%{transform:scale(1)}90%{transform:scale(1.015)}}
.bar0{animation:b0 4s ease-in-out infinite alternate}.bar1{animation:b1 4s ease-in-out infinite alternate}
@keyframes b0{from{transform:translateX(-60px)}to{transform:translateX(60px)}}
@keyframes b1{from{transform:translateX(60px)}to{transform:translateX(-60px)}}`,
    body,
  });
}

/* ------------------------------------------------------------------ DIVIDER */
function divider() {
  const W = 1200;
  const H = 40;
  let bars = "";
  for (let i = -2; i < 28; i++) bars += `<polygon points="${i * 60},0 ${i * 60 + 36},0 ${i * 60 + 16},${H} ${i * 60 - 20},${H}" fill="${i % 4 === 0 ? WHT : RED}"/>`;
  return svg({
    w: W,
    h: H,
    title: "",
    css: `.rl{animation:rl 3s linear infinite}@keyframes rl{to{transform:translateX(-240px)}}`,
    defs: `<clipPath id="c"><polygon points="0,6 ${W},0 ${W},${H - 6} 0,${H}"/></clipPath>`,
    body: `<rect width="${W}" height="${H}" fill="${BLK}"/><g clip-path="url(#c)"><g class="rl">${bars}</g></g>`,
  });
}

/* ------------------------------------------------------------------ TEMPLATE -> README */
function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Placeholder {{${k}}} tidak dikenal di template`);
    return vars[k];
  });
}
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const bar = (n, max = 9) => "▰".repeat(Math.min(n, max)) + "▱".repeat(Math.max(0, max - n));

function build() {
  const profile = readJson("api/data/profile.json", {});
  const heistList = readJson("api/data/heists.json", []);
  const confList = readJson("api/data/confidants.json", []);
  const pl = readJson("web/public/music/playlist.json", { tracks: [] });
  const tracks = (Array.isArray(pl) ? pl : pl.tracks ?? []).filter((t) => {
    try {
      return fs.existsSync(P("web/public/music", t.file));
    } catch {
      return false;
    }
  });
  const pkg = readJson("web/package.json", {});
  const ver = (n) => String(pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? "").replace(/^[^\d]*/, "").split(".")[0];

  console.log("Membuat aset SVG…");
  write("hero.svg", hero(profile));
  write("stats.svg", stats(profile));
  write("skills.svg", stack(profile));
  write("heists.svg", heists(heistList));
  write("confidant.svg", confidants(confList));
  write("jukebox.svg", jukebox(tracks));
  write("calling-card.svg", callingCard(profile));
  write("divider.svg", divider());

  const statsTable = (profile.stats ?? []).map((s) => `| **${cell(s.key)}** | \`${bar(s.level)}\` ${s.level} | ${cell(s.skill)} |`).join("\n");
  const heistsTable = heistList
    .map((h) => `| **${cell(h.codename)}** | ${h.status === "Secured" || h.status === "Selesai" ? "`SELESAI`" : "`BERJALAN`"} | ${cell(h.target)} | ${cell((h.loot ?? []).filter(realItem).join(", "))} |`)
    .join("\n");
  const confTable = confList.map((c) => `| **${cell(c.role)}** | ${cell(c.name)} |`).join("\n");
  const trackTable = tracks.length
    ? tracks.map((t, i) => `| ${String(i + 1).padStart(2, "0")} | ${cell(t.title)}${t.artist ? ` — ${cell(t.artist)}` : ""} | ${cell(t.duration)} |`).join("\n")
    : "| — | Belum ada lagu | — |";
  const skillsList = (profile.skills ?? []).map((g) => `- **${cell(g.group)}:** ${g.items.filter(realItem).map((i) => `\`${i}\``).join(" · ")}`).join("\n");
  const exp = (profile.experience ?? []).map((e) => `- **${cell(e.role)}** — ${cell(e.org)}${e.period && !/EDIT/.test(e.period) ? ` _(${cell(e.period)})_` : ""}`).join("\n");

  const tpl = fs.readFileSync(P("scripts/README.template.md"), "utf8");
  const out = fill(tpl, {
    NAME: profile.name ?? "",
    NICK: profile.nickname ?? "",
    TITLE: profile.title ?? "",
    TAGLINE: profile.tagline ?? "",
    BIO: profile.bio ?? "",
    UNIVERSITY: profile.university ?? "",
    GITHUB: profile.links?.github ?? "#",
    LINKEDIN: profile.links?.linkedin ?? "#",
    INSTAGRAM: profile.links?.instagram ?? "#",
    NEXT_V: ver("next") || "16",
    TAILWIND_V: ver("tailwindcss") || "3",
    STATS_TABLE: statsTable,
    HEISTS_TABLE: heistsTable,
    CONFIDANT_TABLE: confTable,
    TRACK_TABLE: trackTable,
    SKILLS_LIST: skillsList,
    EXPERIENCE_LIST: exp,
    HEIST_COUNT: String(heistList.length),
    TRACK_COUNT: String(tracks.length),
    SECURED_COUNT: String(heistList.filter((h) => h.status === "Secured" || h.status === "Selesai").length),
  });
  fs.writeFileSync(P("README.md"), out);
  console.log(`README.md ditulis (${(out.length / 1024).toFixed(1)} KB)`);
}

build();
