"use client";
// "Pecahkan Kaca": panel kontak tertutup kaca merah ala Persona 5. Klik/ketuk 3 kali untuk menimbulkan retakan
// yang menjalar dari titik sentuh; pukulan ketiga memecahkan kaca jadi keping yang berjatuhan dan membuka kontak.
// Digambar di <canvas>; loop animasi hanya jalan saat ada gerak. Fokus keyboard ke tautan langsung memecahkan kaca,
// jadi isi tetap bisa dijangkau tanpa mouse.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const TAU = Math.PI * 2;
const NEED = 3;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const rng = (seed) => {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

export default function GlassContact({ children }) {
  const wrap = useRef(null);
  const cv = useRef(null);
  const api = useRef(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const canvas = cv.current;
    const host = wrap.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = () => performance.now() / 1000;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let timer = 0;
    let S = fresh();

    function fresh() {
      return { cracks: [], chips: [], shards: [], pulses: [], hits: 0, breaking: false, broken: false, born: now(), shakeT: -9, flashT: -9, seed: 1, ix: 0, iy: 0 };
    }
    const fam = () => {
      const v = (getComputedStyle(canvas).getPropertyValue("--font-markin") || "").trim();
      return `${v ? v + "," : ""}"Arial Black", Impact, sans-serif`;
    };

    // ---------- geometri ----------
    function mkCrack(x, y, seed) {
      const r = rng(seed);
      const D = Math.hypot(W, H);
      const n = 8 + Math.floor(r() * 4);
      const rays = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (r() - 0.5) * 0.55;
        const len = D * (0.3 + r() * 0.5);
        const segs = 6 + Math.floor(r() * 4);
        const pts = [[x, y]];
        let px = x;
        let py = y;
        for (let s = 0; s < segs; s++) {
          const st = (len / segs) * (0.7 + r() * 0.6);
          const aa = a + (r() - 0.5) * 0.5;
          px += Math.cos(aa) * st;
          py += Math.sin(aa) * st;
          pts.push([px, py]);
        }
        rays.push(pts);
      }
      return { x, y, t: now(), rays };
    }

    function mkShards(ix, iy) {
      const r = rng(4242 + S.hits);
      const D = Math.hypot(W, H);
      const rings = [0, 0.05, 0.12, 0.24, 0.42, 0.7, 1.5].map((f) => f * D);
      const SEG = 12;
      const grid = rings.map((rad, ri) =>
        Array.from({ length: SEG }, (_, k) => {
          if (ri === 0) return [ix, iy];
          const a = (k / SEG) * TAU + (ri % 2 ? 0.13 : -0.05) + (r() - 0.5) * 0.22;
          const rr = rad * (0.8 + r() * 0.4);
          return [ix + Math.cos(a) * rr, iy + Math.sin(a) * rr * 0.9];
        })
      );
      const out = [];
      for (let ri = 0; ri < rings.length - 1; ri++) {
        for (let k = 0; k < SEG; k++) {
          const k2 = (k + 1) % SEG;
          const poly = ri === 0 ? [grid[0][0], grid[1][k], grid[1][k2]] : [grid[ri][k], grid[ri][k2], grid[ri + 1][k2], grid[ri + 1][k]];
          const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
          const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
          if (cx < -D * 0.3 || cx > W + D * 0.3 || cy < -D * 0.3 || cy > H + D * 0.3) continue;
          const dx = cx - ix;
          const dy = cy - iy;
          const d = Math.hypot(dx, dy) || 1;
          const sp = 160 + r() * 260;
          out.push({
            poly: poly.map((p) => [p[0] - cx, p[1] - cy]),
            x: cx,
            y: cy,
            vx: (dx / d) * sp + (r() - 0.5) * 120,
            vy: (dy / d) * sp * 0.6 - 260 - r() * 220,
            rot: 0,
            vr: (r() - 0.5) * 7,
            shade: 38 + r() * 10,
            delay: ri * 0.012 + r() * 0.05,
          });
        }
      }
      return out;
    }

    // ---------- gambar ----------
    function pane() {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#f0111c");
      g.addColorStop(0.55, "#d3000f");
      g.addColorStop(1, "#9c000c");
      ctx.fillStyle = g;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      [
        [0.1, 0.1],
        [0.5, 0.05],
        [0.7, 0.14],
      ].forEach(([x, w]) => {
        ctx.beginPath();
        ctx.moveTo(W * x, 0);
        ctx.lineTo(W * (x + w), 0);
        ctx.lineTo(W * (x + w - 0.28), H);
        ctx.lineTo(W * (x - 0.28), H);
        ctx.closePath();
        ctx.fill();
      });
      ctx.strokeStyle = "#0f0f0f";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);
    }

    function hint() {
      if (S.hits > 0) return;
      const fs = clamp(W * 0.07, 26, 60);
      ctx.save();
      ctx.translate(W / 2, H / 2 - fs * 0.2);
      ctx.transform(1, 0, -0.2, 1, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${fs}px ${fam()}`;
      ctx.fillStyle = "#0f0f0f";
      ctx.fillText("PECAHKAN KACA", 5, 5);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillText("PECAHKAN KACA", 0, 0);
      ctx.font = `900 ${Math.max(12, fs * 0.28)}px ${fam()}`;
      ctx.fillText("KLIK / KETUK 3×  •  KONTAK ADA DI BALIKNYA", 0, fs * 0.85);
      ctx.restore();
    }

    function pips() {
      for (let i = 0; i < NEED; i++) {
        ctx.save();
        ctx.transform(1, 0, -0.3, 1, 0, 0);
        ctx.fillStyle = i < S.hits ? "#f5f5f5" : "rgba(15,15,15,0.7)";
        ctx.fillRect(22 + i * 26 + 8, H - 34, 18, 12);
        ctx.restore();
      }
    }

    function drawCrack(c, t) {
      const p = easeOut(clamp((t - c.t) / 0.28));
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const trace = (pts, f) => {
        const total = (pts.length - 1) * f;
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          if (i - 1 >= total) break;
          const k = Math.min(1, total - (i - 1));
          ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k);
        }
      };
      [
        ["rgba(255,255,255,0.28)", 1, 1.2],
        ["#150000", 0, 2.2],
      ].forEach(([col, off, w]) => {
        ctx.save();
        ctx.translate(off, off);
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        c.rays.forEach((pts) => trace(pts, p));
        ctx.stroke();
        // jaring: sambungan antar retakan pada indeks segmen yang sama
        ctx.lineWidth = w * 0.65;
        for (let k = 1; k <= 3; k++) {
          const thr = k / 4;
          if (p < thr) continue;
          ctx.globalAlpha = clamp((p - thr) / 0.25);
          ctx.beginPath();
          c.rays.forEach((pts, i) => {
            const q = pts[Math.min(k + 1, pts.length - 1)];
            i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
          });
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    function draw(t, dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (S.broken && !S.shards.length && t - S.flashT > 0.2) return;

      ctx.save();
      const sk = (t - S.shakeT) / 0.3;
      if (!reduce && sk >= 0 && sk < 1) ctx.translate(Math.sin(t * 90) * (1 - sk) * 5, Math.cos(t * 77) * (1 - sk) * 5);

      if (!S.broken) {
        ctx.globalAlpha = clamp((t - S.born) / 0.25);
        pane();
        hint();
        S.cracks.forEach((c) => drawCrack(c, t));
        pips();
        ctx.globalAlpha = 1;
      }

      // cincin kejut
      S.pulses = S.pulses.filter((p) => t - p.t < 0.35);
      S.pulses.forEach((p) => {
        const k = (t - p.t) / 0.35;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 8 * (1 - k) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, easeOut(k) * Math.min(W, H) * 0.35, 0, TAU);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // serpihan kecil saat retak
      S.chips = S.chips.filter((c) => c.y < H + 40);
      S.chips.forEach((c) => {
        c.vy += 1800 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.vr * dt;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = "#c2000e";
        ctx.strokeStyle = "#150000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-c.r, c.r * 0.6);
        ctx.lineTo(c.r * 0.2, -c.r);
        ctx.lineTo(c.r, c.r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // keping kaca pecah
      const age = t - S.flashT;
      S.shards = S.shards.filter((s) => s.y < H + 260);
      S.shards.forEach((s) => {
        if (age < s.delay) return;
        s.vy += 2300 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.vr * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.beginPath();
        s.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath();
        ctx.fillStyle = `hsl(355 96% ${s.shade}%)`;
        ctx.fill();
        ctx.strokeStyle = "#150000";
        ctx.lineWidth = 2.4;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      });

      if (age >= 0 && age < 0.16) {
        ctx.globalAlpha = 1 - age / 0.16;
        ctx.fillStyle = "#fff";
        ctx.fillRect(-10, -10, W + 20, H + 20);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    const busy = (t) =>
      t - S.born < 0.4 ||
      S.cracks.some((c) => t - c.t < 0.4) ||
      S.chips.length > 0 ||
      S.shards.length > 0 ||
      S.pulses.length > 0 ||
      t - S.shakeT < 0.35 ||
      t - S.flashT < 0.2;

    function frame() {
      raf = 0;
      const t = now();
      const dt = Math.min(0.05, last ? t - last : 0.016);
      last = t;
      draw(t, dt);
      if (busy(t)) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    const kick = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    // ---------- aksi ----------
    function shatter() {
      if (S.broken) return;
      clearTimeout(timer);
      if (!S.ix) {
        S.ix = W / 2;
        S.iy = H / 2;
      }
      S.shards = mkShards(S.ix, S.iy);
      S.cracks = [];
      S.broken = true;
      S.breaking = true;
      S.flashT = now();
      setBroken(true);
      playSfx("rankup");
      kick();
    }

    function hit(x, y) {
      if (S.breaking || S.broken) return;
      const t = now();
      S.hits++;
      S.seed++;
      S.ix = x;
      S.iy = y;
      S.cracks.push(mkCrack(x, y, S.seed * 977 + 13));
      S.pulses.push({ x, y, t });
      const r = rng(S.seed * 31);
      for (let i = 0; i < 8; i++) {
        const a = r() * TAU;
        S.chips.push({ x, y, vx: Math.cos(a) * (80 + r() * 220), vy: Math.sin(a) * (80 + r() * 200) - 180, r: 3 + r() * 6, rot: 0, vr: (r() - 0.5) * 12 });
      }
      S.shakeT = t;
      playSfx("hit");
      if (S.hits >= NEED) {
        S.breaking = true;
        timer = setTimeout(() => {
          S.breaking = false;
          shatter();
        }, 280);
      }
      kick();
    }

    function reset() {
      clearTimeout(timer);
      S = fresh();
      setBroken(false);
      playSfx("open");
      kick();
    }

    api.current = { hit, shatter, reset };

    const size = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      kick();
    };
    const ro = new ResizeObserver(size);
    ro.observe(host);
    size();
    document.fonts?.ready.then(kick);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      api.current = null;
    };
  }, []);

  return (
    <div ref={wrap} className="relative" onFocusCapture={() => api.current?.shatter()}>
      <div className={`flex min-h-[300px] flex-col justify-center p-3 pb-6 ${broken ? "glass-reveal" : ""}`}>{children}</div>
      <canvas
        ref={cv}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: broken ? "none" : "auto", cursor: "crosshair", touchAction: "manipulation" }}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          api.current?.hit(e.clientX - r.left, e.clientY - r.top);
        }}
      />
      {broken && (
        <button
          type="button"
          onClick={() => api.current?.reset()}
          className="mt-2 -skew-x-12 border-2 border-fg px-3 py-1 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
        >
          <span className="inline-block skew-x-12">Pasang kaca baru</span>
        </button>
      )}
    </div>
  );
}
