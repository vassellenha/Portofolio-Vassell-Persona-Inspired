// SFX: satu sample "Select" (public/sfx/select.mp3), diputar lewat Web Audio API.
// Nada divariasikan lewat playbackRate supaya tiap aksi terasa beda tanpa file tambahan.
// Tanpa library. Bisa dimatikan dari panel Jukebox (tombol SFX). Hanya aktif setelah interaksi user.
const KEY = "p5:sfx";
const SRC = "/sfx/select.mp3";
const GAIN = 1; // file sudah dinormalisasi (peak ~ -1 dB), jangan > 1 supaya tidak pecah

const RATE = {
  click: 1,
  flip: 1.1,
  open: 1,
  rankup: 1.18,
  hit: 0.9,
  perfect: 1.3,
  miss: 0.72,
  secret: 0.62,
};

let ctx = null;
let master = null;
let buf = null;
let loading = false;
let last = null;
let pending = null; // { name, at } : bunyi yang diminta saat buffer masih dimuat

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
  if (!ctx) {
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = GAIN;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function fire(c, name) {
  try {
    last?.stop();
  } catch {}
  const s = c.createBufferSource();
  s.buffer = buf;
  s.playbackRate.value = RATE[name] ?? 1;
  s.connect(master);
  s.start();
  last = s;
}

function load(c) {
  if (buf || loading) return;
  loading = true;
  fetch(SRC)
    .then((r) => r.arrayBuffer())
    .then((d) => c.decodeAudioData(d))
    .then((b) => {
      buf = b;
      if (pending && performance.now() - pending.at < 800 && isSfxOn()) fire(c, pending.name);
      pending = null;
    })
    .catch(() => {
      loading = false;
      pending = null;
    });
}

// Muat sample di interaksi pertama supaya klik berikutnya langsung berbunyi.
export function warmSfx() {
  try {
    const c = ac();
    if (c) load(c);
  } catch {}
}

if (typeof window !== "undefined") {
  const w = () => warmSfx();
  window.addEventListener("pointerdown", w, { once: true, passive: true });
  window.addEventListener("keydown", w, { once: true });
}

export function playSfx(name) {
  if (!isSfxOn()) return;
  try {
    const c = ac();
    if (!c) return;
    if (!buf) {
      pending = { name, at: performance.now() };
      load(c);
      return;
    }
    fire(c, name);
  } catch {}
}
