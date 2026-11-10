"use client";
// Tombol salin email (satu-satunya JS di Contact).
import { useState } from "react";

export default function CopyEmail({ email }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      window.prompt("Salin email:", email);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={done ? "Email tersalin" : `Salin email ${email}`}
      className="-skew-x-12 border-[3px] border-fg px-4 py-2 text-sm font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
    >
      <span className="inline-block skew-x-12" aria-live="polite">
        {done ? "Tersalin!" : "Salin email"}
      </span>
    </button>
  );
}
