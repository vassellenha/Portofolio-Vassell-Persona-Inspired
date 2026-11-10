"use client";
// Stat Allocator: klik stat untuk "level up". Murni hiburan — data asli tidak berubah, tombol Reset mengembalikan.
import { useState } from "react";
import { IconStar } from "./Icons";
import { playSfx } from "../lib/sfx";

export default function StatAllocator({ stats }) {
  const [bonus, setBonus] = useState({});
  const [fx, setFx] = useState({ key: null, n: 0 });
  const [msg, setMsg] = useState("");

  const total = Object.values(bonus).reduce((a, b) => a + b, 0);

  function levelUp(s) {
    const cur = s.level + (bonus[s.key] ?? 0);
    if (cur >= 9) {
      playSfx("miss");
      setMsg(`${s.key} sudah level maksimum`);
      return;
    }
    setBonus((b) => ({ ...b, [s.key]: (b[s.key] ?? 0) + 1 }));
    setFx((f) => ({ key: s.key, n: f.n + 1 }));
    setMsg(`${s.key} naik ke level ${cur + 1}`);
    playSfx("rankup");
  }

  return (
    <div>
      <ul className="space-y-3">
        {stats.map((s) => {
          const extra = bonus[s.key] ?? 0;
          const level = Math.min(9, s.level + extra);
          const active = fx.key === s.key;
          return (
            <li key={s.key} className="relative">
              <button
                type="button"
                onClick={() => levelUp(s)}
                aria-label={`Tingkatkan ${s.key}, sekarang level ${level} dari 9`}
                className="relative block w-full overflow-hidden px-2 py-2 text-left transition-colors duration-100 hover:bg-fg hover:text-bg"
              >
                {active && <span key={fx.n} aria-hidden="true" className="flash-red pointer-events-none absolute inset-0 bg-red" />}
                <span className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter sm:text-2xl">
                    <IconStar className="h-5 w-5 text-rt" />
                    {s.key}
                    {active && (
                      <span
                        key={fx.n}
                        aria-hidden="true"
                        className="rank-up -skew-x-12 bg-red px-2 py-0.5 text-xs text-[#f5f5f5]"
                      >
                        <span className="inline-block skew-x-12">LEVEL UP!</span>
                      </span>
                    )}
                  </span>
                  <span className="flex gap-1" role="img" aria-label={`Level ${level} dari 9`}>
                    {Array.from({ length: 9 }, (_, i) => {
                      const base = i < s.level;
                      const added = !base && i < level;
                      return (
                        <span
                          key={i}
                          aria-hidden="true"
                          className={`h-4 w-3 -skew-x-12 border-2 sm:w-5 ${
                            base ? "border-current bg-red" : added ? "border-red bg-current" : "border-current"
                          } ${active && i === level - 1 && added ? "pip-pop" : ""}`}
                        />
                      );
                    })}
                  </span>
                </span>
                <span className="relative mt-1 block text-sm text-mu">{s.skill}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setBonus({});
            setFx({ key: null, n: 0 });
            setMsg("Stat direset");
            playSfx("click");
          }}
          disabled={total === 0}
          aria-label="Reset semua stat"
          className="-skew-x-12 border-[3px] border-current px-4 py-1 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg disabled:opacity-40"
        >
          <span className="inline-block skew-x-12">Reset</span>
        </button>
        <p className="text-xs font-bold text-mu">{total > 0 ? `Bonus +${total}` : "Klik stat untuk level up"}</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {msg}
      </p>
    </div>
  );
}
