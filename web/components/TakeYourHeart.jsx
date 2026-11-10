"use client";
// Easter egg Konami: overlay layar penuh (pecahan kaca + glitch, murni CSS). Tema merah aktif lewat html[data-secret].
import { useEffect, useRef } from "react";

const SHARDS = Array.from({ length: 6 }, (_, i) => {
  const w = 100 / 6;
  const l = i * w;
  return {
    clip: `polygon(${l + 6}% 0, ${l + w + 6}% 0, ${l + w - 6}% 100%, ${l - 6}% 100%)`,
    dx: `${(i % 2 ? 1 : -1) * (30 + i * 8)}vw`,
    dy: `${i % 3 === 0 ? -80 : 80}vh`,
    r: `${(i % 2 ? 1 : -1) * (25 + i * 6)}deg`,
    bg: i % 2 ? "#dc0000" : "#f5f5f5",
  };
});

export default function TakeYourHeart({ onDone }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const t = setTimeout(() => done.current(), 3400);
    const k = (e) => e.key === "Escape" && done.current();
    window.addEventListener("keydown", k);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", k);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tema rahasia"
      onClick={() => done.current()}
      className="fixed inset-0 z-[300] grid place-items-center overflow-hidden bg-[#0f0f0f] text-[#f5f5f5]"
    >
      <div className="relative text-center">
        <p
          data-text="TEMA RAHASIA"
          className="glitch relative -skew-x-12 font-display text-[clamp(2.2rem,11vw,7rem)] font-black uppercase italic leading-none tracking-tighter"
        >
          TEMA RAHASIA
        </p>
        <p className="mt-6 text-sm font-black uppercase italic tracking-tighter text-[#dc0000] [text-shadow:0_0_0_#f5f5f5]">
          <span className="bg-[#f5f5f5] px-3 py-1">Tema rahasia aktif — ulangi kode untuk mematikan</span>
        </p>
      </div>
      {SHARDS.map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="shard-fly absolute inset-0"
          style={{ clipPath: s.clip, background: s.bg, "--dx": s.dx, "--dy": s.dy, "--r": s.r, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
