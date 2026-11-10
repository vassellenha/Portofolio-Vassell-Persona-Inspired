"use client";
// Timing Challenge: bar bergerak bolak-balik, tekan TAP! (klik / tap / Space / Enter) saat di zona merah.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../lib/sfx";

const ROUNDS = 3;
const ZONE_W = [0.24, 0.18, 0.13]; // lebar zona (fraksi bar) per ronde
const PERIOD = [1500, 1150, 850]; // ms satu arah
const MARKER = 0.025; // lebar marker (fraksi bar)
const KEY = "p5:steal-best";

function readBest() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function TimingGame() {
  const [phase, setPhase] = useState("idle"); // idle | playing | between | done
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState([]);
  const [fb, setFb] = useState(null); // { text, perfect }
  const [best, setBest] = useState(readBest);
  const [isNew, setIsNew] = useState(false);

  const barRef = useRef(null);
  const markerRef = useRef(null);
  const btnRef = useRef(null);
  const pos = useRef(0); // 0..1 posisi marker (kiri marker)
  const zone = useRef({ start: 0.4, w: 0.24 });
  const timer = useRef(null);
  const [zoneView, setZoneView] = useState({ start: 0.4, w: 0.24 });

  const total = scores.reduce((a, b) => a + b, 0);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Loop animasi marker (rAF). Posisi ditulis langsung ke DOM -> tanpa re-render per frame.
  useEffect(() => {
    if (phase !== "playing") return;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const t = ((now - t0) / PERIOD[round]) % 2;
      pos.current = t > 1 ? 2 - t : t;
      const bar = barRef.current;
      if (bar && markerRef.current) {
        const px = pos.current * (bar.clientWidth - bar.clientWidth * MARKER);
        markerRef.current.style.transform = `translateX(${px}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, round]);

  function startRound(r) {
    const w = ZONE_W[r];
    const z = { start: 0.08 + Math.random() * (0.84 - w), w };
    zone.current = z;
    setZoneView(z);
    setRound(r);
    setFb(null);
    setPhase("playing");
    setTimeout(() => btnRef.current?.focus(), 0);
  }

  function start() {
    setScores([]);
    setIsNew(false);
    playSfx("open");
    startRound(0);
  }

  function steal() {
    if (phase !== "playing") return;
    const { start: zs, w } = zone.current;
    const center = pos.current * (1 - MARKER) + MARKER / 2;
    const d = Math.abs(center - (zs + w / 2));
    let pts = 0;
    let text = "MISS...";
    let perfect = false;
    if (d <= w * 0.15) {
      pts = 100;
      text = "PERFECT!";
      perfect = true;
      playSfx("perfect");
    } else if (d <= w / 2) {
      pts = 40 + Math.round(40 * (1 - d / (w / 2)));
      text = `HIT! +${pts}`;
      playSfx("hit");
    } else playSfx("miss");

    const next = [...scores, pts];
    setScores(next);
    setFb({ text, perfect });
    setPhase("between");
    timer.current = setTimeout(() => {
      if (round + 1 < ROUNDS) startRound(round + 1);
      else {
        const sum = next.reduce((a, b) => a + b, 0);
        if (sum > best) {
          setBest(sum);
          setIsNew(true);
          try {
            localStorage.setItem(KEY, String(sum));
          } catch {}
        }
        setPhase("done");
      }
    }, 950);
  }

  const btn =
    "-skew-x-12 px-6 py-3 text-base font-black uppercase italic tracking-tighter transition-colors duration-100";

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-black uppercase italic tracking-tighter">
        <span>
          Ronde {phase === "idle" ? 0 : Math.min(round + 1, ROUNDS)}/{ROUNDS}
        </span>
        <span>Skor {total}</span>
        <span>Best {best}</span>
      </div>

      <div
        ref={barRef}
        role="img"
        aria-label="Bar timing. Tekan tombol Tap saat penanda berada di zona merah."
        className="relative mt-4 h-14 overflow-hidden border-[3px] border-fg bg-bg"
      >
        {phase !== "idle" && phase !== "done" && (
          <div className="absolute inset-y-0 bg-red" style={{ left: `${zoneView.start * 100}%`, width: `${zoneView.w * 100}%` }}>
            <div className="absolute inset-y-0 left-[35%] w-[30%] bg-[#f5f5f5]/40" />
          </div>
        )}
        {phase === "playing" || phase === "between" ? (
          <div ref={markerRef} className="absolute inset-y-0 left-0 bg-fg" style={{ width: `${MARKER * 100}%` }} />
        ) : null}
        {fb && (
          <div
            key={`${round}-${fb.text}`}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 grid place-items-center ${fb.perfect ? "flash-red bg-red" : ""}`}
          >
            <span
              className={`pop -skew-x-12 px-3 py-1 font-display text-xl font-black uppercase italic tracking-tighter sm:text-3xl ${
                fb.perfect ? "bg-[#f5f5f5] text-[#0f0f0f]" : "bg-fg text-bg"
              }`}
            >
              {fb.text}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {(phase === "idle" || phase === "done") && (
          <button type="button" onClick={start} className={`${btn} bg-red text-[#f5f5f5] hover:bg-fg hover:text-bg`}>
            <span className="inline-block skew-x-12">{phase === "idle" ? "Mulai" : "Main lagi"}</span>
          </button>
        )}
        {(phase === "playing" || phase === "between") && (
          <button
            ref={btnRef}
            type="button"
            onClick={steal}
            aria-label="Curi! (tekan Space atau Enter)"
            className={`${btn} min-w-40 bg-red text-[#f5f5f5] hover:bg-fg hover:text-bg`}
          >
            <span className="inline-block skew-x-12">TAP!</span>
          </button>
        )}
        <p className="text-xs font-bold text-mu">Klik / tap / Space saat penanda ada di zona merah.</p>
      </div>

      <p role="status" aria-live="polite" className="mt-3 text-sm font-black uppercase italic tracking-tighter">
        {fb?.text}
        {phase === "done" && ` — Total ${total}/${ROUNDS * 100}${isNew ? " — REKOR BARU!" : ""}`}
      </p>
    </div>
  );
}
