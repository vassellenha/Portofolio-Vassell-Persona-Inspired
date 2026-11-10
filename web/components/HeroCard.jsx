"use client";
// Kartu nama yang digantung dengan lanyard di Home. Tali = rantai titik (integrasi Verlet) dari pengait di atas;
// kartu menempel di ujungnya, jadi bisa ditarik, dilempar, dan berayun sendiri. Klik/Enter membalik kartu,
// ayunan ke samping ikut memelintirnya. Depan = foto formal (/foto.jpg) + nama & peran;
// belakang = emblem topi + "Take My Heart" (font Expose). Tanpa library; loop berhenti saat kartu diam.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const SEG = 10;

export default function HeroCard({ name, role }) {
  const stage = useRef(null);
  const holder = useRef(null);
  const card = useRef(null);
  const strap = useRef(null);
  const strapEdge = useRef(null);
  const shine = useRef(null);
  const photo = useRef(null);
  const ctl = useRef({});
  const [noPhoto, setNoPhoto] = useState(false);

  // Gambar bisa gagal dimuat sebelum React terpasang, jadi cek ulang setelah mount.
  useEffect(() => {
    const i = photo.current;
    if (i && i.complete && !i.naturalWidth) setNoPhoto(true);
  }, []);

  useEffect(() => {
    const host = stage.current;
    const el = card.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let L = 120;
    let ax = 0;
    const ay = -14;
    let pts = [];
    let raf = 0;
    let drag = null;
    let moved = 0;
    let rz = 0;
    let ry = 0;
    let vy = 0;
    let hover = 0;

    function layout(swing) {
      const r = host.getBoundingClientRect();
      ax = r.width / 2;
      L = Math.max(70, Math.min(r.height - el.offsetHeight - 64, r.height * 0.3));
      const a = swing && !reduce ? -0.75 : 0;
      pts = Array.from({ length: SEG + 1 }, (_, i) => {
        const d = (L * i) / SEG;
        const x = ax + Math.sin(a) * d;
        const y = ay + Math.cos(a) * d;
        return { x, y, px: x, py: y };
      });
    }

    function render() {
      const e = pts[SEG];
      const p = pts[SEG - 2];
      const want = Math.atan2(-(e.x - p.x), e.y - p.y);
      rz += (want - rz) * 0.35;
      holder.current.style.transform = `translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px) rotate(${rz.toFixed(4)}rad)`;
      el.style.transform = `rotateY(${ry.toFixed(2)}deg)`;
      if (shine.current) shine.current.style.backgroundPosition = `${50 + ry * 1.2 + rz * 120}% 50%`;
      let d = `M${ax.toFixed(1)} ${ay}`;
      for (let i = 1; i < SEG; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      d += ` L${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      strap.current.setAttribute("d", d);
      strapEdge.current.setAttribute("d", d);
    }

    function step() {
      raf = 0;
      const h = 1 / 120;
      let energy = 0;
      const ex0 = pts[SEG].x;
      for (let sub = 0; sub < 2; sub++) {
        for (let i = 1; i <= SEG; i++) {
          const p = pts[i];
          if (drag && i === SEG) continue;
          const vx = (p.x - p.px) * 0.992;
          const vyy = (p.y - p.py) * 0.992;
          p.px = p.x;
          p.py = p.y;
          p.x += vx;
          p.y += vyy + 2800 * h * h * (i === SEG ? 1.6 : 1);
          energy += Math.abs(vx) + Math.abs(vyy);
        }
        if (drag) {
          const e = pts[SEG];
          let tx = drag.x;
          let ty = drag.y;
          const dx = tx - ax;
          const dy = ty - ay;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist > L) {
            tx = ax + (dx / dist) * L;
            ty = ay + (dy / dist) * L;
          }
          e.px = e.x;
          e.py = e.y;
          e.x = tx;
          e.y = ty;
        }
        const len = L / SEG;
        for (let it = 0; it < 8; it++) {
          pts[0].x = ax;
          pts[0].y = ay;
          for (let i = 0; i < SEG; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            const diff = (dist - len) / dist;
            const pinB = drag && i + 1 === SEG;
            const fa = i === 0 ? 0 : pinB ? 1 : 0.5;
            const fb = pinB ? 0 : 1 - fa;
            a.x += dx * diff * fa;
            a.y += dy * diff * fa;
            b.x -= dx * diff * fb;
            b.y -= dy * diff * fb;
          }
        }
      }
      // pelintiran kartu: ayunan ke samping memutar kartu, lalu pegas ke sisi terdekat
      const dt = 1 / 60;
      const evx = (pts[SEG].x - ex0) * 60;
      vy += evx * 1.1 * dt;
      ry += vy * dt;
      vy *= Math.pow(0.14, dt);
      const face = Math.round(ry / 180) * 180 + hover * 14;
      if (Math.abs(vy) < 240) {
        vy += (face - ry) * 55 * dt;
        vy *= Math.pow(0.001, dt);
      }
      render();
      const rest = !drag && energy < 0.05 && Math.abs(vy) < 0.6 && Math.abs(face - ry) < 0.15;
      if (!rest) raf = requestAnimationFrame(step);
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const local = (e) => {
      const r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const flip = () => {
      vy += 900;
      playSfx("flip");
      kick();
    };
    ctl.current = {
      flip,
      nudge: (dir) => {
        pts[SEG].px -= dir * 9;
        kick();
      },
    };

    const down = (e) => {
      const p = local(e);
      drag = { x: pts[SEG].x, y: pts[SEG].y, gx: p.x - pts[SEG].x, gy: p.y - pts[SEG].y };
      moved = 0;
      el.setPointerCapture?.(e.pointerId);
      kick();
    };
    const move = (e) => {
      const p = local(e);
      if (drag) {
        const nx = p.x - drag.gx;
        const ny = p.y - drag.gy;
        moved += Math.abs(nx - drag.x) + Math.abs(ny - drag.y);
        drag.x = nx;
        drag.y = ny;
      } else if (e.pointerType === "mouse") {
        const r = el.getBoundingClientRect();
        hover = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      }
      kick();
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      if (moved < 6) flip();
      kick();
    };
    const leave = () => {
      hover = 0;
      kick();
    };
    const ro = new ResizeObserver(() => {
      layout(false);
      render();
      kick();
    });
    layout(true);
    render();
    kick();
    ro.observe(host);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ctl.current.flip?.();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      ctl.current.nudge?.(e.key === "ArrowRight" ? 1 : -1);
    }
  };

  return (
    <div ref={stage} className="lanyard-stage">
      <svg className="lanyard-svg" aria-hidden="true">
        <path ref={strapEdge} fill="none" stroke="#0f0f0f" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={strap} fill="none" stroke="#dc0000" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div ref={holder} className="lanyard-holder">
        <span className="lanyard-clip" aria-hidden="true" />
        <div
          ref={card}
          className="hero-card"
          role="button"
          tabIndex={0}
          aria-label={`Kartu nama ${name}, ${role}. Tarik untuk mengayun, tekan Enter untuk membalik.`}
          onKeyDown={onKey}
        >
          {/* DEPAN */}
          <div className="hc-face hc-front">
            <div className="hc-photo">
              {noPhoto ? (
                <div className="hc-nophoto">
                  <svg viewBox="0 0 120 150" aria-hidden="true">
                    <circle cx="60" cy="52" r="26" />
                    <path d="M12 150c2-34 22-54 48-54s46 20 48 54z" />
                  </svg>
                  <span>taruh foto di web/public/foto.jpg</span>
                </div>
              ) : (
                <img ref={photo} src="/foto.jpg" alt={`Foto ${name}`} draggable={false} onError={() => setNoPhoto(true)} />
              )}
            </div>
            <div className="hc-info">
              <p className="hc-name">{name}</p>
              <p className="hc-role">{role}</p>
            </div>
            <span className="hc-tag" aria-hidden="true">
              Portofolio // 2026
            </span>
          </div>
          {/* BELAKANG */}
          <div className="hc-face hc-back" aria-hidden="true">
            <svg viewBox="0 0 200 150" className="hc-hat">
              <g stroke="#f5f5f5" strokeWidth="5" strokeLinejoin="round">
                <path d="M18 104c30 16 134 16 164-2l-10-12c-36 12-108 12-144 2z" fill="#dc0000" />
                <path d="M52 92 62 30c24-10 56-10 78 2l8 58c-28 10-68 10-96 2z" fill="#dc0000" />
                <path d="M54 80c28 9 62 9 92-1l2 13c-28 10-68 10-96 2z" fill="#0f0f0f" />
              </g>
              <path d="M150 34c16-14 34-10 38 4-10-4-18 2-22 12-2-8-8-14-16-16z" fill="#f5f5f5" />
              <path d="M70 112c10 14 40 22 62 2-8 20-22 30-36 32-12-4-22-16-26-34z" fill="#f5f5f5" stroke="#0f0f0f" strokeWidth="3" />
            </svg>
            <p className="hc-take">
              <span>Take</span> <span>My</span> <span>Heart</span>
            </p>
          </div>
          <div ref={shine} className="hc-shine" aria-hidden="true" />
        </div>
      </div>
      <p className="hc-hint" aria-hidden="true">
        <span>Tarik · ayun · klik balik</span>
      </p>
    </div>
  );
}
