import { IconDisc, IconNoteOff } from "./Icons";

const BTN =
  "grid h-14 w-14 shrink-0 -skew-x-12 place-items-center border-[3px] border-fg transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5]";

// Ikon equalizer: 4 batang, animasi CSS hanya saat playing.
function Equalizer() {
  return (
    <span aria-hidden="true" className="flex h-6 w-6 items-end justify-between">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="eq-bar block h-full w-[4px] bg-current" />
      ))}
    </span>
  );
}

export function MusicButton({ playing, armed = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Jeda musik" : armed ? "Lanjutkan musik" : "Putar musik"}
      aria-pressed={playing}
      className={`${BTN} ${playing ? "bg-red text-[#f5f5f5]" : "bg-fg text-bg"} ${armed && !playing ? "outline outline-[3px] outline-offset-2 outline-red" : ""}`}
    >
      <span className="skew-x-12">{playing ? <Equalizer /> : <IconNoteOff />}</span>
    </button>
  );
}

export function PanelButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Tutup Jukebox" : "Buka Jukebox"}
      aria-expanded={open}
      aria-controls="jukebox-panel"
      className={`${BTN} ${open ? "bg-red text-[#f5f5f5]" : "bg-bg text-fg"}`}
    >
      <span className="skew-x-12">
        <IconDisc />
      </span>
    </button>
  );
}
