// SFX kecil lewat Web Audio API (oscillator) — tanpa file audio, tanpa library.
// Bisa dimatikan dari panel Jukebox (tombol SFX). Hanya dipanggil setelah interaksi user.
const KEY = "p5:sfx";
let ctx = null;

export function isSfxOn() {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}
export function setSfxOn(on) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {}
}

function ac() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  if (!ctx) ctx = new C();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(c, { f, to, t = 0, d = 0.1, type = "square", v = 0.05 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + t;
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + d + 0.02);
}

const SOUNDS = {
  click: (c) => tone(c, { f: 900, to: 450, d: 0.05, v: 0.03 }),
  flip: (c) => tone(c, { f: 300, to: 700, d: 0.12, type: "sawtooth", v: 0.03 }),
  open: (c) => {
    tone(c, { f: 440, d: 0.07 });
    tone(c, { f: 660, t: 0.07, d: 0.1 });
  },
  rankup: (c) => {
    tone(c, { f: 523, d: 0.09 });
    tone(c, { f: 659, t: 0.08, d: 0.09 });
    tone(c, { f: 784, t: 0.16, d: 0.18 });
  },
  hit: (c) => tone(c, { f: 220, to: 110, d: 0.12, type: "sawtooth", v: 0.07 }),
  perfect: (c) => {
    tone(c, { f: 392, d: 0.08 });
    tone(c, { f: 523, t: 0.07, d: 0.08 });
    tone(c, { f: 784, t: 0.14, d: 0.08 });
    tone(c, { f: 1046, t: 0.21, d: 0.25, type: "triangle", v: 0.07 });
  },
  miss: (c) => tone(c, { f: 160, to: 70, d: 0.25, type: "triangle", v: 0.06 }),
  secret: (c) => {
    [0, 0.1, 0.2, 0.3].forEach((t, i) => tone(c, { f: 880 - i * 160, t, d: 0.12, type: "sawtooth", v: 0.05 }));
  },
};

export function playSfx(name) {
  if (!isSfxOn()) return;
  try {
    const c = ac();
    if (c) SOUNDS[name]?.(c);
  } catch {}
}
