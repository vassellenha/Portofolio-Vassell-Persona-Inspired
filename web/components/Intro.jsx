"use client";
// Intro bergaya transisi "All-Out Attack" Persona 5, digambar di <canvas>:
//   1. banjir tinta putih  2. putih surut -> layar merah + silhouette karakter berdiri
//   3. kaca retak (garis retak hitam) + silhouette jatuh + debu putih
//   4. kaca pecah -> kolase keping yang masing-masing menampilkan potongan ilustrasi
//   5. keping berhamburan, ilustrasi penuh + nameplate muncul, lalu disapu ke halaman.
// Hanya sekali per sesi; klik / Esc / "Lewati" menutup. Dimatikan bila reduced-motion (lihat skrip di layout).
import { useEffect, useRef } from "react";

const T_OUT = 5.2;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeIn = (x) => x * x * x;
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const FONT = '"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Bentuk tinta/awan putih bergerigi ala splash Persona
function blobPath(ctx, cx, cy, R, phi, spikes = 1) {
  const n = 120;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const lobe = Math.pow(Math.abs(Math.sin(a * 3.5 + phi)), 0.55);
    const r = R * (0.84 + 0.2 * lobe * spikes + 0.06 * Math.sin(a * 11 + phi * 2) + 0.035 * Math.sin(a * 23));
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// Geometri kaca: sel radial dari titik benturan (retakan = sisi sel)
function buildGlass(W, H, rand) {
  const IX = W * 0.45;
  const IY = H * 0.5;
  const D = Math.hypot(W, H);
  const rings = [0, 0.045, 0.11, 0.21, 0.36, 0.6, 1.2].map((f) => f * D);
  const SEG = 13;
  const grid = rings.map((rad, r) =>
    Array.from({ length: SEG }, (_, k) => {
      if (r === 0) return [IX, IY];
      const a = (k / SEG) * TAU + (r % 2 ? 0.14 : -0.05) + (rand() - 0.5) * 0.2;
      const rr = rad * (0.82 + rand() * 0.36);
      return [IX + Math.cos(a) * rr, IY + Math.sin(a) * rr * 0.92];
    })
  );
  const cells = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let k = 0; k < SEG; k++) {
      const k2 = (k + 1) % SEG;
      const poly = r === 0 ? [grid[0][0], grid[1][k], grid[1][k2]] : [grid[r][k], grid[r][k2], grid[r + 1][k2], grid[r + 1][k]];
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
      const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      cells.push({ poly, cx, cy, r, shade: 41 + rand() * 6 });
    }
  }
  const cracks = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * TAU + (rand() - 0.5) * 0.5;
    const pts = [[IX, IY]];
    let x = IX;
    let y = IY;
    for (let s = 0; s < 9; s++) {
      const step = D * (0.05 + rand() * 0.07);
      const aa = a + (rand() - 0.5) * 0.55;
      x += Math.cos(aa) * step;
      y += Math.sin(aa) * step;
      pts.push([x, y]);
    }
    return pts;
  });
  return { IX, IY, D, cells, cracks };
}

// Menutup intro. Kelas no-wipe mencegah wipe merah-hitam bawaan halaman ikut berjalan lagi setelah intro (penyebab gerak slide ganda).
function endIntro() {
  const root = document.documentElement;
  root.classList.add("no-wipe");
  root.classList.remove("intro");
  try {
    sessionStorage.setItem("p5:intro", "1");
  } catch {}
}

export default function Intro() {
  const ref = useRef(null);
  const wrap = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("intro")) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let done = false;
    let cancelled = false;
    let outTimer = 0;
    let started = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    let G = null;
    let puffs = [];
    let splats = [];
    const imgs = {};
    let t0 = 0;
    let silC = null;

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(outTimer);
      endIntro();
    };
    const key = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", key);

    const size = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      G = buildGlass(W, H, rng(11));
      const r2 = rng(5);
      puffs = Array.from({ length: 16 }, () => ({
        x: W * (0.1 + r2() * 0.62),
        y: H * (0.82 + r2() * 0.08),
        r: H * (0.05 + r2() * 0.06),
        t: 1.75 + r2() * 0.5,
        ph: r2() * TAU,
      }));
      splats = Array.from({ length: 22 }, () => ({ a: r2() * TAU, d: 0.52 + r2() * 0.5, s: 4 + r2() * 14 }));
      G.cells.forEach((c, i) => {
        const r3 = rng(100 + i);
        c.sc = 1.15 + r3() * 1.1;
        c.rot = (r3() - 0.5) * 0.28;
        c.fx = 0.2 + r3() * 0.7;
        c.fy = 0.1 + r3() * 0.8;
        c.delay = (c.r * 0.045 + r3() * 0.08) * 1.1;
        c.spin = (r3() - 0.5) * 1.6;
      });
    };

    function cover(img, zoom = 1, fx = 0.62) {
      const s = Math.max(W / img.width, H / img.height) * zoom;
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, -(w - W) * fx, -(h - H) * 0.5, w, h);
    }

    function silhouette() {
      if (silC) return silC;
      const c = document.createElement("canvas");
      c.width = imgs.cut.width;
      c.height = imgs.cut.height;
      const x = c.getContext("2d");
      x.drawImage(imgs.cut, 0, 0);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = "#0a0000";
      x.fillRect(0, 0, c.width, c.height);
      silC = c;
      return c;
    }

    // layar merah + sel kaca bernuansa + garis retak hitam (menyebar dari titik benturan)
    function pane(crackP) {
      const g = ctx.createRadialGradient(G.IX, G.IY, 0, G.IX, G.IY, G.D * 0.7);
      g.addColorStop(0, "#ff1a22");
      g.addColorStop(1, "#c4000e");
      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, W + 120, H + 120);
      if (crackP <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(G.IX, G.IY, crackP * G.D * 0.75, 0, TAU);
      ctx.clip();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      G.cells.forEach((c) => {
        ctx.beginPath();
        c.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath();
        ctx.fillStyle = `hsl(355 96% ${c.shade}%)`;
        ctx.fill();
        ctx.strokeStyle = "#1a0000";
        ctx.lineWidth = c.r < 2 ? 2.4 : 1.6;
        ctx.stroke();
      });
      G.cracks.forEach((pts) => {
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.strokeStyle = "#120000";
        ctx.lineWidth = 3.2;
        ctx.stroke();
      });
      ctx.fillStyle = "#120000";
      ctx.beginPath();
      ctx.arc(G.IX, G.IY, 9, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    function dust(t) {
      ctx.fillStyle = "#fff";
      puffs.forEach((p) => {
        const k = t - p.t;
        if (k < 0 || k > 1.0) return;
        const grow = easeOut(clamp(k / 0.3));
        const fade = 1 - seg(k, 0.4, 1.0);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU + p.ph;
          const rr = p.r * grow * (0.45 + (0.55 * ((i * 7) % 5)) / 4);
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(a) * p.r * grow * 0.9, p.y + Math.sin(a) * p.r * grow * 0.5 - k * 20, Math.max(0.5, rr * fade * 0.9), 0, TAU);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    // 1) putih membanjir dari tengah
    function flood(t) {
      const a = easeOut(seg(t, 0.15, 0.78));
      const R = a * G.D * 0.62;
      ctx.fillStyle = "#fff";
      blobPath(ctx, W * 0.5, H * 0.5, R, 0.3, 1);
      ctx.fill();
      splats.forEach((s) => {
        const d = R * (0.9 + s.d * 0.5);
        ctx.beginPath();
        ctx.arc(W * 0.5 + Math.cos(s.a) * d, H * 0.5 + Math.sin(s.a) * d * 0.9, s.s * a, 0, TAU);
        ctx.fill();
      });
    }

    // 2) putih surut ke pojok kanan-atas; di dalamnya ada pusaran merah
    function recede(t) {
      const k = easeIO(seg(t, 0.95, 1.95));
      const R = (1 - k) * G.D * 0.62;
      if (R < 2) return;
      const cx = W * (0.5 + 0.36 * k);
      const cy = H * (0.5 - 0.5 * k);
      ctx.fillStyle = "#fff";
      blobPath(ctx, cx, cy, R, 0.3 + k, 1);
      ctx.fill();
      ctx.fillStyle = "#e4000f";
      blobPath(ctx, cx - R * 0.18, cy + R * 0.12, R * 0.56, 1.7 + k * 2, 1.4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      blobPath(ctx, cx - R * 0.2, cy + R * 0.14, R * 0.3, 0.2 - k, 1.2);
      ctx.fill();
    }

    // siluet berdiri: satu besar di depan + dua lebih kecil di belakang (seperti tim di video)
    function sil(t) {
      const s = silhouette();
      const crew = [
        { x: 0.38, h: 0.8, flip: 1, at: 0.95, rot: 0 },
        { x: 0.7, h: 0.58, flip: -1, at: 1.08, rot: 0.04 },
        { x: 0.13, h: 0.5, flip: 1, at: 1.18, rot: -0.05 },
      ];
      crew.forEach((m, i) => {
        const h = H * m.h;
        const w = (s.width / s.height) * h;
        const appear = easeOut(seg(t, m.at, m.at + 0.35));
        const fall = easeIn(seg(t, 1.95 + i * 0.07, 2.45 + i * 0.07));
        ctx.save();
        ctx.globalAlpha = appear * (1 - fall);
        ctx.translate(W * m.x, H + (1 - appear) * H * 0.12 + fall * H * 0.5);
        ctx.rotate(m.rot - fall * 0.5 * m.flip);
        ctx.scale(m.flip, 1);
        ctx.drawImage(s, -w / 2, -h, w, h);
        ctx.restore();
      });
    }

    // goyang + dorongan zoom saat kaca terbentur
    function shake(t) {
      const k = (t - 1.5) / 0.7;
      if (k < 0 || k > 1) return;
      const a = Math.pow(1 - k, 2);
      ctx.translate(W / 2 + Math.sin(t * 95) * a * H * 0.014, H / 2 + Math.cos(t * 83) * a * H * 0.014);
      ctx.scale(1 + 0.05 * a, 1 + 0.05 * a);
      ctx.translate(-W / 2, -H / 2);
    }

    // cincin kejut putih dari titik benturan
    function ring(t) {
      const k = seg(t, 1.5, 1.95);
      if (k <= 0 || k >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 14 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(G.IX, G.IY, easeOut(k) * G.D * 0.5, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    // garis kecepatan radial tipis
    function speed(t, a0, a1, alpha) {
      const k = seg(t, a0, a1);
      if (k <= 0 || k >= 1) return;
      ctx.save();
      ctx.globalAlpha = alpha * Math.sin(k * Math.PI);
      ctx.fillStyle = "#fff";
      const r2 = rng(77);
      for (let i = 0; i < 46; i++) {
        const a = r2() * TAU + t * 0.15;
        const r0 = G.D * (0.12 + r2() * 0.3);
        const r1 = r0 + G.D * (0.12 + r2() * 0.34);
        const w = 0.004 + r2() * 0.01;
        ctx.beginPath();
        ctx.moveTo(G.IX + Math.cos(a - w) * r0, G.IY + Math.sin(a - w) * r0);
        ctx.lineTo(G.IX + Math.cos(a) * r1, G.IY + Math.sin(a) * r1);
        ctx.lineTo(G.IX + Math.cos(a + w) * r0, G.IY + Math.sin(a + w) * r0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 4/5) kolase keping kaca berisi potongan ilustrasi; setelah 3.2s berhamburan
    function collage(t) {
      G.cells.forEach((c) => {
        const e = easeIn(clamp((t - 3.2 - c.delay) / 0.75));
        const dx = (c.cx - G.IX) * 0.85 * e;
        const dy = (c.cy - G.IY) * 0.85 * e + e * H * 0.55;
        const slam = easeOut(clamp((t - 2.5 - c.r * 0.018) / 0.2));
        const pulse = (1 + 0.012 * Math.sin(t * 40 + c.r)) * (1 - e * 0.35) * (1 + (1 - slam) * 0.4);
        if (slam <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, slam * 3);
        ctx.translate(c.cx + dx, c.cy + dy);
        ctx.rotate(c.spin * e + c.rot * 0.3);
        ctx.scale(pulse, pulse);
        ctx.translate(-c.cx, -c.cy);
        ctx.beginPath();
        c.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "#120000";
        ctx.fillRect(0, 0, W, H);
        const im = imgs.oc;
        const s = Math.max(W / im.width, H / im.height) * c.sc;
        ctx.translate(c.cx, c.cy);
        ctx.rotate(c.rot);
        ctx.drawImage(im, -im.width * s * c.fx, -im.height * s * c.fy, im.width * s, im.height * s);
        ctx.restore();
        ctx.strokeStyle = "#0c0000";
        ctx.lineWidth = 3.2;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      });
    }

    function streaks(t) {
      const k = seg(t, 2.5, 2.9);
      if (k <= 0 || k >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = "#fff";
      [
        [0.2, 0.13],
        [0.55, 0.07],
        [0.72, 0.1],
      ].forEach(([x, w], i) => {
        const o = (k - 0.05 * i) * W * 0.45;
        ctx.beginPath();
        ctx.moveTo(W * x + o, 0);
        ctx.lineTo(W * (x + w) + o, 0);
        ctx.lineTo(W * (x + w - 0.25) + o, H);
        ctx.lineTo(W * (x - 0.25) + o, H);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();
    }

    function nameplate(t) {
      const a = easeOut(seg(t, 3.75, 4.2));
      const b = easeOut(seg(t, 3.95, 4.4));
      if (a <= 0) return;
      const x0 = Math.max(16, W * 0.05);
      const fs1 = clamp(W * 0.05, 22, 52);
      const fs2 = clamp(W * 0.024, 14, 24);
      const y1 = H - Math.max(28, H * 0.12) - fs2 * 2.2;
      const sk = -Math.tan((12 * Math.PI) / 180);
      const draw = (txt, fs, y, bg, fg, p) => {
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
      const h1 = draw("Vassell Enha Atthayya", fs1, y1, "#f5f5f5", "#0f0f0f", a);
      draw("Full Stack Developer", fs2, y1 + h1 + 8, "#dc0000", "#f5f5f5", b);
    }

    function frame(now) {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0b0000";
      ctx.fillRect(0, 0, W, H);

      if (t < 0.78) {
        flood(t);
      } else if (t < 0.95) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, W, H);
      } else if (t < 2.5) {
        ctx.save();
        shake(t);
        pane(easeOut(seg(t, 1.5, 1.95)));
        ring(t);
        sil(t);
        dust(t);
        recede(t);
        ctx.restore();
      } else if (t < 3.2) {
        ctx.fillStyle = "#120000";
        ctx.fillRect(0, 0, W, H);
        collage(t);
        speed(t, 2.5, 3.2, 0.55);
        streaks(t);
      } else {
        cover(imgs.oc, 1 + 0.14 * (1 - easeOut(seg(t, 3.2, 4.6))));
        collage(t);
        speed(t, 3.2, 3.9, 0.4);
        nameplate(t);
      }
      if (t >= 2.48 && t < 2.56) {
        ctx.fillStyle = `rgba(255,255,255,${1 - (t - 2.48) / 0.08})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (t >= T_OUT && !started) {
        started = true;
        wrap.current?.classList.add("out");
        outTimer = setTimeout(finish, 650);
      }
      if (!done) raf = requestAnimationFrame(frame);
    }

    const load = (src) =>
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      });
    Promise.all([load("/oc.jpg"), load("/oc-cut.webp")])
      .then(([oc, cut]) => {
        if (done || cancelled) return;
        imgs.oc = oc;
        imgs.cut = cut;
        size();
        raf = requestAnimationFrame(frame);
      })
      .catch(finish);
    const fallback = setTimeout(() => !t0 && !cancelled && finish(), 6000);
    window.addEventListener("resize", size);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", size);
      cancelled = true;
      done = true; // mode Strict (dev) memasang efek dua kali: efek pertama tidak boleh ikut menjalankan animasi
      clearTimeout(fallback);
      cancelAnimationFrame(raf);
      clearTimeout(outTimer);
    };
  }, []);

  const skip = () => endIntro();

  return (
    <div ref={wrap} className="intro-ov" role="presentation" aria-hidden="true" onClick={skip}>
      <canvas ref={ref} className="intro-canvas" />
      <button type="button" className="intro-skip" onClick={skip}>
        Lewati
      </button>
    </div>
  );
}
