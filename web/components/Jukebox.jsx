"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MusicButton, PanelButton } from "./MusicButton";
import { isSfxOn, setSfxOn, playSfx } from "../lib/sfx";
import { IconClose, IconNext, IconPause, IconPlay, IconPrev, IconShuffle } from "./Icons";

const KEY = "p5:jukebox";

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function writePrefs(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

// Fisher-Yates. `avoidFirst`: indeks yang tidak boleh jadi elemen pertama (cegah lagu sama berurutan).
function shuffled(n, avoidFirst = -1) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (n > 1 && a[0] === avoidFirst) {
    const j = 1 + Math.floor(Math.random() * (n - 1));
    [a[0], a[j]] = [a[j], a[0]];
  }
  return a;
}

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
const toSeconds = (d) => {
  if (typeof d === "number") return d;
  const m = /^(\d+):(\d{1,2})$/.exec(String(d ?? ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

const CTRL =
  "grid h-11 w-11 -skew-x-12 place-items-center border-[3px] border-[#f5f5f5] bg-[#0f0f0f] text-[#f5f5f5] transition-colors duration-100 hover:bg-[#f5f5f5] hover:text-[#0f0f0f]";

export default function Jukebox({ tracks, autoStart = false, initialOpen = false }) {
  const n = tracks.length;
  const audioRef = useRef(null);
  const queue = useRef({ order: [], pos: 0 });
  const want = useRef(autoStart && n > 0); // play otomatis setelah klik user di placeholder
  const api = useRef({});

  const [init] = useState(readPrefs);
  const [current, setCurrent] = useState(() => Math.max(0, tracks.findIndex((t) => t.file === init.track)));
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(initialOpen || n === 0);
  const [shuffleOn, setShuffleOn] = useState(!!init.shuffle);
  const [volume, setVolume] = useState(typeof init.vol === "number" ? init.vol : 0.8);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [failed, setFailed] = useState([]);
  const [sfx, setSfx] = useState(isSfxOn);

  const track = tracks[current];
  const empty = n === 0 || failed.length >= n;

  // ---- antrian (urutan putar) ----
  function build(start, sh) {
    queue.current = sh
      ? { order: [start, ...shuffled(n).filter((i) => i !== start)], pos: 0 }
      : { order: Array.from({ length: n }, (_, i) => i), pos: start };
  }
  function advance(dir, bad = failed) {
    if (!queue.current.order.length) build(current, shuffleOn);
    const q = queue.current;
    const len = q.order.length;
    for (let k = 0; k < len; k++) {
      let p = q.pos + dir;
      if (p >= len) {
        p = 0;
        if (shuffleOn) q.order = shuffled(len, q.order[len - 1]); // putaran baru, tanpa ulang lagu terakhir
      } else if (p < 0) p = len - 1;
      q.pos = p;
      if (!bad.includes(q.order[p])) return q.order[p];
    }
    return -1;
  }
  function go(idx) {
    if (idx < 0) return;
    want.current = true;
    setTime(0);
    setDur(0);
    if (idx === current) {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    } else setCurrent(idx);
  }

  // ---- aksi ----
  function toggle(force) {
    const a = audioRef.current;
    if (!a || empty) return setOpen(true);
    const shouldPlay = force ?? a.paused;
    if (shouldPlay) {
      want.current = true;
      a.play().catch(() => setPlaying(false));
    } else {
      want.current = false;
      a.pause();
    }
  }
  const next = () => go(advance(1));
  const prev = () => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) a.currentTime = 0;
    else go(advance(-1));
  };
  function pick(i) {
    build(i, shuffleOn);
    go(i);
  }
  function toggleShuffle() {
    const sh = !shuffleOn;
    setShuffleOn(sh);
    build(current, sh);
  }
  function onError() {
    // File rusak / hilang: tandai, lompat ke lagu berikutnya yang bisa diputar.
    const nf = failed.includes(current) ? failed : [...failed, current];
    setFailed(nf);
    const idx = advance(1, nf);
    if (idx < 0 || idx === current) {
      want.current = false;
      setPlaying(false);
    } else go(idx);
  }

  // Handler terbaru untuk Media Session (dipanggil dari luar render)
  useEffect(() => {
    api.current = { toggle, next, prev };
  });

  // Putar saat lagu berganti (src sudah ter-commit oleh React)
  useEffect(() => {
    const a = audioRef.current;
    if (a && want.current) a.play().catch(() => setPlaying(false));
  }, [current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, n]);

  useEffect(() => {
    writePrefs({ vol: volume, shuffle: shuffleOn, track: track?.file, on: playing });
  }, [volume, shuffleOn, track, playing]);

  // Media Session: judul/artis di lock screen + tombol hardware
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: "Original OST",
      artwork: track.cover ? [{ src: track.cover }] : [],
    });
    const set = (action, fn) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {}
    };
    set("play", () => api.current.toggle(true));
    set("pause", () => api.current.toggle(false));
    set("previoustrack", () => api.current.prev());
    set("nexttrack", () => api.current.next());
    return () => ["play", "pause", "previoustrack", "nexttrack"].forEach((a) => set(a, null));
  }, [track]);
  useEffect(() => {
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  // Esc menutup panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const total = dur || toSeconds(track?.duration);
  const pct = total ? Math.min(100, (time / total) * 100) : 0;

  return (
    <>
      {n > 0 && (
        <audio
          ref={audioRef}
          src={track?.file}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={next}
          onError={onError}
          onTimeUpdate={(e) => open && setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        />
      )}

      <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
        <PanelButton open={open} onClick={() => setOpen((o) => !o)} />
        <MusicButton playing={playing} armed={!!init.on} onClick={() => toggle()} />
      </div>

      {open && (
        <section id="jukebox-panel" aria-label="Jukebox" className="jb fixed bottom-24 right-3 z-50 w-[min(94vw,26rem)]">
          {/* Judul gaya potongan majalah, menempel di tepi atas panel */}
          <h2
            aria-label="Jukebox"
            className="absolute -left-3 -top-7 z-10 flex items-end font-display font-black uppercase italic leading-none tracking-tighter"
          >
            <span aria-hidden="true" className="-rotate-3 -skew-x-12 bg-[#f5f5f5] px-3 py-1 text-3xl text-[#0f0f0f] shadow-[3px_3px_0_#dc0000]">
              Juke
            </span>
            <span aria-hidden="true" className="-ml-1 rotate-2 -skew-x-12 bg-[#0f0f0f] px-3 py-1 text-3xl text-[#f5f5f5] shadow-[3px_3px_0_#dc0000]">
              Box
            </span>
            <span aria-hidden="true" className="-ml-1 -rotate-1 -skew-x-12 bg-[#f5f5f5] px-2 py-0.5 font-sans text-[11px] font-black text-[#0f0f0f] shadow-[2px_2px_0_#dc0000]">
              BGM
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup Jukebox"
            className="absolute -right-2 -top-5 z-10 grid h-10 w-10 -skew-x-12 place-items-center border-[3px] border-[#f5f5f5] bg-[#0f0f0f] text-[#f5f5f5] transition-colors duration-100 hover:bg-[#f5f5f5] hover:text-[#0f0f0f]"
          >
            <span className="skew-x-12">
              <IconClose />
            </span>
          </button>

          <div className="jb-body max-h-[calc(100svh-8rem)] overflow-y-auto px-6 pb-8 pt-9">
            {empty ? (
              <div className="py-4">
                <p className="inline-block -skew-x-12 bg-[#0f0f0f] px-3 py-1 font-display text-2xl font-black uppercase italic tracking-tighter">
                  <span className="inline-block skew-x-12">No tracks yet</span>
                </p>
                <p className="mt-3 text-sm font-bold">
                  Taruh file .mp3 di <b>web/public/music</b> lalu daftarkan di <b>playlist.json</b>.
                </p>
              </div>
            ) : (
              <>
                <span className="inline-block -skew-x-12 bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-black uppercase italic tracking-tighter text-[#0f0f0f]">
                  <span className="inline-block skew-x-12">{playing ? "Now playing" : "Paused"}</span>
                </span>
                <div className="mt-2 flex items-center gap-3">
                  {track.cover && (
                    <Image
                      src={track.cover}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 shrink-0 border-[3px] border-[#f5f5f5] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 -skew-x-12 bg-[#0f0f0f] px-4 py-2 shadow-[5px_5px_0_#f5f5f5]">
                    <p className="skew-x-12 truncate font-display text-xl font-black uppercase italic leading-tight tracking-tighter text-[#f5f5f5]">
                      {track.title}
                    </p>
                    {track.artist && (
                      <p className="skew-x-12 truncate text-xs font-bold uppercase tracking-tight text-[#f5f5f5]/80">
                        {track.artist}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="range"
                    className="p5-range"
                    aria-label="Posisi lagu"
                    min={0}
                    max={Math.max(1, Math.floor(dur))}
                    step={1}
                    value={Math.min(Math.floor(time), Math.max(1, Math.floor(dur)))}
                    disabled={!dur}
                    style={{ "--p": `${pct}%` }}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (audioRef.current) audioRef.current.currentTime = v;
                      setTime(v);
                    }}
                  />
                  <div className="flex justify-between text-xs font-black italic tabular-nums">
                    <span>{fmt(time)}</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button type="button" onClick={prev} aria-label="Lagu sebelumnya" className={CTRL}>
                    <span className="skew-x-12">
                      <IconPrev />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle()}
                    aria-label={playing ? "Jeda" : "Putar"}
                    className={`${CTRL} !h-12 !w-16 !border-[#0f0f0f] !bg-[#f5f5f5] !text-[#0f0f0f] hover:!border-[#f5f5f5] hover:!bg-[#0f0f0f] hover:!text-[#f5f5f5]`}
                  >
                    <span className="skew-x-12">{playing ? <IconPause /> : <IconPlay />}</span>
                  </button>
                  <button type="button" onClick={next} aria-label="Lagu berikutnya" className={CTRL}>
                    <span className="skew-x-12">
                      <IconNext />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleShuffle}
                    aria-label="Acak urutan lagu"
                    aria-pressed={shuffleOn}
                    className={`${CTRL} ${shuffleOn ? "!bg-[#f5f5f5] !text-[#0f0f0f]" : ""}`}
                  >
                    <span className="skew-x-12">
                      <IconShuffle />
                    </span>
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <label className="flex min-w-0 flex-1 items-center gap-3 text-xs font-black uppercase italic tracking-tighter">
                    Vol
                    <input
                      type="range"
                      className="p5-range"
                      aria-label="Volume"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      style={{ "--p": `${volume * 100}%` }}
                      onChange={(e) => setVolume(Number(e.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    aria-pressed={sfx}
                    aria-label="Efek suara (SFX)"
                    onClick={() => {
                      const v = !sfx;
                      setSfx(v);
                      setSfxOn(v);
                      if (v) playSfx("click");
                    }}
                    className={`shrink-0 -skew-x-12 border-[3px] border-[#f5f5f5] px-3 py-1 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-[#f5f5f5] hover:text-[#0f0f0f] ${
                      sfx ? "bg-[#f5f5f5] text-[#0f0f0f]" : "bg-[#0f0f0f] text-[#f5f5f5]"
                    }`}
                  >
                    <span className="inline-block skew-x-12">SFX {sfx ? "ON" : "OFF"}</span>
                  </button>
                </div>

                {/* Daftar lagu: baris miring bertingkat seperti menu BGM */}
                <ol className="mt-5 max-h-48 space-y-1.5 overflow-y-auto py-1 pr-2">
                  {tracks.map((t, i) => {
                    const active = i === current;
                    const bad = failed.includes(i);
                    return (
                      <li key={t.file} style={{ marginLeft: `${(i % 4) * 8}px` }}>
                        <button
                          type="button"
                          disabled={bad}
                          onClick={() => pick(i)}
                          aria-current={active ? "true" : undefined}
                          className={`flex w-full -skew-x-12 items-center gap-3 px-3 py-2 text-left text-sm font-black uppercase italic tracking-tighter transition-[background-color,color,transform] duration-100 ${
                            active
                              ? "translate-x-2 bg-[#0f0f0f] text-[#f5f5f5] shadow-[4px_4px_0_#f5f5f5]"
                              : "text-[#f5f5f5] hover:translate-x-1 hover:bg-[#f5f5f5] hover:text-[#0f0f0f]"
                          } ${bad ? "line-through opacity-50" : ""}`}
                        >
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] tabular-nums ${
                              active ? "bg-[#dc0000] text-[#f5f5f5]" : "bg-[#f5f5f5] text-[#0f0f0f]"
                            }`}
                          >
                            <span className="skew-x-12">{i + 1}</span>
                          </span>
                          <span className="min-w-0 flex-1 skew-x-12 truncate">{t.title}</span>
                          <span className="shrink-0 skew-x-12 text-xs tabular-nums">{t.duration}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
