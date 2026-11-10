"use client";
// Calling Card Generator: render <canvas> native -> unduh PNG / share (Web Share API bila tersedia).
import { useEffect, useRef, useState } from "react";
import { playSfx } from "../../lib/sfx";

const W = 1000;
const H = 560;
const SKEW = Math.tan((12 * Math.PI) / 180);
const FONT = (size) => `italic 900 ${size}px "Arial Black", Impact, Arial, sans-serif`;

function poly(ctx, pts, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

// Potongan teks majalah: kotak miring + teks italic tegak. Mengembalikan tinggi kotak.
function slash(ctx, text, x, y, size, bg, fg, rot = 0) {
  ctx.font = FONT(size);
  const pad = size * 0.35;
  const w = ctx.measureText(text).width + pad * 2;
  const h = size * 1.3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.save();
  ctx.transform(1, 0, -SKEW, 1, 0, 0);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, h / 2 + 2);
  ctx.restore();
  return h;
}

function wrap(ctx, text, maxW, size) {
  ctx.font = FONT(size);
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function draw(canvas, name, msg) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, W, H);
  poly(ctx, [[W * 0.42, 0], [W, 0], [W, H * 0.72], [W * 0.82, H], [W * 0.66, H * 0.55], [W * 0.54, H * 0.36]], "#dc0000");
  poly(ctx, [[0, H * 0.7], [W * 0.26, H * 0.58], [W * 0.2, H * 0.82], [W * 0.1, H]], "#f5f5f5");
  poly(ctx, [[W * 0.84, H * 0.08], [W * 0.96, H * 0.02], [W * 0.92, H * 0.3]], "#f5f5f5");

  let y = 50;
  y += slash(ctx, "TAKE YOUR HEART", 56, y, 54, "#f5f5f5", "#0f0f0f", -1.5) + 16;
  y += slash(ctx, `TO: ${(name || "???").toUpperCase().slice(0, 24)}`, 70, y, 38, "#dc0000", "#f5f5f5", 1) + 22;

  const lines = wrap(ctx, (msg || "Your heart will be mine.").toUpperCase(), 640, 34);
  lines.forEach((l, i) => {
    y += slash(ctx, l, 60 + (i % 2) * 24, y, 34, i % 2 ? "#f5f5f5" : "#0f0f0f", i % 2 ? "#0f0f0f" : "#f5f5f5", i % 2 ? 0.8 : -0.6) + (i % 2 ? 8 : 10);
  });
  slash(ctx, "— THE PHANTOM THIEVES", 56, H - 78, 28, "#dc0000", "#f5f5f5", -1);
}

export default function CallingCard() {
  const canvasRef = useRef(null);
  const [name, setName] = useState("Marcell");
  const [msg, setMsg] = useState("Hati kamu sudah jadi targetku");
  const [note, setNote] = useState("");
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, name, msg);
  }, [name, msg]);

  function toBlob() {
    return new Promise((res) => canvasRef.current.toBlob(res, "image/png"));
  }

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "calling-card.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    playSfx("rankup");
    setNote("Kartu diunduh.");
  }

  async function share() {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], "calling-card.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Calling Card" });
      else await navigator.share({ title: "Calling Card", text: `${name}: ${msg}`, url: location.href });
      setNote("Dibagikan.");
    } catch {
      setNote("Share dibatalkan.");
    }
  }

  const field =
    "mt-1 block w-full border-[3px] border-fg bg-bg px-3 py-2 text-base font-bold text-fg placeholder:text-mu";
  const btn =
    "-skew-x-12 px-5 py-2 text-sm font-black uppercase italic tracking-tighter transition-colors duration-100";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
      <div className="space-y-4">
        <label className="block text-sm font-black uppercase italic tracking-tighter">
          Nama target
          <input className={field} value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Nama" />
        </label>
        <label className="block text-sm font-black uppercase italic tracking-tighter">
          Pesan ({msg.length}/90)
          <textarea className={field} rows={3} value={msg} maxLength={90} onChange={(e) => setMsg(e.target.value)} placeholder="Tulis pesanmu" />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} aria-label="Unduh kartu sebagai PNG" className={`${btn} bg-red text-[#f5f5f5] hover:bg-fg hover:text-bg`}>
            <span className="inline-block skew-x-12">Download PNG</span>
          </button>
          {canShare && (
            <button type="button" onClick={share} aria-label="Bagikan kartu" className={`${btn} border-[3px] border-fg hover:bg-fg hover:text-bg`}>
              <span className="inline-block skew-x-12">Share</span>
            </button>
          )}
        </div>
        <p role="status" aria-live="polite" className="text-xs font-bold text-mu">
          {note}
        </p>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`Pratinjau calling card untuk ${name}: ${msg}`}
        className="h-auto w-full border-[3px] border-fg"
      />
    </div>
  );
}
