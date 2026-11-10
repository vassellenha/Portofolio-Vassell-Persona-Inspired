"use client";
// "Potret Kaca" di Home: ilustrasi dipotong jadi keping-keping kaca berpegas.
// Kursor mendorong keping di dekatnya, seret untuk menyapu, klik/ketuk untuk gelombang kejut,
// lalu semuanya memantul kembali ke tempat. Saat diam, <img> asli yang tampil (tanpa biaya render).
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const rng = (seed) => {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
};

export default function ShardPortrait({ src, alt, focusX = 0.62 }) {
  const box = useRef(null);
  const cv = useRef(null);
  const imgRef = useRef(null);
  const [live, setLive] = useState(false);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = box.current;
    const canvas = cv.current;
    const img = imgRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    let shards = [];
    let raf = 0;
    let last = 0;
    let active = false;
    let down = false;
    const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0, in: false };

    function build() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const cols = Math.max(5, Math.round(W / 95));
      const rows = Math.max(4, Math.round(H / 95));
      const rand = rng(77);
      const P = [];
      for (let j = 0; j <= rows; j++) {
        const row = [];
        for (let i = 0; i <= cols; i++) {
          const edge = i === 0 || j === 0 || i === cols || j === rows;
          const jx = edge ? 0 : (rand() - 0.5) * 0.7;
          const jy = edge ? 0 : (rand() - 0.5) * 0.7;
          row.push([((i + jx) / cols) * W, ((j + jy) / rows) * H]);
        }
        P.push(row);
      }
      shards = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
          const tris = rand() < 0.5 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [[q[0], q[1], q[3]], [q[1], q[2], q[3]]];
          tris.forEach((t) => {
            const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
            const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
            // sedikit diperbesar supaya tidak ada celah saat diam
            const poly = t.map((p) => [cx + (p[0] - cx) * 1.03, cy + (p[1] - cy) * 1.03]);
            shards.push({ poly, cx, cy, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, m: 0.7 + rand() * 0.6 });
          });
        }
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1a0000");
      g.addColorStop(1, "#5c0000");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const iw = img.naturalWidth * s;
      const ih = img.naturalHeight * s;
      const ix = -(iw - W) * focusX;
      const iy = -(ih - H) * 0.5;
      for (const sh of shards) {
        ctx.save();
        ctx.translate(sh.cx + sh.x, sh.cy + sh.y);
        ctx.rotate(sh.a);
        ctx.translate(-sh.cx, -sh.cy);
        ctx.beginPath();
        ctx.moveTo(sh.poly[0][0], sh.poly[0][1]);
        ctx.lineTo(sh.poly[1][0], sh.poly[1][1]);
        ctx.lineTo(sh.poly[2][0], sh.poly[2][1]);
        ctx.closePath();
        const d = Math.min(1, (Math.abs(sh.x) + Math.abs(sh.y)) / 14 + Math.abs(sh.a) * 3);
        ctx.save();
        ctx.clip();
        ctx.drawImage(img, ix, iy, iw, ih);
        ctx.restore();
        if (d > 0.05) {
          ctx.strokeStyle = `rgba(10,0,0,${d})`;
          ctx.lineWidth = 2;
          ctx.lineJoin = "round";
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function step(now) {
      raf = 0;
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      const R = Math.min(W, H) * 0.3;
      const stale = now - ptr.t > 120;
      let energy = 0;
      for (const sh of shards) {
        let fx = -sh.x * 90;
        let fy = -sh.y * 90;
        if (ptr.in && !stale) {
          const dx = sh.cx + sh.x - ptr.x;
          const dy = sh.cy + sh.y - ptr.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            const k = 1 - d / R;
            const push = (down ? 2600 : 1500) * k * k;
            fx += (dx / d) * push + ptr.vx * k * (down ? 9 : 4);
            fy += (dy / d) * push + ptr.vy * k * (down ? 9 : 4);
            sh.va += ((dx * ptr.vy - dy * ptr.vx) / (d * d)) * k * 0.02;
          }
        }
        sh.vx = (sh.vx + (fx / sh.m) * dt) * 0.9;
        sh.vy = (sh.vy + (fy / sh.m) * dt) * 0.9;
        sh.va = (sh.va - sh.a * 70 * dt) * 0.9;
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.a += sh.va * dt;
        energy += Math.abs(sh.x) + Math.abs(sh.y) + Math.abs(sh.vx) * 0.02 + Math.abs(sh.vy) * 0.02 + Math.abs(sh.a) * 20;
      }
      draw();
      if (energy > 0.6 || (ptr.in && !stale)) raf = requestAnimationFrame(step);
      else {
        active = false;
        last = 0;
        for (const sh of shards) sh.x = sh.y = sh.vx = sh.vy = sh.a = sh.va = 0;
        setLive(false);
      }
    }
    function wake() {
      if (!img.complete || !img.naturalWidth) return;
      if (!active) {
        active = true;
        draw();
        setLive(true);
      }
      if (!raf) raf = requestAnimationFrame(step);
    }
    function local(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    }
    function blast(x, y, power) {
      const D = Math.hypot(W, H);
      for (const sh of shards) {
        const dx = sh.cx - x;
        const dy = sh.cy - y;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.pow(Math.max(0, 1 - d / (D * 0.75)), 2) * power;
        sh.vx += (dx / d) * k / sh.m;
        sh.vy += (dy / d) * k / sh.m - k * 0.15;
        sh.va += (Math.random() - 0.5) * k * 0.012;
      }
    }
    const onMove = (e) => {
      const p = local(e);
      const now = performance.now();
      const dt = Math.max(8, now - ptr.t);
      ptr.vx = ((p.x - ptr.x) / dt) * 16;
      ptr.vy = ((p.y - ptr.y) / dt) * 16;
      if (Math.abs(ptr.vx) > 400) ptr.vx = ptr.vy = 0;
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.t = now;
      ptr.in = p.inside;
      if (p.inside) wake();
    };
    const onDown = (e) => {
      const p = local(e);
      if (!p.inside || e.target.closest?.("a,button,input,[role=dialog]")) return;
      down = true;
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.t = performance.now();
      ptr.in = true;
      wake();
      blast(p.x, p.y, 1500);
      playSfx("hit");
      setHint(false);
    };
    const onUp = () => (down = false);
    const ro = new ResizeObserver(() => {
      build();
      if (active) draw();
    });
    ro.observe(host);
    build();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [focusX]);

  return (
    <div ref={box} className="relative h-full w-full">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width="1600"
        height="900"
        fetchPriority="high"
        className="h-full w-full object-cover"
        style={{ objectPosition: `${focusX * 100}% 50%`, visibility: live ? "hidden" : "visible" }}
      />
      <canvas ref={cv} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" style={{ visibility: live ? "visible" : "hidden" }} />
      {hint && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 -skew-x-12 bg-[#0f0f0f] px-3 py-1 text-[11px] font-black uppercase italic tracking-tighter text-[#f5f5f5] shadow-[3px_3px_0_#dc0000] motion-reduce:hidden"
        >
          <span className="inline-block skew-x-12">Gerakkan kursor / klik kacanya</span>
        </p>
      )}
    </div>
  );
}
