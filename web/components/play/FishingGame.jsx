"use client";
// Mancing (ala kolam pemancingan Persona 5 Royal):
// 1) Lempar kail, tunggu tanda "!" lalu tekan PULL!! untuk mengait.
// 2) Ikan menarik penanda ke kiri/kanan — tahan ◀ ▶ supaya penanda tetap di zona merah,
//    lalu tekan PULL!! berkali-kali untuk menggulung. Menggulung di luar zona merah atau
//    membentur ujung gauge mengurangi daya tahan tali.
// 3) Ikan terangkat -> ALL-OUT ATTACK.
// Ada tutorial 3 langkah (muncul pertama kali / tombol "?"), pemandu yang berkomentar langsung,
// combo, dan koleksi ikan yang tersimpan di browser.
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../lib/sfx";
import AllOutAttack from "../AllOutAttack";

const KEY = "p5:fish-best";
const DEX = "p5:fish-dex";
const TUT = "p5:fish-tut";
const LINE = 3; // daya tahan tali
const PLAYER = 0.78; // kecepatan dorong pemain (fraksi gauge / detik)
const FISH = [
  { id: "mas", name: "Ikan Mas", min: 12, max: 28, zone: 0.44, pull: 0.3, step: 0.1, w: 45, stars: 1 },
  { id: "lele", name: "Lele", min: 25, max: 45, zone: 0.38, pull: 0.4, step: 0.085, w: 30, stars: 2 },
  { id: "gurame", name: "Gurame", min: 30, max: 55, zone: 0.32, pull: 0.48, step: 0.075, w: 17, stars: 3 },
  { id: "boss", name: "Penguasa Kolam", min: 90, max: 140, zone: 0.26, pull: 0.58, step: 0.06, w: 8, stars: 5 },
];
const HINT = {
  idle: "Siap? Lempar kailnya!",
  waiting: "Sabar… tunggu tanda “!” muncul.",
  bite: "SEKARANG! Tekan PULL!!",
  left: "Penanda kabur ke kiri — tahan ▶",
  right: "Penanda kabur ke kanan — tahan ◀",
  in: "Di zona merah! Hajar PULL!!",
  edge: "Awas ujung gauge! Tarik balik!",
  out: "Jangan menggulung di luar merah!",
  lost: "Yah, lepas. Coba lagi!",
  caught: "Mantap! Lempar lagi?",
};
const STEPS = [
  { t: "Lempar & kait", d: "Tekan Lempar kail, lalu tunggu. Begitu pelampung tenggelam dan muncul tanda “!”, cepat tekan PULL!! untuk mengait ikannya.", demo: "bite" },
  { t: "Jaga di zona merah", d: "Ikan menarik penanda ke kiri dan kanan. Tahan tombol ◀ ▶ (atau ← → di keyboard) supaya penanda tetap di dalam zona merah.", demo: "hold" },
  { t: "Gulung, jangan putus", d: "Selama penanda di zona merah, tekan PULL!! (atau Space) berkali-kali. Menggulung di luar merah atau membentur ujung gauge memutus tali — kesempatanmu cuma 3.", demo: "pull" },
];

function pickFish() {
  let r = Math.random() * FISH.reduce((a, f) => a + f.w, 0);
  for (const f of FISH) if ((r -= f.w) < 0) return f;
  return FISH[0];
}
function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function write(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

const FishIcon = ({ className }) => (
  <svg viewBox="0 0 64 32" className={className} aria-hidden="true" focusable="false">
    <path d="M2 16c8-10 22-14 36-8 5 2 9 5 12 8l12-9v18l-12-9c-3 3-7 6-12 8-14 6-28 2-36-8z" fill="currentColor" />
    <circle cx="14" cy="13" r="2.4" fill="#0b0b0b" />
  </svg>
);

// Gauge mini statis untuk ilustrasi tutorial
function Demo({ kind }) {
  const pos = kind === "hold" ? 30 : 52;
  return (
    <div className={`fish-demo is-${kind}`} aria-hidden="true">
      {kind === "bite" ? (
        <div className="fish-demo-bite">
          <span className="fish-bob is-bite" style={{ position: "relative", left: 0, top: 0, margin: 0 }}>
            <i />
            <i />
          </span>
          <b>!</b>
        </div>
      ) : (
        <div className="fish-gauge" style={{ position: "relative", left: 0, right: 0, bottom: 0 }}>
          <span className="fish-cap">3</span>
          <div className="fish-track">
            <span className="fish-zone" style={{ left: "30%", width: "40%" }} />
            <span className={`fish-marker ${kind === "hold" ? "fish-demo-drift" : "is-hot"}`} style={{ left: `${pos}%` }}>
              {kind === "pull" && <b>Pull!!</b>}
            </span>
          </div>
          <span className="fish-cap">3</span>
        </div>
      )}
    </div>
  );
}

export default function FishingGame() {
  const [phase, setPhase] = useState("idle"); // idle | waiting | bite | fight | attack | caught | lost
  const [line, setLine] = useState(LINE);
  const [fish, setFish] = useState(FISH[0]);
  const [result, setResult] = useState(null); // { name, size, record }
  const [best, setBest] = useState(0);
  const [dex, setDex] = useState({}); // { id: ukuran terbesar }
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("Lempar kail untuk mulai.");
  const [hint, setHint] = useState("idle");
  const [hurt, setHurt] = useState(0);
  const [combo, setCombo] = useState(0);
  const [splash, setSplash] = useState(0);
  const [lines, setLines] = useState([]);
  const [tut, setTut] = useState(-1); // -1 = tertutup, 0..2 = langkah

  const S = useRef({ pos: 0.5, force: 0, next: 0, input: 0, prog: 0, line: LINE, guard: 0, fish: FISH[0], combo: 0, hint: "", outUntil: 0 });
  const markerRef = useRef(null);
  const bobRef = useRef(null);
  const shadowRef = useRef(null);
  const lineRef = useRef(null);
  const progRef = useRef(null);
  const pullRef = useRef(null);
  const gaugeRef = useRef(null);
  const pondRef = useRef(null);
  // ujung joran dalam koordinat adegan (viewBox 0..100): mengikuti ukuran kolam
  const rodTip = () => {
    const el = pondRef.current;
    return el ? [(46.3 * el.clientHeight) / el.clientWidth, 39.6] : [13, 39.6];
  };
  const timer = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    setBest(Number(read(KEY, 0)) || 0);
    setDex(read(DEX, {}) || {});
    if (!read(TUT, 0)) setTut(0);
    return () => clearTimeout(timer.current);
  }, []);

  const say = (k) => {
    if (S.current.hint === k) return;
    S.current.hint = k;
    setHint(k);
  };
  function closeTut() {
    setTut(-1);
    write(TUT, 1);
    playSfx("click");
  }

  function cast() {
    clearTimeout(timer.current);
    setResult(null);
    setLine(LINE);
    setCombo(0);
    setMsg("Menunggu ikan menyambar…");
    setPhase("waiting");
    say("waiting");
    playSfx("open");
    timer.current = setTimeout(() => {
      setPhase("bite");
      say("bite");
      setMsg("Ada yang menyambar! Tekan PULL!!");
      playSfx("perfect");
      timer.current = setTimeout(() => {
        if (phaseRef.current !== "bite") return;
        setPhase("lost");
        say("lost");
        setMsg("Terlambat… ikannya kabur.");
        playSfx("miss");
      }, 1600);
    }, 1200 + Math.random() * 2200);
  }

  function hook() {
    clearTimeout(timer.current);
    let f = pickFish();
    // tangkapan pertama = latihan: selalu ikan termudah
    if (!Object.keys(dex).length && count === 0) f = FISH[0];
    S.current = { ...S.current, pos: 0.5, force: 0, next: 0, input: 0, prog: 0.12, line: LINE, guard: 0, fish: f, combo: 0, target: 0, outUntil: 0 };
    setFish(f);
    setLine(LINE);
    setCombo(0);
    setMsg("Tahan ◀ ▶ agar penanda di zona merah, lalu PULL!!");
    setPhase("fight");
    playSfx("hit");
  }

  function damage(now, text, key) {
    const s = S.current;
    if (now < s.guard) return;
    s.guard = now + 550;
    s.line -= 1;
    s.combo = 0;
    setCombo(0);
    setLine(s.line);
    setHurt((n) => n + 1);
    playSfx("miss");
    if (s.line <= 0) {
      setPhase("lost");
      say("lost");
      setMsg("Tali putus… ikannya lepas.");
    } else {
      setMsg(text);
      s.outUntil = now + 900;
      say(key);
    }
  }

  function win() {
    const f = S.current.fish;
    const size = Math.round(f.min + Math.random() * (f.max - f.min));
    const record = size > best;
    if (record) {
      setBest(size);
      write(KEY, size);
    }
    const nd = { ...dex, [f.id]: Math.max(dex[f.id] ?? 0, size) };
    setDex(nd);
    write(DEX, nd);
    setCount((c) => c + 1);
    setResult({ name: f.name, size, record, fresh: !(f.id in dex) });
    setLines([f.name, `${size} cm`]);
    setMsg(`Dapat ${f.name}, ${size} cm!`);
    setPhase("attack");
  }

  function pull() {
    const p = phaseRef.current;
    if (p === "bite") return hook();
    if (p !== "fight") return;
    const s = S.current;
    const z = s.fish.zone;
    if (Math.abs(s.pos - 0.5) <= z / 2) {
      s.combo += 1;
      s.prog = Math.min(1, s.prog + s.fish.step * (s.combo >= 5 ? 1.25 : 1));
      setCombo(s.combo);
      setSplash((n) => n + 1);
      playSfx("click");
      if (s.prog >= 1) win();
    } else damage(performance.now(), "Jangan menggulung di luar zona merah!", "out");
  }

  // Space / Enter = PULL di mana pun fokusnya selama permainan berjalan (tanpa menggulir halaman).
  const pullFn = useRef(null);
  useEffect(() => {
    if (phase !== "waiting" && phase !== "bite" && phase !== "fight") return;
    const onKey = (e) => {
      if (e.key !== " " && e.key !== "Enter") return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (tag === "BUTTON" || tag === "A") {
        if (e.target === pullRef.current) return; // klik bawaan tombol sudah menangani
        if (e.target.closest?.(".fish") == null) return;
      }
      e.preventDefault();
      if (!e.repeat) pullFn.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);
  useEffect(() => {
    if (phase === "bite") pullRef.current?.focus({ preventScroll: true });
    if (lineRef.current) {
      const [x, y] = rodTip();
      lineRef.current.setAttribute("x1", x);
      lineRef.current.setAttribute("y1", y);
    }
  }, [phase]);

  // Loop pertarungan: posisi ditulis langsung ke DOM (tanpa re-render per frame).
  useEffect(() => {
    if (phase !== "fight") return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = S.current;
      if (now >= s.next) {
        // ikan ganti arah; cenderung menjauh dari tengah supaya terasa "melawan"
        const away = s.pos >= 0.5 ? 1 : -1;
        const dir = Math.random() < 0.62 ? away : -away;
        s.target = dir * s.fish.pull * (0.55 + Math.random() * 0.75);
        s.next = now + 380 + Math.random() * 800;
      }
      s.force += ((s.target ?? 0) - s.force) * Math.min(1, dt * 5);
      s.pos += (s.force + s.input * PLAYER) * dt;
      if (s.pos <= 0.015 || s.pos >= 0.985) {
        const left = s.pos < 0.5;
        s.pos = left ? 0.16 : 0.84;
        s.force = 0;
        s.next = now + 350;
        s.target = 0;
        damage(now, "Penanda membentur ujung gauge!", "edge");
      }
      s.prog = Math.max(0, s.prog - 0.03 * dt);

      const z = s.fish.zone;
      const off = s.pos - 0.5;
      const inZone = Math.abs(off) <= z / 2;
      const bx = 22 + s.pos * 60;
      const by = 20 + s.prog * 46;
      if (markerRef.current) {
        markerRef.current.style.left = `${s.pos * 100}%`;
        markerRef.current.classList.toggle("is-hot", inZone);
      }
      if (gaugeRef.current) gaugeRef.current.dataset.push = inZone ? "" : off < 0 ? "right" : "left";
      if (bobRef.current) {
        bobRef.current.style.left = `${bx}%`;
        bobRef.current.style.top = `${by}%`;
      }
      if (shadowRef.current) {
        shadowRef.current.style.left = `${bx + s.force * 14 + Math.sin(now / 130) * 1.2}%`;
        shadowRef.current.style.top = `${by + 5}%`;
        shadowRef.current.style.transform = `translate(-50%,-50%) scaleX(${s.force < 0 ? 1 : -1}) rotate(${Math.sin(now / 90) * 8}deg)`;
      }
      if (lineRef.current) {
        lineRef.current.setAttribute("x1", rodTip()[0]);
        lineRef.current.setAttribute("x2", bx);
        lineRef.current.setAttribute("y2", by);
      }
      if (progRef.current) progRef.current.style.transform = `scaleX(${s.prog})`;
      if (now > s.outUntil) say(inZone ? "in" : Math.abs(off) > 0.4 ? "edge" : off < 0 ? "left" : "right");
      if (phaseRef.current === "fight") raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const dirOf = (e) => (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" ? -1 : e.key === "ArrowRight" || e.key === "d" || e.key === "D" ? 1 : 0);
    const down = (e) => {
      const d = dirOf(e);
      if (!d) return;
      e.preventDefault();
      S.current.input = d;
    };
    const up = (e) => {
      const d = dirOf(e);
      if (d && S.current.input === d) S.current.input = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      S.current.input = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const hold = (d) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      S.current.input = d;
    },
    onPointerUp: () => (S.current.input = 0),
    onPointerCancel: () => (S.current.input = 0),
    onContextMenu: (e) => e.preventDefault(),
  });

  pullFn.current = pull;
  const fighting = phase === "fight";
  const live = phase === "waiting" || phase === "bite" || fighting;
  const zone = fish.zone;
  const btn = "-skew-x-12 select-none px-5 py-3 text-base font-black uppercase italic tracking-tighter transition-colors duration-100";
  const caughtN = Object.keys(dex).length;

  return (
    <div className="fish relative">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-black uppercase italic tracking-tighter">
        <span>Tangkapan {count}</span>
        <span>
          Tali{" "}
          <span aria-label={`${line} dari ${LINE}`}>
            {Array.from({ length: LINE }, (_, i) => (
              <span key={i} aria-hidden="true" className={`ml-1 inline-block h-3 w-4 -skew-x-12 border-2 border-current ${i < line ? "bg-red" : ""}`} />
            ))}
          </span>
        </span>
        <span>Rekor {best ? `${best} cm` : "—"}</span>
        <button
          type="button"
          onClick={() => {
            setTut(0);
            playSfx("open");
          }}
          disabled={live}
          aria-label="Buka tutorial mancing"
          className="-skew-x-12 border-2 border-fg px-2.5 py-0.5 transition-colors duration-100 hover:bg-fg hover:text-bg disabled:opacity-30"
        >
          <span className="inline-block skew-x-12">? Cara main</span>
        </button>
      </div>

      {/* kolam */}
      <div ref={pondRef} className={`fish-pond relative mt-4 overflow-hidden border-[3px] border-fg ${tut >= 0 ? "h-[23rem]" : "h-64 sm:h-80"} ${fighting ? "is-fight" : ""}`}>
        {hurt > 0 && fighting && <span key={hurt} aria-hidden="true" className="flash-red pointer-events-none absolute inset-0 z-[4] bg-[#dc0000]" />}
        <span aria-hidden="true" className="fish-date">
          <b>Kolam</b> Pemancingan
        </span>

        {/* pemancing + joran + tali */}
        <svg className="fish-scene" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {live && <line ref={lineRef} x1="13" y1="38" x2="52" y2="26" stroke="#f5f5f5" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />}
        </svg>
        <svg className="fish-angler" viewBox="0 0 120 150" aria-hidden="true" focusable="false">
          <path d="M0 132h78l8 18H0z" fill="#070707" />
          <path d="M14 132c-2-22 4-40 20-44l16 2c10 6 12 22 10 42z" fill="#0b0b0b" />
          <circle cx="42" cy="72" r="13" fill="#0b0b0b" />
          <path d="M30 66c2-12 22-14 26-2-8-4-18-3-26 2z" fill="#dc0000" />
          <path d="M52 100l22-14 3 5-20 17z" fill="#0b0b0b" />
          <path className={live ? "fish-rod is-live" : "fish-rod"} d="M70 92L112 4" stroke="#f5f5f5" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </svg>

        {fighting && (
          <span ref={shadowRef} aria-hidden="true" className="fish-shadow" style={{ left: "52%", top: "30%" }}>
            <FishIcon className="h-full w-full" />
          </span>
        )}
        {live && (
          <span ref={bobRef} aria-hidden="true" className={`fish-bob ${phase === "bite" ? "is-bite" : ""} ${fighting ? "is-fight" : ""}`} style={{ left: "52%", top: "26%" }}>
            <i />
            <i />
            {fighting && splash > 0 && (
              <span key={splash} className="fish-splash">
                <u />
                <u />
                <u />
                <u />
                <u />
              </span>
            )}
          </span>
        )}
        {phase === "bite" && (
          <span aria-hidden="true" className="fish-alert">
            !
          </span>
        )}
        {fighting && combo >= 2 && (
          <span key={combo} aria-hidden="true" className="fish-combo">
            <small>Combo</small> x{combo}
          </span>
        )}

        {phase === "idle" && (
          <p className="absolute inset-0 z-[2] grid place-items-center px-6 text-center text-sm font-black uppercase italic tracking-tighter text-[#f5f5f5]">
            <span className="-skew-x-12 bg-[#0a0a0a] px-4 py-2">
              <span className="inline-block skew-x-12">Lempar kail, tunggu tanda “!”, lalu tarik.</span>
            </span>
          </p>
        )}
        {phase === "lost" && (
          <p className="absolute inset-0 z-[2] grid place-items-center">
            <span className="pop -skew-x-12 bg-[#0a0a0a] px-4 py-2 font-display text-2xl font-black uppercase italic tracking-tighter text-[#f5f5f5] sm:text-4xl">
              Lepas…
            </span>
          </p>
        )}
        {phase === "caught" && result && (
          <div className="absolute inset-0 z-[2] grid place-items-center">
            <div className="fish-result pop text-center">
              <FishIcon className="fish-trophy" />
              <p className="fish-size">
                <small>Size</small>
                <strong>{result.size}</strong>
                <small>cm</small>
                {(result.record || result.fresh) && <em>{result.fresh ? "Baru!" : "Rekor!"}</em>}
              </p>
              <p className="mt-3 inline-block -skew-x-12 bg-[#0a0a0a] px-4 py-1.5 text-sm font-black uppercase italic tracking-tighter text-[#f5f5f5] sm:text-base">
                <span className="inline-block skew-x-12">
                  Dapat <span className="text-[#ff2a1a]">{result.name}</span>!
                </span>
              </p>
            </div>
          </div>
        )}

        {/* gauge */}
        {(fighting || phase === "bite") && (
          <div ref={gaugeRef} className="fish-gauge" role="img" aria-label="Gauge mancing. Jaga penanda tetap di zona merah lalu tekan Pull.">
            <span className="fish-cap">{line}</span>
            <div className="fish-track">
              <span className="fish-zone" style={{ left: `${(0.5 - zone / 2) * 100}%`, width: `${zone * 100}%` }} />
              <span className="fish-push is-l" aria-hidden="true">▶▶</span>
              <span className="fish-push is-r" aria-hidden="true">◀◀</span>
              <span ref={markerRef} className="fish-marker is-hot" style={{ left: "50%" }}>
                <b>Pull!!</b>
              </span>
            </div>
            <span className="fish-cap">{line}</span>
          </div>
        )}

        {/* pemandu */}
        {live && tut < 0 && (
          <p key={hint} className={`fish-guide ${hint === "in" || hint === "bite" ? "is-go" : ""} ${hint === "edge" || hint === "out" ? "is-warn" : ""}`}>
            <span className="fish-guide-tag" aria-hidden="true">Pemandu</span>
            <span>{HINT[hint]}</span>
          </p>
        )}

        {/* tutorial */}
        {tut >= 0 && (
          <div className="fish-tut" role="dialog" aria-modal="false" aria-label={`Tutorial mancing, langkah ${tut + 1} dari ${STEPS.length}`}>
            <div className="fish-tut-card">
              <p className="fish-tut-title" aria-hidden="true">
                <span>T</span>
                <span>u</span>
                <span>t</span>
                <span>o</span>
                <span>r</span>
                <span>i</span>
                <span>a</span>
                <span>l</span>
              </p>
              <p className="fish-tut-step">
                <b>
                  {tut + 1}/{STEPS.length}
                </b>
                {STEPS[tut].t}
              </p>
              <Demo kind={STEPS[tut].demo} />
              <p className="fish-tut-body">{STEPS[tut].d}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={closeTut} className="text-xs font-black uppercase italic tracking-tighter underline">
                  Lewati
                </button>
                <span className="flex gap-2">
                  {tut > 0 && (
                    <button type="button" onClick={() => setTut(tut - 1)} className="-skew-x-12 border-2 border-[#f5f5f5] px-3 py-1.5 text-xs font-black uppercase italic tracking-tighter">
                      <span className="inline-block skew-x-12">◀ Balik</span>
                    </button>
                  )}
                  <button
                    type="button"
                    autoFocus
                    onClick={() => (tut + 1 < STEPS.length ? (setTut(tut + 1), playSfx("click")) : closeTut())}
                    className="-skew-x-12 bg-[#dc0000] px-4 py-1.5 text-xs font-black uppercase italic tracking-tighter text-[#f5f5f5]"
                  >
                    <span className="inline-block skew-x-12">{tut + 1 < STEPS.length ? "Lanjut ▶" : "Paham, mulai!"}</span>
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* seberapa dekat ikan ke darat */}
      <div className="mt-2 flex items-center gap-2 text-[0.65rem] font-black uppercase italic tracking-tighter text-mu">
        <span>Gulung</span>
        <span className="relative h-3 flex-1 -skew-x-12 overflow-hidden border-2 border-fg">
          <span ref={progRef} className="absolute inset-0 origin-left bg-red" style={{ transform: `scaleX(${phase === "caught" ? 1 : 0})` }} />
        </span>
        <span>Darat</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!live && phase !== "attack" && (
          <button type="button" onClick={cast} disabled={tut >= 0} className={`${btn} bg-red text-[#f5f5f5] hover:bg-fg hover:text-bg disabled:opacity-40`}>
            <span className="inline-block skew-x-12">{phase === "idle" ? "Lempar kail" : "Lempar lagi"}</span>
          </button>
        )}
        {live && (
          <>
            <button type="button" aria-label="Geser penanda ke kiri (tahan)" disabled={!fighting} {...hold(-1)} className={`${btn} touch-none border-[3px] border-fg hover:bg-fg hover:text-bg disabled:opacity-30`}>
              <span className="inline-block skew-x-12">◀</span>
            </button>
            <button
              ref={pullRef}
              type="button"
              onClick={pull}
              disabled={phase === "waiting"}
              aria-label="Pull! (Space atau Enter)"
              className={`${btn} min-w-36 touch-manipulation bg-red text-[#f5f5f5] hover:bg-fg hover:text-bg disabled:opacity-40`}
            >
              <span className="inline-block skew-x-12">{phase === "waiting" ? "Tunggu…" : "Pull!!"}</span>
            </button>
            <button type="button" aria-label="Geser penanda ke kanan (tahan)" disabled={!fighting} {...hold(1)} className={`${btn} touch-none border-[3px] border-fg hover:bg-fg hover:text-bg disabled:opacity-30`}>
              <span className="inline-block skew-x-12">▶</span>
            </button>
          </>
        )}
        <p className="text-xs font-bold text-mu">
          <kbd className="border-2 border-current px-1">←</kbd> <kbd className="border-2 border-current px-1">→</kbd> tahan penanda ·{" "}
          <kbd className="border-2 border-current px-1">Space</kbd> gulung
        </p>
      </div>

      {/* koleksi */}
      <div className="mt-5">
        <p className="text-xs font-black uppercase italic tracking-tighter text-rt">
          Koleksi ikan {caughtN}/{FISH.length}
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FISH.map((f) => {
            const got = f.id in dex;
            return (
              <li key={f.id} className={`fish-dex ${got ? "is-got" : ""}`}>
                <FishIcon className="fish-dex-ico" />
                <span className="block text-xs font-black uppercase italic leading-tight tracking-tighter">{got ? f.name : "???"}</span>
                <span className="block text-[0.65rem] font-bold text-mu">
                  {"★".repeat(f.stars)} {got ? `· ${dex[f.id]} cm` : "· belum tertangkap"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {msg}
      </p>

      {phase === "attack" && (
        <AllOutAttack
          title="All-Out Attack"
          lines={lines}
          onDone={() => {
            setPhase("caught");
            say("caught");
            playSfx("rankup");
          }}
        />
      )}
    </div>
  );
}
