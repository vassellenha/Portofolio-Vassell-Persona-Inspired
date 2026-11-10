"use client";
// Pembuka situs, digambar di <canvas> dan disinkronkan ke audio:
//   langsung jalan saat halaman dibuka: tinta putih -> layar merah + siluet
//   -> kaca retak, siluet melompat, debu -> kolase keping berisi potongan ilustrasi -> pecah ke gelap
//   -> serangan beruntun (sapuan tinta hitam + kilatan bintang) -> bintang putih & merah
//   -> siluet mendarat, berdiri -> ilustrasi penuh + nama, tepat saat lagu masuk bagian puncak.
// Jam animasi mengikuti posisi lagu (lib/bgm.js), jadi gambar, SFX (public/sfx/intro.mp3) dan musik selalu serempak.
// Sekali per sesi; Esc / "Lewati" menutup. Dilewati sepenuhnya bila prefers-reduced-motion.
import { useEffect, useRef } from "react";
import { sharedAudio } from "../lib/bgm";
import { isSfxOn, sfxOutput } from "../lib/sfx";

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const FONT = '"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';
const RED = "#f40000";
const PANE = "#e8140a";
// Suara bawaan sengaja pelan; pengunjung bisa mengeraskan dari Jukebox.
const SFX_GAIN = 0.3;
const MUSIC_VOL = 0.25;

// Garis waktu (detik). Sama dengan garis waktu SFX di public/sfx/intro.mp3.
const T = {
  red: 0.125,
  crack: 0.5,
  jumps: [0.71, 0.79, 0.875, 0.92],
  collage: 1.146,
  glint: 1.21,
  shatter: 1.976,
  black: 2.1,
  redIn: 2.393,
  music: 2.425,
  attack: 2.476,
  giant: 4.37,
  white: 4.47,
  rstar: 4.75,
  rburst: 4.83,
  red2: 4.96,
  fall: 5.41,
  land: 5.6,
  rise: 5.9,
  stand: 6.25,
  snap: 6.68,
  zoom: 7.116,
  flash: 7.136,
  art: 7.178,
  plate: 7.5,
  out: 8.8,
};
const HITS = [2.69, 2.77, 2.84, 2.88, 2.93, 2.98, 3.04, 3.1, 3.16, 3.23, 3.27, 3.36, 3.43, 3.49, 3.56, 3.6, 3.65, 3.7, 3.78, 3.86, 3.94, 3.98, 4.05, 4.1, 4.14, 4.2, 4.25, 4.3];
const STRONG = new Set([2.69, 3.04, 3.16, 3.36, 3.49, 3.86, 3.94, 4.14, 4.25]);

// Posisi potongan ilustrasi (oc-cut.webp) di dalam ilustrasi penuh (oc.jpg 1600x900)
const ART = { w: 1600, h: 900, fx: 0.62, cut: { x: 472, y: 2, w: 878, h: 898 } };

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- bentuk tinta / asap berlidah api ---------- */
function blobPath(ctx, cx, cy, R, phi, k = 7, amp = 0.3) {
  const n = 168;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    let u = (a * k) / TAU + phi;
    u -= Math.floor(u);
    const l = Math.pow(u, 1.9);
    const r = R * (0.76 + amp * l + 0.05 * Math.sin(a * 5 + phi * 3));
    const ang = a + 0.2 * l;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/* ---------- figur siluet berartikulasi ---------- */
const POSE = {
  stand: { lean: 0.03, tL: 0.07, kL: 0.06, tR: -0.09, kR: 0.05, aL: 0.14, eL: 0.2, aR: -0.12, eR: 0.25, coat: 0.05 },
  ready: { lean: 0.28, tL: 0.55, kL: 0.8, tR: -0.1, kR: 0.5, aL: 0.5, eL: 0.6, aR: -0.5, eR: 0.7, coat: 0.2 },
  crouch: { lean: 0.62, tL: 1.2, kL: 2.05, tR: 0.45, kR: 1.95, aL: 0.75, eL: 0.5, aR: -0.2, eR: 1.0, coat: 0.38 },
  leap: { lean: 0.06, tL: 0.3, kL: 0.55, tR: -0.25, kR: 0.25, aL: 2.75, eL: 0.25, aR: -0.6, eR: 0.3, coat: 0.5 },
  dash: { lean: 1.05, tL: 1.25, kL: 0.5, tR: -0.9, kR: 0.9, aL: 1.9, eL: 0.2, aR: -1.2, eR: 0.5, coat: 0.9 },
};
function mixPose(a, b, k) {
  const o = {};
  for (const key in a) o[key] = lerp(a[key], b[key], k);
  return o;
}
// (x, y) = titik pijak; h = tinggi figur saat berdiri
function drawFig(ctx, x, y, h, p, o = {}) {
  const dir = (a) => [Math.sin(a), Math.cos(a)];
  const TH = 0.245;
  const SH = 0.245;
  const TO = 0.3;
  const HR = 0.074;
  const UA = 0.15;
  const FA = 0.15;
  const kL = [TH * dir(p.tL)[0], TH * dir(p.tL)[1]];
  const fL = [kL[0] + SH * dir(p.tL - p.kL)[0], kL[1] + SH * dir(p.tL - p.kL)[1]];
  const kR = [TH * dir(p.tR)[0], TH * dir(p.tR)[1]];
  const fR = [kR[0] + SH * dir(p.tR - p.kR)[0], kR[1] + SH * dir(p.tR - p.kR)[1]];
  const neck = [TO * Math.sin(p.lean), -TO * Math.cos(p.lean)];
  const head = [neck[0] + (0.03 + HR) * Math.sin(p.lean * 1.15), neck[1] - (0.03 + HR) * Math.cos(p.lean * 1.15)];
  const sh = [neck[0] * 0.93, neck[1] * 0.93];
  const arm = (a, e) => {
    const el = [sh[0] + UA * dir(a)[0], sh[1] + UA * dir(a)[1]];
    return [el, [el[0] + FA * dir(a + e)[0], el[1] + FA * dir(a + e)[1]]];
  };
  const [eL, hL] = arm(p.aL, p.eL);
  const [eR, hR] = arm(p.aR, p.eR);
  const ground = o.air ? 0 : Math.max(fL[1], fR[1]);
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.flip ? -1 : 1) * h, h);
  ctx.translate(0, -ground);
  ctx.fillStyle = ctx.strokeStyle = o.color || "#080000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const limb = (a, b, w) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  // mantel
  const cl = (o.coatLen ?? 0.3) * (1 - 0.35 * p.coat);
  const back = -0.07 - 0.34 * p.coat;
  ctx.beginPath();
  ctx.moveTo(sh[0] - 0.075, sh[1] + 0.01);
  ctx.quadraticCurveTo(-0.11, 0.0, back, cl * (1 - 0.75 * p.coat));
  ctx.lineTo(back * 0.55 - 0.02, cl);
  ctx.lineTo(0.02, cl * 0.92);
  ctx.lineTo(0.085 + 0.05 * p.coat, cl * 0.9);
  ctx.quadraticCurveTo(0.1, 0.0, sh[0] + 0.075, sh[1] + 0.01);
  ctx.closePath();
  ctx.fill();
  limb(sh, eR, 0.05);
  limb(eR, hR, 0.042);
  limb([0, 0], kR, 0.078);
  limb(kR, fR, 0.058);
  limb([0, 0], kL, 0.078);
  limb(kL, fL, 0.058);
  limb(fL, [fL[0] + 0.05, fL[1] + 0.005], 0.04);
  limb(fR, [fR[0] + 0.05, fR[1] + 0.005], 0.04);
  limb([0, 0], sh, 0.15);
  limb(sh, eL, 0.05);
  limb(eL, hL, 0.042);
  // kepala + rambut
  ctx.beginPath();
  ctx.arc(head[0], head[1], HR, 0, TAU);
  ctx.fill();
  const spikes = o.hair ?? 9;
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const a = Math.PI * 0.9 + (i / (spikes * 2)) * Math.PI * 1.25;
    const r = HR * (i % 2 ? 1.5 : 0.98);
    const px = head[0] + Math.cos(a) * r - 0.012;
    const py = head[1] + Math.sin(a) * r * 0.95;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.fill();
  ctx.restore();
}
// Pose jatuh tampak depan: tangan terentang, ujung mantel mengembang
function drawFall(ctx, x, y, h, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(h, h);
  ctx.fillStyle = ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const line = (pts, w) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  };
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(s * 0.05, -0.27);
    ctx.bezierCurveTo(s * 0.2, -0.24, s * 0.36, -0.3, s * 0.5, -0.2);
    ctx.bezierCurveTo(s * 0.5, -0.02, s * 0.44, 0.12, s * 0.34, 0.2);
    ctx.bezierCurveTo(s * 0.26, 0.08, s * 0.16, 0.06, s * 0.06, 0.16);
    ctx.closePath();
    ctx.fill();
  });
  line([[0, -0.29], [0, 0.04]], 0.17);
  line([[-0.06, -0.28], [-0.22, -0.31], [-0.4, -0.35]], 0.06);
  line([[0.06, -0.28], [0.23, -0.29], [0.41, -0.25]], 0.06);
  line([[-0.04, 0.02], [-0.06, 0.27], [-0.08, 0.52]], 0.085);
  line([[0.04, 0.02], [0.13, 0.2], [0.08, 0.36]], 0.085);
  ctx.beginPath();
  ctx.arc(0.01, -0.4, 0.074, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * 0.95 + (i / 18) * Math.PI * 1.1;
    const r = 0.074 * (i % 2 ? 1.5 : 0.98);
    const px = 0.01 + Math.cos(a) * r;
    const py = -0.4 + Math.sin(a) * r;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.fill();
  ctx.restore();
}

/* ---------- geometri kaca retak ---------- */
function buildGlass(W, H, rand) {
  const C = [W * 0.43, H * 0.47];
  const D = Math.hypot(W, H);
  const NR = 9;
  const LV = [0, 0.07, 0.2, 0.42, 1.25];
  const P = [];
  for (let r = 0; r < NR; r++) {
    let a = (r / NR) * TAU + 0.35 + (rand() - 0.5) * 0.3;
    const row = [];
    for (let l = 0; l < LV.length; l++) {
      if (l === 0) row.push([C[0], C[1]]);
      else {
        a += (rand() - 0.5) * 0.16;
        const rr = LV[l] * D * (0.75 + rand() * 0.5);
        row.push([C[0] + Math.cos(a) * rr, C[1] + Math.sin(a) * rr * 0.9]);
      }
    }
    P.push(row);
  }
  const segs = [];
  const link = [];
  for (let r = 0; r < NR; r++) {
    for (let l = 0; l < LV.length - 1; l++) segs.push({ a: P[r][l], b: P[r][l + 1], w: l === 0 ? 2.2 + rand() * 2 : 1.5 + rand() * 5.5 });
    link.push([false, rand() < 0.92, rand() < 0.7, rand() < 0.45, true]);
  }
  const radial = segs.length;
  const cells = [];
  for (let r = 0; r < NR; r++) {
    const r2 = (r + 1) % NR;
    let from = 0;
    for (let l = 1; l < LV.length; l++) {
      if (!link[r][l]) continue;
      if (l < LV.length - 1) segs.push({ a: P[r][l], b: P[r2][l], w: 1 + rand() * 3.2 });
      const poly = [];
      for (let i = from; i <= l; i++) poly.push(P[r][i]);
      for (let i = l; i >= Math.max(from, 1); i--) poly.push(P[r2][i]);
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
      const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      cells.push({ poly, cx, cy, lv: l, shade: 43.5 + rand() * 6, tone: rand(), spin: (rand() - 0.5) * 1.8 });
      from = l;
    }
  }
  // retak cabang pendek
  for (let i = 0; i < 12; i++) {
    const s = segs[Math.floor(rand() * radial)];
    const k = 0.25 + rand() * 0.6;
    const a = [lerp(s.a[0], s.b[0], k), lerp(s.a[1], s.b[1], k)];
    const an = Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]) + (rand() < 0.5 ? 1 : -1) * (0.5 + rand() * 0.6);
    const len = D * (0.03 + rand() * 0.07);
    segs.push({ a, b: [a[0] + Math.cos(an) * len, a[1] + Math.sin(an) * len], w: 1 + rand() * 2 });
  }
  return { C, D, cells, segs };
}

// Menutup intro. Kelas no-wipe mencegah wipe bawaan halaman ikut berjalan lagi sesudahnya.
function endIntro() {
  const root = document.documentElement;
  root.classList.add("no-wipe");
  root.classList.remove("intro");
  try {
    sessionStorage.setItem("p5:intro", "1");
  } catch {}
}

export default function Intro({ cue = null }) {
  const ref = useRef(null);
  const wrap = useRef(null);
  const ctl = useRef(null);
  const src = cue?.src;
  const at = cue?.at;

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("intro")) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const P0 = src ? at - T.art : -1; // posisi lagu saat t = 0
    let W = 0;
    let H = 0;
    let G = null;
    let U = 1;
    let raf = 0;
    let outTimer = 0;
    let waitTimer = 0;
    let dead = false;
    let running = false;
    let exiting = false;
    let unlocked = !!navigator.userActivation?.hasBeenActive;
    let musicOn = false;
    let lateMusic = false;
    let assets = false;
    let aPerf = 0;
    let aT = 0;
    let sfxBuf = null;
    let sfxNode = null;
    let puffs = [];
    let smears = [];
    let flashes = [];
    let panels = [];
    const imgs = {};
    let darkCut = null;
    const audio = src && P0 >= 0 ? sharedAudio() : null;

    /* ----- aset ----- */
    const load = (url) =>
      new Promise((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = url;
      });
    const ready = Promise.all([load("/oc.jpg"), load("/oc-cut.webp")]).then(([oc, cut]) => {
      imgs.oc = oc;
      imgs.cut = cut;
      if (cut) {
        const c = document.createElement("canvas");
        c.width = cut.width;
        c.height = cut.height;
        const x = c.getContext("2d");
        x.drawImage(cut, 0, 0);
        x.globalCompositeOperation = "source-atop";
        x.fillStyle = "rgba(0,0,0,0.86)";
        x.fillRect(0, 0, c.width, c.height);
        darkCut = c;
      }
      assets = true;
    });
    const seek = () => {
      try {
        audio.currentTime = P0;
      } catch {}
    };
    if (audio) {
      audio.muted = true;
      // volume: pakai setelan Jukebox bila pengunjung pernah mengaturnya, kalau belum pakai bawaan yang pelan
      let vol = MUSIC_VOL;
      try {
        const pf = JSON.parse(localStorage.getItem("p5:jukebox") || "{}");
        if (pf && pf.v === 2 && typeof pf.vol === "number") vol = pf.vol;
      } catch {}
      audio.volume = vol;
      audio.preload = "auto";
      audio.src = src;
      audio.addEventListener("loadedmetadata", seek, { once: true });
      audio.load();
    }
    if (isSfxOn()) {
      fetch("/sfx/intro.mp3")
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((b) => {
          const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          return b && OC ? new OC(2, 1, 44100).decodeAudioData(b) : null;
        })
        .then((b) => (sfxBuf = b))
        .catch(() => {});
    }

    /* ----- ukuran + geometri ----- */
    function size() {
      W = window.innerWidth;
      H = window.innerHeight;
      U = Math.min(W, H * 1.78) / 1280;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      G = buildGlass(W, H, rng(23));
      const r = rng(5);
      puffs = Array.from({ length: 13 }, (_, i) => ({
        x: W * (0.2 + (i / 12) * 0.36 + (r() - 0.5) * 0.03),
        y: H * (0.7 + r() * 0.04),
        r: H * (0.035 + r() * 0.03),
        t: 0.7 + r() * 0.22,
        blobs: Array.from({ length: 6 }, () => ({ a: r() * TAU, d: 0.3 + r() * 0.7, s: 0.45 + r() * 0.55, j: Array.from({ length: 9 }, () => r()) })),
      }));
      // sapuan tinta hitam
      const r2 = rng(91);
      smears = [];
      for (let t = T.attack; t < T.giant - 0.05; t += 0.055 + r2() * 0.05) {
        const a = r2() * TAU;
        const cx = W * (0.25 + r2() * 0.5);
        const cy = H * (0.25 + r2() * 0.5);
        const L = Math.hypot(W, H) * (0.45 + r2() * 0.4);
        smears.push({
          t,
          dur: 0.13 + r2() * 0.1,
          a: [cx - Math.cos(a) * L * 0.5, cy - Math.sin(a) * L * 0.5],
          b: [cx + Math.cos(a) * L * 0.5, cy + Math.sin(a) * L * 0.5],
          bend: (r2() - 0.5) * 0.5,
          w: H * (0.05 + r2() * r2() * 0.26),
          fig: r2() < 0.4,
          claw: r2() < 0.45,
          seed: Math.floor(r2() * 1e6) + 1,
        });
      }
      const r3 = rng(404);
      flashes = HITS.map((t, i) => {
        const strong = STRONG.has(t);
        return {
          t,
          x: W * (0.12 + r3() * 0.76),
          y: H * (0.12 + r3() * 0.76),
          L: H * (strong ? 0.5 + r3() * 0.35 : 0.2 + r3() * 0.22),
          rot: r3() < 0.45 ? 0 : r3() * 1.5,
          six: r3() < 0.25,
          ring: i % 2 === 0 || strong,
          orb: r3() < 0.5,
          seed: 1000 + i * 17,
          strong,
        };
      });
      // panel kolase: poligon (0..1) + titik fokus pada ilustrasi + zoom + rotasi
      panels = [
        { p: [[-0.02, -0.02], [0.31, -0.02], [0.285, 0.47], [0.13, 0.545], [-0.02, 0.5]], f: [930, 262], z: 1.7, r: -0.12 },
        { p: [[0.36, -0.02], [0.665, -0.02], [0.7, 0.22], [0.52, 0.37], [0.4, 0.3]], f: [1190, 300], z: 1.15, r: 0.22 },
        { p: [[0.675, 0.3], [0.8, 0.07], [1.02, 0.12], [1.02, 1.02], [0.76, 1.02], [0.625, 0.66]], f: [900, 330], z: 1.45, r: 0.05 },
        { p: [[0.215, 0.6], [0.555, 0.52], [0.6, 0.92], [0.34, 1.01], [0.16, 0.84]], f: [1030, 520], z: 1.9, r: -0.2 },
      ].map((q) => {
        const poly = q.p.map(([x, y]) => [x * W, y * H]);
        return { ...q, poly, cx: poly.reduce((s, v) => s + v[0], 0) / poly.length, cy: poly.reduce((s, v) => s + v[1], 0) / poly.length };
      });
    }

    /* ----- pembantu gambar ----- */
    const fillAll = (c) => {
      ctx.fillStyle = c;
      ctx.fillRect(-W, -H, W * 3, H * 3);
    };
    const path = (poly) => {
      ctx.beginPath();
      poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
    };
    function artRect(zoom = 1) {
      const s = Math.max(W / ART.w, H / ART.h) * zoom;
      return { s, x: -(ART.w * s - W) * ART.fx, y: -(ART.h * s - H) * 0.5 };
    }
    function drawArt(zoom = 1) {
      if (!imgs.oc) return fillAll(RED);
      const a = artRect(zoom);
      ctx.drawImage(imgs.oc, a.x, a.y, ART.w * a.s, ART.h * a.s);
    }
    function drawCut(img, zoom = 1, dy = 0) {
      if (!img) return;
      const a = artRect(zoom);
      ctx.drawImage(img, a.x + ART.cut.x * a.s, a.y + ART.cut.y * a.s + dy, ART.cut.w * a.s, ART.cut.h * a.s);
    }

    function pane(cracked) {
      fillAll(cracked ? PANE : RED);
      if (!cracked) return;
      G.cells.forEach((c) => {
        path(c.poly);
        ctx.fillStyle = `hsl(4 92% ${c.shade}%)`;
        ctx.fill();
      });
      ctx.fillStyle = ctx.strokeStyle = "#140000";
      ctx.lineWidth = 1.1 * U;
      G.segs.forEach((s) => {
        const dx = s.b[0] - s.a[0];
        const dy = s.b[1] - s.a[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * s.w * U * 0.5;
        const ny = (dx / len) * s.w * U * 0.5;
        const mx = lerp(s.a[0], s.b[0], 0.45);
        const my = lerp(s.a[1], s.b[1], 0.45);
        ctx.beginPath();
        ctx.moveTo(s.a[0], s.a[1]);
        ctx.lineTo(mx + nx, my + ny);
        ctx.lineTo(s.b[0], s.b[1]);
        ctx.lineTo(mx - nx, my - ny);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        const r = H * (0.012 + 0.012 * ((i * 7) % 3));
        ctx.lineTo(G.C[0] + Math.cos(a) * r * 1.4, G.C[1] + Math.sin(a) * r * 0.8);
      }
      ctx.fill();
    }

    // empat siluet: berdiri -> jongkok -> melompat keluar layar
    const CREW = [
      { x: 0.25, h: 0.3, hair: 7, coatLen: 0.16, flip: false },
      { x: 0.375, h: 0.35, hair: 11, coatLen: 0.2, flip: false },
      { x: 0.475, h: 0.36, hair: 9, coatLen: 0.4, flip: true },
      { x: 0.675, h: 0.21, hair: 6, coatLen: 0.14, flip: true },
    ];
    const JUMP_ORDER = [0, 2, 1, 3];
    function crew(t) {
      const z = lerp(2.6, 1, easeOut(seg(t, 0.2, 0.46)));
      ctx.save();
      ctx.translate(W * 0.45, H * 0.45);
      ctx.scale(z, z);
      ctx.translate(-W * 0.45, -H * 0.45);
      CREW.forEach((m, i) => {
        const tj = T.jumps[JUMP_ORDER.indexOf(i)];
        const k1 = easeIO(seg(t, 0.3 + i * 0.02, 0.48 + i * 0.02));
        const k2 = easeIO(seg(t, 0.5, tj - 0.04));
        const up = seg(t, tj, tj + 0.15);
        if (up >= 1) return;
        let p = k1 < 1 ? mixPose(POSE.stand, POSE.ready, k1) : mixPose(POSE.ready, POSE.crouch, k2);
        if (up > 0) p = mixPose(POSE.crouch, POSE.leap, clamp(up * 3));
        const e = easeIn(up);
        drawFig(ctx, W * m.x, H * 0.7 - e * H * 1.25, H * m.h * (1 + e * 1.1), p, { flip: m.flip, hair: m.hair, coatLen: m.coatLen });
      });
      ctx.restore();
    }

    function dust(t) {
      puffs.forEach((p) => {
        const k = t - p.t;
        if (k < 0) return;
        const grow = easeOut(clamp(k / 0.14));
        const erode = seg(k, 0.16, 0.5);
        if (erode >= 1) return;
        p.blobs.forEach((b, bi) => {
          const bx = p.x + Math.cos(b.a) * p.r * b.d * grow;
          const by = p.y + Math.sin(b.a) * p.r * b.d * 0.55 * grow - k * H * 0.02;
          const br = p.r * b.s * grow;
          ctx.fillStyle = bi === 0 && erode < 0.3 ? "#ffd2cf" : "#ffffff";
          ctx.beginPath();
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU;
            const r = Math.max(0, br * (1 - erode * (0.35 + b.j[i] * 0.95)));
            ctx.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        });
      });
    }

    // putih menyapu dari kiri-bawah, lalu menyusut jadi pusaran ke kanan-atas
    function ink(t) {
      if (t < T.red) {
        const k = easeOut(seg(t, 0.02, 0.105));
        const cx = lerp(W * 0.02, W * 0.48, k);
        const cy = lerp(H * 1.0, H * 0.5, k);
        const R = lerp(G.D * 0.1, G.D * 0.86, k);
        ctx.fillStyle = "#fff";
        blobPath(ctx, cx, cy, R, 0.4 + t * 6, 6, 0.34);
        ctx.fill();
        ctx.strokeStyle = "#0b0000";
        ctx.lineWidth = 5 * U;
        ctx.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = -0.4 - i * 0.42 + t * 4;
          ctx.beginPath();
          ctx.arc(cx, cy, R * 0.83, a, a + 0.09);
          ctx.stroke();
        }
        return;
      }
      const k = easeIO(seg(t, T.red, 0.47));
      const kk = seg(t, 0.44, 0.6);
      const R = lerp(G.D * 0.5, G.D * 0.16, k) * (1 - kk);
      if (R < 3) return;
      const cx = lerp(W * 0.62, W * 0.83, k) + kk * W * 0.1;
      const cy = lerp(H * 0.45, H * 0.1, k) - kk * H * 0.1;
      const phi = 0.3 + t * 3.2;
      const bg = t < T.crack ? RED : PANE;
      ctx.fillStyle = "#fff";
      blobPath(ctx, cx, cy, R, phi, 7, 0.32);
      ctx.fill();
      ctx.fillStyle = bg;
      blobPath(ctx, cx - R * lerp(0.42, 0.1, k), cy + R * 0.06, R * lerp(0.36, 0.74, k), phi * 1.4 + 1, 6, 0.36);
      ctx.fill();
      ctx.fillStyle = "#fff";
      blobPath(ctx, cx - R * lerp(0.46, 0.16, k), cy + R * 0.02, R * lerp(0.2, 0.42, k) * (1 - k * 0.5), -phi, 5, 0.4);
      ctx.fill();
      ctx.fillStyle = bg;
      blobPath(ctx, cx - R * lerp(0.46, 0.2, k), cy + R * 0.04, R * 0.2 * k, phi * 2, 5, 0.3);
      ctx.fill();
    }

    /* ----- kolase ----- */
    const TONES = ["#a80b08", "#7c0705", "#d9160d", "#c00f0a", "#5a0403", "#ea2012", "#930907"];
    function collage(t) {
      const k = easeIn(seg(t, T.shatter, T.black));
      const settle = 1 + 0.07 * (1 - easeOut(seg(t, T.collage, T.collage + 0.08))) + 0.03 * seg(t, T.collage, T.shatter) + k * 4.5;
      fillAll("#120000");
      ctx.save();
      ctx.translate(G.C[0], G.C[1]);
      ctx.scale(settle, settle);
      ctx.translate(-G.C[0], -G.C[1]);
      const piece = (cx, cy, spin, far, fn) => {
        ctx.save();
        ctx.translate(cx + (cx - G.C[0]) * far * k, cy + (cy - G.C[1]) * far * k);
        ctx.rotate(spin * k);
        ctx.translate(-cx, -cy);
        fn();
        ctx.restore();
      };
      G.cells.forEach((c, i) =>
        piece(c.cx, c.cy, c.spin, 0.9, () => {
          path(c.poly);
          ctx.fillStyle = TONES[Math.floor(c.tone * TONES.length)];
          ctx.fill();
          ctx.strokeStyle = "#100000";
          ctx.lineWidth = 3 * U;
          ctx.lineJoin = "round";
          ctx.stroke();
          if (i % 3 === 0) {
            ctx.save();
            ctx.clip();
            ctx.fillStyle = "rgba(255,90,70,0.25)";
            ctx.fillRect(c.cx - W, c.cy - H * 0.04, W * 2, H * 0.08);
            ctx.restore();
          }
        })
      );
      panels.forEach((p, i) =>
        piece(p.cx, p.cy, (i % 2 ? 1 : -1) * 0.7, 1.5, () => {
          path(p.poly);
          ctx.save();
          ctx.clip();
          ctx.fillStyle = "#b30d0a";
          ctx.fillRect(-W, -H, W * 3, H * 3);
          if (imgs.oc) {
            const s = Math.max(W / ART.w, H / ART.h) * p.z;
            ctx.translate(p.cx, p.cy);
            ctx.rotate(p.r);
            ctx.drawImage(imgs.oc, -p.f[0] * s, -p.f[1] * s, ART.w * s, ART.h * s);
            ctx.rotate(-p.r);
            ctx.translate(-p.cx, -p.cy);
          }
          const g = seg(t, T.glint + i * 0.02, T.glint + 0.14 + i * 0.02);
          if (g > 0 && g < 1) {
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            const x = lerp(-0.5, 1.2, g) * W;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + W * 0.12, 0);
            ctx.lineTo(x + W * 0.12 - H * 0.6, H);
            ctx.lineTo(x - H * 0.6, H);
            ctx.fill();
          }
          ctx.restore();
          path(p.poly);
          ctx.strokeStyle = "#0c0000";
          ctx.lineWidth = 4 * U;
          ctx.lineJoin = "round";
          ctx.stroke();
        })
      );
      ctx.restore();
      if (k > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.pow(k, 1.4)})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* ----- serangan ----- */
    function smear(s, t) {
      const k = (t - s.t) / s.dur;
      if (k <= 0 || k >= 1) return;
      const s1 = Math.min(1, k * 2.1);
      const s0 = Math.max(0, k * 2.1 - 1.1);
      if (s1 - s0 < 0.02) return;
      const dx = s.b[0] - s.a[0];
      const dy = s.b[1] - s.a[1];
      const mx = (s.a[0] + s.b[0]) / 2 - dy * s.bend;
      const my = (s.a[1] + s.b[1]) / 2 + dx * s.bend;
      const pt = (u) => {
        const v = 1 - u;
        return [v * v * s.a[0] + 2 * v * u * mx + u * u * s.b[0], v * v * s.a[1] + 2 * v * u * my + u * u * s.b[1]];
      };
      const N = 22;
      const L = [];
      const Rr = [];
      const r = rng(s.seed);
      let head = s.a;
      let ang = 0;
      for (let i = 0; i <= N; i++) {
        const u = lerp(s0, s1, i / N);
        const p = pt(u);
        const q = pt(u + 0.01);
        const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        const prof = Math.pow(Math.sin(Math.PI * Math.pow(i / N, 0.7)), 0.7);
        const w = s.w * prof * (0.85 + r() * 0.3);
        L.push([p[0] - Math.sin(a) * w, p[1] + Math.cos(a) * w]);
        Rr.push([p[0] + Math.sin(a) * w, p[1] - Math.cos(a) * w]);
        head = p;
        ang = a;
      }
      ctx.fillStyle = ctx.strokeStyle = "#060000";
      path(L.concat(Rr.reverse()));
      ctx.fill();
      // serat kuas kering di sisi sapuan
      ctx.lineWidth = Math.max(1, s.w * 0.07);
      ctx.lineCap = "round";
      for (let b = 0; b < 4; b++) {
        const off = s.w * (1.15 + b * 0.22) * (b % 2 ? 1 : -1);
        const u0 = lerp(s0, s1, 0.1 + r() * 0.3);
        const u1 = lerp(s0, s1, 0.6 + r() * 0.35);
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const u = lerp(u0, u1, i / 8);
          const p = pt(u);
          const q = pt(u + 0.01);
          const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
          ctx.lineTo(p[0] - Math.sin(a) * off, p[1] + Math.cos(a) * off);
        }
        ctx.stroke();
      }
      if (s.fig && k < 0.75) drawFig(ctx, head[0], head[1], H * 0.34, POSE.dash, { air: true, rot: ang - 0.9, coatLen: 0.4 });
      if (s.claw) {
        // cipratan tinta bergerigi di ujung sapuan
        const n = 7;
        ctx.beginPath();
        for (let i = 0; i < n * 2; i++) {
          const a = ang - 1.2 + (i / (n * 2)) * 2.4;
          const rr = i % 2 ? s.w * (1.6 + r() * 2.6) * Math.min(1, k * 3) : s.w * 0.45;
          ctx.lineTo(head[0] + Math.cos(a) * rr, head[1] + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    function star(x, y, L, w, rot, six) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const arms = six ? 3 : 2;
      for (let i = 0; i < arms; i++) {
        ctx.rotate(Math.PI / arms);
        const l = i === 0 ? L : L * 0.62;
        ctx.beginPath();
        ctx.moveTo(-l, 0);
        ctx.quadraticCurveTo(0, -w, l, 0);
        ctx.quadraticCurveTo(0, w, -l, 0);
        ctx.fill();
      }
      ctx.restore();
    }
    function flash(f, t) {
      const k = (t - f.t) / (f.strong ? 0.16 : 0.11);
      if (k < 0 || k >= 1) return;
      const r = rng(f.seed);
      const grow = easeOut(clamp(k / 0.3));
      const thin = 1 - easeIn(k);
      // percikan + cincin kuning
      ctx.strokeStyle = "#ffe340";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1, 2.2 * U * thin);
      const n = f.strong ? 12 : 7;
      for (let i = 0; i < n; i++) {
        const a = r() * TAU;
        const r0 = f.L * (0.15 + r() * 0.3) * grow;
        const r1 = r0 + f.L * (0.25 + r() * 0.9) * grow;
        ctx.beginPath();
        ctx.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0);
        ctx.lineTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1);
        ctx.stroke();
      }
      if (f.ring) {
        const rr = f.L * (0.3 + 0.35 * grow);
        for (let i = 0; i < 5; i++) {
          const a = r() * TAU;
          ctx.beginPath();
          ctx.arc(f.x + f.L * 0.1, f.y, rr, a, a + 0.5 + r() * 0.9);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#fff";
      star(f.x, f.y, f.L * (0.35 + 0.65 * grow), f.L * 0.075 * thin + 1, f.rot, f.six);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.L * 0.1 * thin + 2, 0, TAU);
      ctx.fill();
      if (f.orb) {
        ctx.beginPath();
        ctx.arc(f.x + f.L * (r() - 0.5) * 0.9, f.y + f.L * (r() - 0.5) * 0.6, H * 0.016, 0, TAU);
        ctx.fill();
      }
    }
    function attack(t) {
      if (t < T.attack) {
        const k = seg(t, T.redIn, T.attack);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgb(${Math.round(lerp(40, 190, k))},0,0)`);
        g.addColorStop(1, `rgb(${Math.round(lerp(90, 150, k))},0,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#050000";
        ctx.beginPath();
        ctx.ellipse(W * 0.52, H * (1.5 - 0.42 * easeOut(k)), W * 0.62, H * 0.62, 0, 0, TAU);
        ctx.fill();
        return;
      }
      let sh = 1 - seg(t, T.attack, T.attack + 0.12);
      for (const h of HITS) {
        const d = t - h;
        if (d >= 0 && d < 0.09) sh = Math.max(sh, (1 - d / 0.09) * (STRONG.has(h) ? 1 : 0.5));
      }
      ctx.save();
      ctx.translate(Math.sin(t * 131) * sh * H * 0.016, Math.cos(t * 113) * sh * H * 0.016);
      fillAll(RED);
      if (t < T.attack + 0.25) {
        ctx.fillStyle = "#6e0000";
        ctx.beginPath();
        ctx.ellipse(W * 0.72, H * 0.78, W * 0.2, H * 0.1, -0.1, 0, TAU);
        ctx.fill();
      }
      // garis kuning tipis melintang
      const r = rng(Math.floor(t * 12) + 7);
      ctx.strokeStyle = "#ffd91f";
      ctx.lineWidth = 1.6 * U;
      for (let i = 0; i < 2; i++) {
        const skip = r() < 0.4;
        const y = r() * H;
        const a = (r() - 0.5) * 0.7;
        if (skip || t < T.attack + 0.2) continue;
        ctx.beginPath();
        ctx.moveTo(-W * 0.1, y);
        ctx.lineTo(W * 1.1, y + Math.tan(a) * W);
        ctx.stroke();
      }
      smears.forEach((s) => smear(s, t));
      flashes.forEach((f) => flash(f, t));
      ctx.restore();
    }
    function petalStar(x, y, R, rot, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = rot + (i / 5) * TAU;
        const tip = [x + Math.cos(a) * R, y + Math.sin(a) * R];
        const c1 = [x + Math.cos(a - 0.3) * R * 0.62, y + Math.sin(a - 0.3) * R * 0.62];
        const c2 = [x + Math.cos(a + 0.3) * R * 0.62, y + Math.sin(a + 0.3) * R * 0.62];
        const v0 = [x + Math.cos(a - TAU / 10) * R * 0.3, y + Math.sin(a - TAU / 10) * R * 0.3];
        const v1 = [x + Math.cos(a + TAU / 10) * R * 0.3, y + Math.sin(a + TAU / 10) * R * 0.3];
        if (!i) ctx.moveTo(v0[0], v0[1]);
        ctx.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]);
        ctx.quadraticCurveTo(c2[0], c2[1], v1[0], v1[1]);
      }
      ctx.closePath();
      ctx.fill();
    }
    function stars(t) {
      if (t < T.white) {
        // bintang putih raksasa menelan layar
        const k = easeIn(seg(t, T.giant, T.white));
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = lerp(6 * U, G.D * 0.4, k);
        ctx.beginPath();
        ctx.arc(W * 0.42, H * 0.46, lerp(H * 0.3, G.D * 0.9, k), 0, TAU);
        ctx.stroke();
        star(W * 0.42, H * 0.46, lerp(H * 0.6, G.D * 3, k), lerp(H * 0.08, G.D * 1.4, k), 0.55, false);
        return;
      }
      fillAll("#fff");
      if (t < T.rstar) return;
      const k = easeIn(seg(t, T.rburst, T.red2));
      const R = lerp(H * 0.17, G.D * 2.6, k);
      const rot = -0.5 + k * 0.5;
      const x = lerp(W * 0.62, W * 0.5, k);
      const y = H * 0.5;
      petalStar(x, y, R * 1.09, rot, "#ffd61f");
      petalStar(x, y, R * 1.045, rot, "#ff7a00");
      petalStar(x, y, R, rot, RED);
    }

    /* ----- mendarat, berdiri, potret ----- */
    function ground(t) {
      const k = easeOut(seg(t, T.land - 0.035, T.land + 0.05));
      const yL = lerp(H * 1.08, H * 0.585, k);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(-W, yL - H * 0.1);
      ctx.lineTo(W * 2, yL + H * 0.2);
      ctx.lineTo(W * 2, H * 2);
      ctx.lineTo(-W, H * 2);
      ctx.fill();
      // dua keping kaca tipis tertancap di kejauhan
      [0.19, 0.39].forEach((fx, i) => {
        const x = W * fx;
        const yb = yL + H * 0.1 * fx + H * 0.03;
        const h = H * (0.2 + i * 0.015);
        const w = Math.max(3, W * 0.006);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.6, yb);
        ctx.lineTo(x - w * 1.2, yb - h * 0.55);
        ctx.lineTo(x - w * 0.2, yb - h * 0.8);
        ctx.lineTo(x + w * 0.5, yb - h);
        ctx.lineTo(x + w * 1.3, yb - h * 0.78);
        ctx.lineTo(x + w * 0.6, yb - h * 0.5);
        ctx.lineTo(x + w * 0.9, yb);
        ctx.fill();
      });
    }
    function landing(t) {
      fillAll(RED);
      if (t < T.fall) return;
      if (t < T.land) {
        const k = seg(t, T.fall, T.land);
        if (k > 0.75) ground(t);
        drawFall(ctx, W * 0.52 + (1 - k) * W * 0.02, lerp(-H * 0.35, H * 0.5, k), H * 0.78, "#080000");
        return;
      }
      const bump = (1 - easeOut(seg(t, T.land, T.land + 0.22))) * H * 0.03;
      const push = 1 + 0.05 * seg(t, T.stand, T.zoom) + (t >= T.snap ? 0.012 * (1 - seg(t, T.snap, T.snap + 0.07)) : 0) + 0.2 * easeIn(seg(t, T.zoom, T.flash));
      ctx.save();
      ctx.translate(0, bump);
      ground(t);
      const sink = easeIn(seg(t, T.rise, T.rise + 0.16));
      if (sink < 1) drawFig(ctx, W * 0.53, H * (0.93 + sink * 0.5), H * 0.74, POSE.crouch, { color: "#141212", coatLen: 0.42, flip: true });
      const up = easeOut(seg(t, T.rise + 0.02, T.stand));
      if (up > 0) {
        const over = Math.sin(up * Math.PI) * H * 0.012;
        ctx.save();
        ctx.translate(W * 0.57, H * 0.6);
        ctx.scale(push, push);
        ctx.translate(-W * 0.57, -H * 0.6);
        drawCut(darkCut, 1.0, (1 - up) * H * 0.95 - over);
        ctx.restore();
      }
      ctx.restore();
    }
    function nameplate(t) {
      const a = easeOut(seg(t, T.plate, T.plate + 0.4));
      const b = easeOut(seg(t, T.plate + 0.18, T.plate + 0.58));
      if (a <= 0) return;
      const x0 = Math.max(16, W * 0.05);
      const fs1 = clamp(W * 0.05, 22, 52);
      const fs2 = clamp(W * 0.024, 14, 24);
      const y1 = H - Math.max(28, H * 0.12) - fs2 * 2.2;
      const sk = -Math.tan((12 * Math.PI) / 180);
      const box = (txt, fs, y, bg, fg, p) => {
        ctx.save();
        ctx.globalAlpha = p;
        ctx.font = `italic 900 ${fs}px ${FONT}`;
        const label = txt.toUpperCase();
        const tw = ctx.measureText(label).width;
        const padX = fs * 0.5;
        const bh = fs * 1.35;
        const ox = x0 - (1 - p) * 90;
        ctx.setTransform(dpr, 0, sk * dpr, dpr, ox * dpr, y * dpr);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, tw + padX * 2, bh);
        ctx.setTransform(dpr, 0, 0, dpr, (ox + padX - sk * bh * 0.5) * dpr, (y + bh * 0.72) * dpr);
        ctx.fillStyle = fg;
        ctx.fillText(label, 0, 0);
        ctx.restore();
        return bh;
      };
      const h1 = box("Vassell Enha Atthayya", fs1, y1, "#f5f5f5", "#0f0f0f", a);
      box("Full Stack Developer", fs2, y1 + h1 + 8, "#dc0000", "#f5f5f5", b);
    }
    function finale(t) {
      if (t < T.art) {
        fillAll("#000");
        ctx.globalAlpha = 0.5;
        drawCut(imgs.cut, 1.2);
        ctx.globalAlpha = 1;
        return;
      }
      const k = easeOut(seg(t, T.art, T.art + 0.2));
      const sh = (1 - seg(t, T.art, T.art + 0.25)) * H * 0.012;
      ctx.save();
      ctx.translate(Math.sin(t * 140) * sh, Math.cos(t * 120) * sh);
      drawArt(lerp(1.16, 1.0, k) + 0.02 * (1 - seg(t, T.art, T.out)));
      ctx.restore();
      const f = 1 - seg(t, T.art, T.art + 0.07);
      if (f > 0) {
        ctx.fillStyle = `rgba(255,255,255,${f * 0.9})`;
        ctx.fillRect(0, 0, W, H);
      }
      nameplate(t);
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fillAll("#0b0000");
      if (t < T.red) {
        ink(t);
      } else if (t < T.collage) {
        const sh = t >= T.crack ? 1 - seg(t, T.crack, T.crack + 0.2) : 0;
        ctx.save();
        ctx.translate(Math.sin(t * 150) * sh * H * 0.014, Math.cos(t * 127) * sh * H * 0.014);
        pane(t >= T.crack);
        ink(t);
        crew(t);
        dust(t);
        ctx.restore();
      } else if (t < T.black) {
        collage(t);
      } else if (t < T.redIn) {
        fillAll("#000");
      } else if (t < T.giant) {
        attack(t);
      } else if (t < T.red2) {
        if (t < T.white) attack(t);
        stars(t);
      } else if (t < T.flash) {
        landing(t);
      } else {
        finale(t);
      }
    }

    /* ----- jam + audio ----- */
    function clock() {
      let t = aT + (performance.now() - aPerf) / 1000;
      if (musicOn && !audio.paused && !audio.seeking) {
        const now = audio.currentTime - P0;
        if (Math.abs(now - t) > 0.07) {
          aT = now;
          aPerf = performance.now();
          t = now;
        }
      }
      return t;
    }
    function stopSfx() {
      try {
        sfxNode?.stop();
      } catch {}
      sfxNode = null;
    }
    function startSfx(t) {
      if (sfxNode || !sfxBuf || t >= sfxBuf.duration - 0.05) return;
      const o = sfxOutput();
      if (!o) return;
      try {
        sfxNode = o.ctx.createBufferSource();
        sfxNode.buffer = sfxBuf;
        const g = o.ctx.createGain();
        g.gain.value = SFX_GAIN;
        sfxNode.connect(g).connect(o.out);
        sfxNode.start(0, Math.max(0, t));
      } catch {}
    }
    function playFromCue() {
      lateMusic = false;
      try {
        audio.currentTime = at;
      } catch {}
      audio.muted = false;
      audio.play().catch(() => {});
    }
    // Browser baru mengizinkan suara setelah ada interaksi (klik / tombol / sentuh).
    // Sampai itu terjadi intro berjalan senyap; begitu ada interaksi, suara menyusul di posisi yang pas.
    function unlock(e) {
      if (unlocked) return;
      unlocked = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchend", unlock);
      if (!audio && dead) return;
      if (dead && e?.target?.closest?.("[data-bgm]")) return; // tombol Jukebox mengurus sendiri
      if (dead) {
        // intro sudah selesai: nyalakan musik (lanjut bila masih berjalan senyap, kalau tidak mulai dari bagian puncak)
        if (!audio.paused) audio.muted = false;
        else if (lateMusic) playFromCue();
        return;
      }
      if (!running) return;
      const t = Math.max(0, clock());
      startSfx(t);
      if (audio && lateMusic && t < T.art) {
        lateMusic = false;
        try {
          audio.currentTime = P0 + t;
        } catch {}
        audio.muted = t < T.music;
        audio.play().then(() => (musicOn = true)).catch(() => (lateMusic = true));
      }
    }
    function finish() {
      if (dead) return;
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(outTimer);
      clearTimeout(waitTimer);
      stopSfx();
      if (audio) {
        audio.removeEventListener("loadedmetadata", seek);
        if (unlocked) {
          if (musicOn) audio.muted = false;
          else playFromCue();
        }
        // belum ada interaksi: musik menunggu di unlock()
      }
      endIntro();
    }
    function frame() {
      if (dead) return;
      const t = Math.max(0, clock());
      draw(t);
      if (window.__introDebug) canvas.dataset.t = t.toFixed(3);
      if (unlocked && musicOn && audio.muted && t >= T.music) audio.muted = false;
      if (unlocked && lateMusic && t >= T.art) playFromCue();
      if (t >= T.out && !exiting) {
        exiting = true;
        wrap.current?.classList.add("out");
        outTimer = setTimeout(finish, 650);
      }
      raf = requestAnimationFrame(frame);
    }
    function begin(t0) {
      if (running || dead) return;
      running = true;
      clearTimeout(waitTimer);
      aT = t0;
      aPerf = performance.now();
      if (unlocked) startSfx(t0);
      raf = requestAnimationFrame(frame);
    }
    // Langsung jalan saat halaman dibuka. Lagu diputar senyap dulu sebagai jam (autoplay senyap diizinkan browser).
    function start() {
      if (running || dead) return;
      size();
      draw(0);
      if (!audio) return begin(0);
      const go = () => {
        if (running || dead) return;
        if (Math.abs(audio.currentTime - P0) > 1) {
          // metadata baru masuk: lompat ke posisi yang benar dulu
          audio.addEventListener("seeked", go, { once: true });
          seek();
          return;
        }
        musicOn = true;
        begin(Math.max(0, audio.currentTime - P0));
      };
      const fallback = () => {
        if (running || dead) return;
        audio.removeEventListener("playing", go);
        audio.removeEventListener("seeked", go);
        audio.pause();
        lateMusic = true;
        begin(0);
      };
      audio.addEventListener("playing", go, { once: true });
      audio.muted = true;
      audio.play().catch(fallback);
      waitTimer = setTimeout(fallback, 1500);
    }

    const key = (e) => {
      if (e.key === "Escape") finish();
    };
    const onResize = () => running && size();
    window.addEventListener("keydown", key);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchend", unlock);
    ctl.current = { skip: finish };
    ready.then(start);

    return () => {
      const wasDone = dead;
      dead = true; // mode Strict (dev) memasang efek dua kali: efek pertama tidak boleh ikut menjalankan animasi
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearTimeout(outTimer);
      clearTimeout(waitTimer);
      stopSfx();
      if (!wasDone) {
        unlocked = true; // efek yang dibatalkan tidak boleh menyalakan audio
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchend", unlock);
        if (audio) {
          audio.removeEventListener("loadedmetadata", seek);
          audio.pause();
        }
      }
      ctl.current = null;
    };
  }, [src, at]);

  const skip = () => (ctl.current ? ctl.current.skip() : endIntro());

  return (
    <div ref={wrap} className="intro-ov" role="dialog" aria-modal="true" aria-label="Pembuka situs">
      <canvas ref={ref} className="intro-canvas" aria-hidden="true" />
      <button type="button" className="intro-skip" onClick={skip}>
        Lewati
      </button>
    </div>
  );
}
