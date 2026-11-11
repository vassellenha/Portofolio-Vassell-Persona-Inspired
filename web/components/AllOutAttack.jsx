"use client";
// All-Out Attack: overlay satu layar penuh (canvas) dengan gaya yang sama seperti opening —
// sapuan tinta hitam di atas merah, kilatan bintang, bintang putih raksasa, ledakan bintang merah,
// lalu potret penutup. Dipakai sebagai "finisher" mini-game. Klik / tombol apa pun untuk melewati.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { isSfxOn } from "../lib/sfx";

const FONT = '"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';
const RED = "#f40000";
const TAU = Math.PI * 2;
// Garis waktu (detik) — selisihnya sama dengan bagian "attack" di opening,
// jadi potongan public/sfx/intro.mp3 mulai detik 2.396 pas dengan gambarnya.
const SFX_FROM = 2.396;
const T = { attack: 0.08, giant: 1.974, white: 2.074, rstar: 2.354, rburst: 2.434, red2: 2.564, pose: 2.62, end: 5.4 };
const HITS = [0.29, 0.37, 0.44, 0.48, 0.53, 0.58, 0.64, 0.7, 0.76, 0.83, 0.87, 0.96, 1.03, 1.09, 1.16, 1.2, 1.25, 1.3, 1.38, 1.46, 1.54, 1.58, 1.65, 1.7, 1.74, 1.8, 1.85, 1.9];
const STRONG = new Set([0.29, 0.64, 0.76, 0.96, 1.09, 1.46, 1.54, 1.74, 1.85]);

const clamp = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeIn = (k) => k * k * k;
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function AllOutAttack({ title = "All-Out Attack", lines = [], onDone }) {
  const ref = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;
  // judul & baris dibaca sekali saat mulai (animasi tidak diulang kalau induk re-render)
  const text = useRef({ title, lines });

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    const { title, lines } = text.current;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let D = 0;
    let U = 1;
    let smears = [];
    let flashes = [];
    let raf = 0;
    let closed = false;

    const img = new Image();
    img.src = "/oc-cut.webp";

    function build() {
      const r = rng(91);
      smears = [];
      for (let t = T.attack; t < T.giant - 0.05; t += 0.055 + r() * 0.05) {
        const a = r() * TAU;
        const cx = W * (0.25 + r() * 0.5);
        const cy = H * (0.25 + r() * 0.5);
        const L = Math.hypot(W, H) * (0.45 + r() * 0.4);
        smears.push({
          t,
          dur: 0.13 + r() * 0.1,
          a: [cx - Math.cos(a) * L * 0.5, cy - Math.sin(a) * L * 0.5],
          b: [cx + Math.cos(a) * L * 0.5, cy + Math.sin(a) * L * 0.5],
          bend: (r() - 0.5) * 0.5,
          w: H * (0.05 + r() * r() * 0.26),
          claw: r() < 0.45,
          seed: Math.floor(r() * 1e6),
        });
      }
      const r2 = rng(33);
      flashes = HITS.map((t) => ({
        t,
        strong: STRONG.has(t),
        x: W * (0.12 + r2() * 0.76),
        y: H * (0.14 + r2() * 0.72),
        L: H * (STRONG.has(t) ? 0.2 + r2() * 0.16 : 0.09 + r2() * 0.1),
        rot: r2() * TAU,
        six: r2() < 0.3,
        ring: r2() < 0.35,
        seed: Math.floor(r2() * 1e6),
      }));
    }
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      D = Math.hypot(W, H);
      U = Math.max(1, H / 540);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    const fillAll = (c) => {
      ctx.fillStyle = c;
      ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2);
    };
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
      ctx.beginPath();
      L.concat(Rr.reverse()).forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fill();
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
      if (s.claw) {
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
    function flash(f, t) {
      const k = (t - f.t) / (f.strong ? 0.16 : 0.11);
      if (k < 0 || k >= 1) return;
      const r = rng(f.seed);
      const grow = easeOut(clamp(k / 0.3));
      const thin = 1 - easeIn(k);
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
    }

    function attack(t) {
      let sh = 1 - seg(t, T.attack, T.attack + 0.12);
      for (const h of HITS) {
        const d = t - h;
        if (d >= 0 && d < 0.09) sh = Math.max(sh, (1 - d / 0.09) * (STRONG.has(h) ? 1 : 0.5));
      }
      ctx.save();
      ctx.translate(Math.sin(t * 131) * sh * H * 0.016, Math.cos(t * 113) * sh * H * 0.016);
      fillAll(RED);
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
    function stars(t) {
      if (t < T.white) {
        attack(t);
        const k = easeIn(seg(t, T.giant, T.white));
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = lerp(6 * U, D * 0.4, k);
        ctx.beginPath();
        ctx.arc(W * 0.42, H * 0.46, lerp(H * 0.3, D * 0.9, k), 0, TAU);
        ctx.stroke();
        star(W * 0.42, H * 0.46, lerp(H * 0.6, D * 3, k), lerp(H * 0.08, D * 1.4, k), 0.55, false);
        return;
      }
      fillAll("#fff");
      if (t < T.rstar) return;
      const k = easeIn(seg(t, T.rburst, T.red2));
      const R = lerp(H * 0.17, D * 2.6, k);
      const rot = -0.5 + k * 0.5;
      const x = lerp(W * 0.62, W * 0.5, k);
      petalStar(x, H * 0.5, R * 1.09, rot, "#ffd61f");
      petalStar(x, H * 0.5, R * 1.045, rot, "#ff7a00");
      petalStar(x, H * 0.5, R, rot, RED);
    }
    function slab(text, x, y, px, bg, fg, rot, k) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.transform(1, 0, -0.22, 1, 0, 0);
      ctx.font = `italic 900 ${px}px ${FONT}`;
      const w = ctx.measureText(text).width;
      const pad = px * 0.28;
      const off = (1 - k) * -W * 0.6;
      ctx.fillStyle = bg;
      ctx.fillRect(off - pad, -px * 0.86, w + pad * 2, px * 1.12);
      ctx.fillStyle = fg;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, off, 0);
      ctx.restore();
      return w;
    }
    function pose(t) {
      const k = easeOut(seg(t, T.pose, T.pose + 0.22));
      const sh = (1 - seg(t, T.pose, T.pose + 0.25)) * H * 0.012;
      ctx.save();
      ctx.translate(Math.sin(t * 140) * sh, Math.cos(t * 120) * sh);
      fillAll(RED);
      // pita hitam miring + serpihan
      ctx.fillStyle = "#070000";
      ctx.beginPath();
      ctx.moveTo(-W * 0.1, H * 0.86);
      ctx.lineTo(W * 1.1, H * 0.52);
      ctx.lineTo(W * 1.1, H * 1.1);
      ctx.lineTo(-W * 0.1, H * 1.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W * 0.02, H * 0.08);
      ctx.lineTo(W * 0.3, 0);
      ctx.lineTo(W * 0.12, H * 0.2);
      ctx.fill();
      petalStar(W * 0.9, H * 0.14, H * 0.11, 0.3 + t * 0.4, "#070000");
      petalStar(W * 0.08, H * 0.7, H * 0.06, -0.2 - t * 0.5, "#fff");
      // potret
      if (img.complete && img.naturalWidth) {
        const portrait = W < H;
        const h = H * (portrait ? 0.62 : 1.02) * lerp(1.14, 1, k);
        const w = (img.naturalWidth / img.naturalHeight) * h;
        const x = portrait ? W * 0.5 - w * 0.42 : W * 0.56;
        ctx.drawImage(img, x + (1 - k) * W * 0.12, H - h, w, h);
      }
      // teks
      const portrait = W < H;
      const px = Math.min(W * (portrait ? 0.105 : 0.07), H * 0.13);
      const x0 = W * 0.06;
      const y0 = H * (portrait ? 0.16 : 0.3);
      const k1 = easeOut(seg(t, T.pose + 0.05, T.pose + 0.3));
      const k2 = easeOut(seg(t, T.pose + 0.15, T.pose + 0.4));
      slab(title.toUpperCase(), x0, y0, px, "#fff", "#0a0a0a", -0.07, k1);
      lines.forEach((ln, i) => {
        const kk = easeOut(seg(t, T.pose + 0.25 + i * 0.1, T.pose + 0.5 + i * 0.1));
        slab(String(ln).toUpperCase(), x0 + px * 0.3 * (i + 1), y0 + px * 1.32 * (i + 1), px * (i ? 0.48 : 0.74), i ? "#fff" : "#070000", i ? "#0a0a0a" : "#fff", -0.07, i ? kk : k2);
      });
      const a = seg(t, T.pose + 0.9, T.pose + 1.2) * (0.55 + 0.45 * Math.sin(t * 6));
      if (a > 0) {
        ctx.globalAlpha = a;
        ctx.font = `italic 900 ${Math.max(11, px * 0.2)}px ${FONT}`;
        ctx.fillStyle = "#fff";
        ctx.fillText("KLIK UNTUK LANJUT", x0, portrait ? y0 + px * 4.3 : H * 0.95);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      const f = 1 - seg(t, T.pose, T.pose + 0.09);
      if (f > 0) {
        ctx.fillStyle = `rgba(255,255,255,${f * 0.9})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    function draw(t) {
      if (t < T.giant) attack(t);
      else if (t < T.pose) stars(t);
      else pose(t);
    }

    // audio: potongan SFX opening, pelan
    let audio = null;
    if (!reduce && isSfxOn()) {
      try {
        audio = new Audio("/sfx/intro.mp3");
        audio.volume = 0.3;
        audio.currentTime = SFX_FROM;
        audio.play().catch(() => {});
      } catch {}
    }
    function close() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      try {
        audio?.pause();
      } catch {}
      done.current?.();
    }

    size();
    const t0 = performance.now() - (reduce ? T.pose * 1000 + 400 : 0);
    function frame(now) {
      const t = (now - t0) / 1000;
      if (audio && t > T.pose + 0.5 && !audio.paused) audio.pause();
      if (t >= T.end) return close();
      draw(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const skip = (e) => {
      const t = (performance.now() - t0) / 1000;
      if (t < 0.4) return; // cegah klik yang memicu ikut menutup
      e.preventDefault?.();
      close();
    };
    window.addEventListener("resize", size);
    window.addEventListener("keydown", skip);
    cv.addEventListener("pointerdown", skip);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      closed = true;
      cancelAnimationFrame(raf);
      try {
        audio?.pause();
      } catch {}
      window.removeEventListener("resize", size);
      window.removeEventListener("keydown", skip);
      document.documentElement.style.overflow = prev;
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <canvas
      ref={ref}
      role="img"
      aria-label={`${title}. ${lines.join(". ")}. Klik untuk lanjut.`}
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 9999, cursor: "pointer", touchAction: "none", background: RED }}
    />,
    document.body
  );
}
