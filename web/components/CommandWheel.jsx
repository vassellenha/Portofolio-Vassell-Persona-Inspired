"use client";
// Menu radial ala Persona: panah/Tab untuk memilih, Enter untuk lompat, Esc / M untuk menutup.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const ITEMS = [
  ["#home", "Home"],
  ["#profile", "Profile"],
  ["#skills", "Skills"],
  ["#heists", "Heists"],
  ["#confidant", "Confidant"],
  ["#playground", "Playground"],
  ["#contact", "Contact"],
];
const N = ITEMS.length;
const RX = 112;
const RY = 132;

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
      className="fixed inset-0 z-[150] grid place-items-center"
      style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)" }}
    >
      <div className="relative h-[22rem] w-[min(92vw,22rem)]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -skew-x-12 bg-red px-5 py-3 font-display text-lg font-black uppercase italic tracking-tighter text-[#f5f5f5]"
        >
          <span className="inline-block skew-x-12">{ITEMS[sel][1]}</span>
        </div>
        {ITEMS.map(([id, label], i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
          const x = Math.round(Math.cos(a) * RX);
          const y = Math.round(Math.sin(a) * RY);
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
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                animationDelay: `${i * 40}ms`,
              }}
              className={`wheel-in absolute w-24 -skew-x-12 border-[3px] border-fg py-2 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 ${
                active ? "bg-red text-[#f5f5f5]" : "bg-fg text-bg"
              }`}
            >
              <span className="inline-block skew-x-12">{label}</span>
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
