"use client";
// Kartu nama 3D di Home: seret untuk memutar 360° (ada inersia), klik/Enter untuk membalik.
// Depan = foto formal (/foto.jpg) + nama & peran; belakang = emblem topi + "Take My Heart" (font Expose).
// Tanpa library: rotasi dihitung sendiri lalu ditulis ke transform CSS; loop berhenti saat kartu diam.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

export default function HeroCard({ name, role }) {
  const card = useRef(null);
  const shine = useRef(null);
  const st = useRef({ ry: -18, rx: 6, vy: 0, vx: 0, drag: false, moved: 0, lx: 0, ly: 0, raf: 0, last: 0, hover: null, target: 0 });
  const photo = useRef(null);
  const [noPhoto, setNoPhoto] = useState(false);

  // Gambar bisa gagal dimuat sebelum React terpasang, jadi cek ulang setelah mount.
  useEffect(() => {
    const i = photo.current;
    if (i && i.complete && !i.naturalWidth) setNoPhoto(true);
  }, []);

  useEffect(() => {
    const el = card.current;
    const s = st.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => {
      el.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      if (shine.current) shine.current.style.backgroundPosition = `${50 + s.ry * 1.2}% ${50 + s.rx * 2}%`;
    };
    const step = (now) => {
      s.raf = 0;
      const dt = Math.min(0.033, s.last ? (now - s.last) / 1000 : 0.016);
      s.last = now;
      if (!s.drag) {
        // inersia, lalu pegas ke sisi terdekat (kelipatan 180°) + sedikit miring mengikuti kursor
        s.ry += s.vy * dt;
        s.rx += s.vx * dt;
        s.vy *= Math.pow(0.12, dt);
        s.vx *= Math.pow(0.02, dt);
        if (Math.abs(s.vy) < 220) {
          const face = Math.round(s.ry / 180) * 180;
          const tiltY = s.hover ? s.hover.x * 16 : 0;
          const tiltX = s.hover ? -s.hover.y * 12 : 0;
          s.vy += (face + tiltY - s.ry) * 60 * dt;
          s.vy *= Math.pow(0.0005, dt);
          s.vx += (tiltX - s.rx) * 60 * dt;
          s.vx *= Math.pow(0.0005, dt);
        }
      }
      s.rx = Math.max(-35, Math.min(35, s.rx));
      apply();
      const face = Math.round(s.ry / 180) * 180;
      const rest = !s.drag && !s.hover && Math.abs(s.vy) < 0.5 && Math.abs(s.vx) < 0.5 && Math.abs(face - s.ry) < 0.1 && Math.abs(s.rx) < 0.1;
      if (!rest) s.raf = requestAnimationFrame(step);
      else s.last = 0;
    };
    const kick = () => {
      if (!s.raf) {
        s.last = 0;
        s.raf = requestAnimationFrame(step);
      }
    };
    s.kick = kick;
    s.flip = () => {
      s.vy += 900;
      playSfx("flip");
      kick();
    };
    apply();
    if (!reduce) kick(); // ayunan pembuka: dari miring ke posisi diam

    const down = (e) => {
      s.drag = true;
      s.moved = 0;
      s.lx = e.clientX;
      s.ly = e.clientY;
      s.vy = s.vx = 0;
      el.setPointerCapture?.(e.pointerId);
      kick();
    };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      if (s.drag) {
        const dx = e.clientX - s.lx;
        const dy = e.clientY - s.ly;
        s.lx = e.clientX;
        s.ly = e.clientY;
        s.moved += Math.abs(dx) + Math.abs(dy);
        s.ry += dx * 0.55;
        s.rx -= dy * 0.25;
        s.vy = dx * 0.55 * 60;
        s.vx = -dy * 0.25 * 60;
      } else if (e.pointerType === "mouse") {
        s.hover = { x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 };
      }
      kick();
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false;
      if (s.moved < 6) s.flip();
      kick();
    };
    const leave = () => {
      s.hover = null;
      kick();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const onKey = (e) => {
    const s = st.current;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      s.flip?.();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      s.vy += e.key === "ArrowRight" ? 500 : -500;
      s.kick?.();
    }
  };

  return (
    <div className="hero-card-wrap">
      <div
        ref={card}
        className="hero-card"
        role="button"
        tabIndex={0}
        aria-label={`Kartu nama ${name}, ${role}. Seret untuk memutar, tekan Enter untuk membalik.`}
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
      <p className="hc-hint" aria-hidden="true">
        <span>Seret untuk memutar · klik untuk membalik</span>
      </p>
    </div>
  );
}
