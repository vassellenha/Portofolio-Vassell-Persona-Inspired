"use client";
// Pembungkus tipis: merender tombol statis (SSR) dan baru memuat chunk Jukebox
// saat user menyentuh tombol atau browser idle setelah halaman selesai dimuat.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MusicButton, PanelButton } from "./MusicButton";

function Placeholder({ onPlay, onOpen }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
      <PanelButton open={false} onClick={onOpen} />
      <MusicButton playing={false} onClick={onPlay} />
    </div>
  );
}

const Jukebox = dynamic(() => import("./Jukebox"), {
  ssr: false,
  loading: () => <Placeholder onPlay={() => {}} onOpen={() => {}} />,
});

export default function JukeboxLoader({ tracks }) {
  const [mode, setMode] = useState(null); // null | { autoStart, open }

  // Hidrasi saat idle (setelah window load) supaya tidak membebani render awal.
  useEffect(() => {
    let idle;
    let timer;
    const start = () => {
      const run = () => setMode((m) => m ?? { autoStart: false, open: false });
      if ("requestIdleCallback" in window) idle = requestIdleCallback(run, { timeout: 4000 });
      else timer = setTimeout(run, 2000);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idle) cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  if (!mode) {
    return (
      <Placeholder
        onPlay={() => setMode({ autoStart: tracks.length > 0, open: tracks.length === 0 })}
        onOpen={() => setMode({ autoStart: false, open: true })}
      />
    );
  }
  return <Jukebox tracks={tracks} autoStart={mode.autoStart} initialOpen={mode.open} />;
}
