"use client";
// Menu radial ala Persona: panah/Tab untuk memilih, Enter untuk lompat, Esc / M untuk menutup.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const ITEMS = [
  ["#home", "Home", "Beranda"],
  ["#profile", "Profil", "Ringkasan profil"],
  ["#skills", "Skills", "Keahlian & pengalaman"],
  ["#projects", "Proyek", "Daftar proyek"],
  ["#references", "Referensi", "Testimoni"],
  ["#playground", "Playground", "Mini-game & alat"],
  ["#contact", "Kontak", "Hubungi saya"],
];
const N = ITEMS.length;
const MID = (N - 1) / 2;

export default function CommandWheel({ onClose }) {
  const [sel, setSel] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[sel]?.focus();
  }, [sel]);

  function go(i) {
    const id = ITEMS[i][0];
    onClose();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.querySelector(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  }

  function onKeyDown(e) {
    const step = (d) => {
      e.preventDefault();
      playSfx("click");
      setSel((s) => (s + d + N) % N);
    };
    switch (e.key) {
      case "Escape":
      case "m":
      case "M":
        e.preventDefault();
        onClose();
        break;
      case "ArrowRight":
      case "ArrowDown":
        step(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        step(-1);
        break;
      case "Tab":
        step(e.shiftKey ? -1 : 1);
        break;
      default:
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu cepat"
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[150] grid place-items-center overflow-hidden"
      style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle,var(--red)_2px,transparent_2.5px)_0_0/16px_16px]" />
      <div className="relative flex w-[min(94vw,28rem)] flex-col gap-1">
        {ITEMS.map(([id, label, sub], i) => {
          const off = i - MID;
          const active = i === sel;
          return (
            <button
              key={id}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              tabIndex={active ? 0 : -1}
              onClick={() => go(i)}
              onMouseMove={() => sel !== i && setSel(i)}
              aria-label={`Lompat ke ${label}`}
              style={{
                transform: `translateX(${Math.round(Math.abs(off) * 22 - 40 + (active ? 26 : 0))}px) rotate(${(off * 2.2).toFixed(1)}deg)`,
                animationDelay: `${i * 45}ms`,
              }}
              className="cmd-in group relative block text-left transition-transform duration-150 focus:outline-none"
            >
              <span aria-hidden="true" className={`cmd-shard absolute inset-0 translate-x-2 translate-y-1.5 transition-colors duration-100 ${active ? "bg-red" : "bg-red/70"}`} />
              <span
                className={`cmd-bar relative block px-8 pb-2 pt-1.5 transition-colors duration-100 ${
                  active ? "bg-[#f5f5f5] text-[#0f0f0f]" : "bg-[#0f0f0f] text-[#f5f5f5]"
                }`}
              >
                <span className="block font-display text-2xl font-black uppercase italic leading-none tracking-tighter sm:text-3xl">
                  <span className={`text-[1.25em] ${active ? "text-[#dc0000]" : ""}`}>{label.slice(0, 1)}</span>
                  {label.slice(1)}
                </span>
                <span className={`mt-1 block text-xs font-black italic tracking-tight ${active ? "text-[#dc0000]" : "text-[#f5f5f5]"}`}>{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="absolute bottom-6 px-4 text-center text-xs font-black uppercase italic tracking-tighter">
        Panah = pilih · Enter = lompat · Esc = tutup
      </p>
    </div>
  );
}
