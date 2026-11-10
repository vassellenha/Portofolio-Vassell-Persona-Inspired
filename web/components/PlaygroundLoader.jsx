"use client";
// Membuka game/generator dengan lazy-load (next/dynamic): kodenya baru diunduh saat tile diklik.
import dynamic from "next/dynamic";
import { useState } from "react";
import { playSfx } from "../lib/sfx";

const Loading = () => <p className="p-4 text-sm font-black uppercase italic">Loading…</p>;
const CallingCard = dynamic(() => import("./play/CallingCard"), { ssr: false, loading: Loading });
const StealGame = dynamic(() => import("./play/StealGame"), { ssr: false, loading: Loading });

const TILES = [
  { id: "card", title: "Calling Card Generator", desc: "Tulis pesan, unduh kartu PNG ala Phantom Thieves.", Comp: CallingCard },
  { id: "game", title: "Steal the Treasure", desc: "Mini-game timing: klik di zona merah. 3 ronde.", Comp: StealGame },
];

export default function PlaygroundLoader() {
  const [open, setOpen] = useState(null);
  const active = TILES.find((t) => t.id === open);

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {TILES.map((t) => {
          const on = open === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(on ? null : t.id);
                  playSfx("open");
                }}
                aria-expanded={on}
                aria-controls="playground-panel"
                className={`block w-full -skew-x-6 border-[3px] border-fg p-5 text-left shadow-[6px_6px_0_var(--red)] transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5] ${
                  on ? "bg-red text-[#f5f5f5]" : "bg-bg"
                }`}
              >
                <span className="block skew-x-6">
                  <span className="block font-display text-xl font-black uppercase italic leading-tight tracking-tighter sm:text-2xl">{t.title}</span>
                  <span className="mt-1 block text-sm font-bold">{t.desc}</span>
                  <span className="mt-3 inline-block text-xs font-black uppercase italic tracking-tighter underline">
                    {on ? "Tutup" : "Buka"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div id="playground-panel" className="mt-6">
        {active && (
          <div className="border-[3px] border-fg bg-bg p-4 sm:p-6">
            <active.Comp />
          </div>
        )}
      </div>
    </div>
  );
}
