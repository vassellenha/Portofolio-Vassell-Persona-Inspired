"use client";
// Kartu nama yang digantung dengan lanyard di Home. Geraknya bandul teredam: tarik kartu ke kiri/kanan
// lalu lepas, ia berayun halus sampai diam. Klik/Enter membalik kartu ke sisi belakang ("Hire Me", font Expose).
// Depan = foto formal (/foto.jpg) + nama & peran. Tanpa library; loop berhenti saat kartu diam.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

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
    const ay = -14;
    let ax = 0;
    let L = 120; // panjang tali
    let reach = 300; // jarak pengait -> tengah kartu (untuk memetakan gerak pointer ke sudut)
    let th = reduce ? 0 : -0.55; // sudut ayun (rad), 0 = lurus ke bawah
    let om = 0; // kecepatan sudut
    let ry = 0; // putaran balik kartu (derajat)
    let vy = 0;
    let face = 0; // target: kelipatan 180
    let hover = 0;
    let drag = null;
    let moved = 0;
    let raf = 0;
    let last = 0;

    function layout() {
      const r = host.getBoundingClientRect();
      ax = r.width / 2;
      L = Math.max(70, Math.min(r.height - el.offsetHeight - 64, r.height * 0.3));
      reach = L + el.offsetHeight * 0.5;
    }
    function render() {
      if (!holder.current) return; // komponen sudah dilepas (pindah halaman)
      const x = ax + Math.sin(th) * L;
      const y = ay + Math.cos(th) * L;
      // kartu sedikit tertinggal dari tali supaya ayunannya terasa berat
      const lag = Math.max(-0.25, Math.min(0.25, om * 0.05));
      holder.current.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(-th + lag).toFixed(4)}rad)`;
      el.style.transform = `rotateY(${ry.toFixed(2)}deg)`;
      if (shine.current) shine.current.style.backgroundPosition = `${50 + ry * 1.2 + th * 90}% 50%`;
      const bow = Math.max(-26, Math.min(26, -om * 7));
      const cx = (ax + x) / 2 + Math.cos(th) * bow;
      const cy = (ay + y) / 2 - Math.sin(th) * bow;
      const d = `M${ax.toFixed(1)} ${ay} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      strap.current.setAttribute("d", d);
      strapEdge.current.setAttribute("d", d);
    }
    function step(now) {
      raf = 0;
      let dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      dt = Math.min(dt, 0.05);
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        if (drag) {
          // mengikuti pointer dengan halus; kecepatan disimpan supaya ayunan berlanjut saat dilepas
          const k = 1 - Math.exp(-22 * h);
          const nt = th + (drag.target - th) * k;
          om = om * 0.8 + ((nt - th) / h) * 0.2;
          th = nt;
        } else {
          om += -46 * Math.sin(th) * h; // bandul
          om *= Math.exp(-1.25 * h); // redaman udara
          th += om * h;
        }
        const goal = face + hover * 8;
        vy += (goal - ry) * 150 * h; // pegas balik kartu (nyaris teredam kritis)
        vy *= Math.exp(-17 * h);
        ry += vy * h;
      }
      render();
      const still = !drag && Math.abs(om) < 0.004 && Math.abs(th) < 0.003 && Math.abs(vy) < 0.4 && Math.abs(face + hover * 8 - ry) < 0.08;
      if (!still) raf = requestAnimationFrame(step);
      else last = 0;
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const flip = () => {
      face += 180;
      playSfx("flip");
      kick();
    };
    ctl.current = {
      flip,
      nudge: (dir) => {
        om += dir * 2.4;
        kick();
      },
    };

    const down = (e) => {
      drag = { x0: e.clientX, th0: th, target: th };
      moved = 0;
      el.setPointerCapture?.(e.pointerId);
      kick();
    };
    const move = (e) => {
      if (drag) {
        const dx = e.clientX - drag.x0;
        moved = Math.max(moved, Math.abs(dx));
        drag.target = Math.max(-1.15, Math.min(1.15, drag.th0 + dx / reach));
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
      layout();
      render();
    });
    layout();
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
              <span>Hire</span> <span>Me</span>
            </p>
          </div>
          <div ref={shine} className="hc-shine" aria-hidden="true" />
        </div>
      </div>
      <p className="hc-hint" aria-hidden="true">
        <span>Tarik untuk mengayun · klik untuk membalik</span>
      </p>
    </div>
  );
}
