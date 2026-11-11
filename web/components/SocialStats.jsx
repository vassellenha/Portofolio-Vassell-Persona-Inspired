"use client";
// Social Stats ala Persona 5: bintang berlapis dengan lima parameter di tiap ujungnya.
// Lengan bintang emas memanjang sesuai level; label huruf "potongan majalah" bisa diklik
// untuk melihat rincian. Level maksimum 9 (mengikuti data profile.json).
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const MAX = 9;
const C = [300, 312]; // pusat bintang di viewBox 600x600
const R = 205; // radius ujung bintang terluar
const R0 = 46; // radius ujung saat level 0
const INNER = 0.4; // rasio lekuk dalam bintang
const TAU = Math.PI * 2;
// urutan ujung: atas, kanan, kanan-bawah, kiri-bawah, kiri (seperti di game)
const ANG = [0, 1, 2, 3, 4].map((i) => -Math.PI / 2 + (i * TAU) / 5);
const POS = [
  { left: "50%", top: "3%", tx: "-50%", align: "center" },
  { right: "0%", top: "27%", tx: "0", align: "right" },
  { right: "8%", top: "83%", tx: "0", align: "right" },
  { left: "8%", top: "83%", tx: "0", align: "left" },
  { left: "0%", top: "27%", tx: "0", align: "left" },
];
const CHEERS = ["Nice!", "Mantap!", "Lagi!", "Combo!", "Stylish!", "Wow!", "MAX!?"];
const FALLBACK = ["Pemula", "Pemula", "Belajar", "Terlatih", "Terlatih", "Cakap", "Mahir", "Ahli", "Master", "Master"];

const pt = (a, r) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
function starPath(r, inner = INNER) {
  const p = [];
  for (let i = 0; i < 5; i++) {
    p.push(pt(ANG[i], r), pt(ANG[i] + TAU / 10, r * inner));
  }
  return p.map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ");
}

// Huruf potongan majalah: tiap huruf punya latar, kemiringan, dan ukuran sendiri (deterministik).
function Cut({ text, seed }) {
  return (
    <span className="ss-cut" aria-hidden="true">
      {[...text].map((ch, i) => {
        const n = (seed * 7 + i * 13) % 10;
        const tone = n % 3 === 0 ? "ss-k" : n % 3 === 1 ? "ss-y" : "ss-y2";
        return (
          <span key={i} className={tone} style={{ rotate: `${((n % 5) - 2) * 2.2}deg`, fontSize: `${0.9 + (n % 4) * 0.07}em`, translate: `0 ${((n % 3) - 1) * 1.5}px` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export default function SocialStats({ stats }) {
  const list = stats.slice(0, 5);
  const [sel, setSel] = useState(0);
  const [k, setK] = useState(0); // 0..1 animasi tumbuh
  const [spin, setSpin] = useState(0); // berapa kali bintang diputar (klik)
  const box = useRef(null);
  const stage = useRef(null);

  // Bintang ikut miring mengikuti kursor (paralaks ringan, lewat CSS variable -> tanpa re-render).
  function tilt(e) {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }
  function untilt() {
    stage.current?.style.setProperty("--px", "0");
    stage.current?.style.setProperty("--py", "0");
  }
  // Klik bintang emas: berputar, memercikkan bintang kecil, lalu pindah ke parameter berikutnya.
  function twirl() {
    setSpin((n) => n + 1);
    setSel((i) => (i + 1) % list.length);
    playSfx("rankup");
  }

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setK(1);
      return;
    }
    let raf;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (now) => {
          const u = Math.min(1, (now - t0) / 900);
          setK(1 - Math.pow(1 - u, 3));
          if (u < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const tipR = list.map((s) => R0 + (R - R0) * (Math.min(MAX, s.level) / MAX) * k);
  const innerR = 30 + 16 * k;
  const cur = list[sel];

  return (
    <div className="ss" ref={box}>
      <div className="ss-stage" ref={stage} onPointerMove={tilt} onPointerLeave={untilt}>
        <svg viewBox="0 0 600 600" className="ss-svg" aria-hidden="true" focusable="false">
          {/* bintang abu besar + lapisan bersarang (tiap lapis bergeser sedikit beda -> kesan kedalaman) */}
          <g className="ss-l1">
            <polygon points={starPath(292, 0.42)} fill="#3b3b3b" />
          </g>
          <g className="ss-l2">
            <polygon points={starPath(R + 34)} fill="#101010" />
            <polygon points={starPath(R + 14)} fill="#454545" />
            <polygon points={starPath(R)} fill="#101010" />
          </g>
          <g className="ss-l3">
            {[0.78, 0.56, 0.34].map((f, i) => (
              <polygon key={f} points={starPath(R0 + (R - R0) * f)} fill={i % 2 ? "#101010" : "#3b3b3b"} stroke="#5a5a5a" strokeWidth="1.5" />
            ))}
            {/* titik level di sepanjang tiap lengan */}
            {list.map((s, i) =>
              Array.from({ length: MAX }, (_, n) => {
                const [x, y] = pt(ANG[i], R0 + ((R - R0) * (n + 1)) / MAX);
                const on = n < s.level * k;
                return <circle key={`${i}-${n}`} cx={x} cy={y} r={on ? 4.2 : 3} fill={on ? "#0b0b0b" : "#8a8a8a"} stroke={on ? "#ffd400" : "none"} strokeWidth="1.5" />;
              })
            )}
          </g>
          {/* bintang emas: tiap lengan dua sisi (terang/gelap) supaya terlihat timbul */}
          <g className="ss-l4">
            <g className="ss-gold" style={{ rotate: `${spin * 360}deg` }}>
              <g className="ss-bob">
                {list.map((s, i) => {
                  const tip = pt(ANG[i], tipR[i]);
                  const a = pt(ANG[i] - TAU / 10, innerR);
                  const b = pt(ANG[i] + TAU / 10, innerR);
                  const f = (q) => q.map((n) => n.toFixed(1)).join(",");
                  return (
                    <g key={s.key} className={sel === i ? "ss-arm is-on" : "ss-arm"}>
                      <polygon points={`${f(C)} ${f(a)} ${f(tip)}`} fill="#ffd400" />
                      <polygon points={`${f(C)} ${f(tip)} ${f(b)}`} fill="#c99700" />
                    </g>
                  );
                })}
                <polygon
                  points={list.map((s, i) => [pt(ANG[i], tipR[i]), pt(ANG[i] + TAU / 10, innerR)]).flat().map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ")}
                  fill="none"
                  stroke="#0b0b0b"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          </g>
        </svg>

        {/* kelap-kelip kecil di sekitar bintang */}
        {[
          ["16%", "14%", 0], ["84%", "12%", 0.7], ["93%", "62%", 1.3], ["6%", "64%", 0.4], ["50%", "96%", 1],
        ].map(([l, t, d]) => (
          <span key={l + t} aria-hidden="true" className="ss-twinkle" style={{ left: l, top: t, animationDelay: `${d}s` }} />
        ))}

        {/* tombol di tengah: putar bintangnya */}
        <button type="button" className="ss-core" onClick={twirl} aria-label="Putar bintang dan lihat parameter berikutnya">
          {spin > 0 && (
            <span key={spin} className="ss-burst" aria-hidden="true">
              {Array.from({ length: 10 }, (_, n) => (
                <i key={n} style={{ "--a": `${n * 36 + (spin % 2) * 18}deg`, "--d": `${70 + ((n * 37) % 60)}px` }} />
              ))}
              <b>{CHEERS[(spin - 1) % CHEERS.length]}</b>
            </span>
          )}
        </button>

        {list.map((s, i) => {
          const p = POS[i];
          const rank = s.rank ?? FALLBACK[Math.min(MAX, s.level)];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSel(i);
                playSfx("click");
              }}
              onMouseEnter={() => setSel(i)}
              onFocus={() => setSel(i)}
              aria-pressed={sel === i}
              aria-label={`${s.key}, level ${s.level} dari ${MAX}, ${rank}`}
              className={`ss-label ${sel === i ? "is-on" : ""}`}
              style={{ left: p.left, right: p.right, top: p.top, translate: `${p.tx} 0`, textAlign: p.align, alignItems: p.align === "center" ? "center" : p.align === "right" ? "flex-end" : "flex-start" }}
            >
              <span className="ss-name">
                <Cut text={s.key} seed={i + 3} />
                <span className="ss-lv">{s.level}</span>
              </span>
              <span className="ss-rank">{rank}</span>
            </button>
          );
        })}
      </div>

      <div className="ss-detail" role="status" aria-live="polite">
        <p className="ss-detail-head">
          <span>{cur.key}</span>
          <span className="ss-detail-lv">
            Lv {cur.level}
            <small>/{MAX}</small>
          </span>
          <span className="ss-detail-rank">{cur.rank ?? FALLBACK[Math.min(MAX, cur.level)]}</span>
        </p>
        <p className="ss-detail-body">{cur.skill}</p>
        <p className="ss-detail-tip" aria-hidden="true">★ Klik bintang emasnya{spin > 0 ? ` — putaran ke-${spin}` : ""}</p>
      </div>
    </div>
  );
}
