"use client";
// Client Component global & kecil: tombol/shortcut M (Command Wheel), Konami Code, efek klik "slash", SFX klik.
// Komponen berat (Wheel, overlay Konami) di-lazy-load hanya saat dibutuhkan.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { playSfx } from "../lib/sfx";

const CommandWheel = dynamic(() => import("./CommandWheel"), { ssr: false });
const TakeYourHeart = dynamic(() => import("./TakeYourHeart"), { ssr: false });

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const isTyping = (t) =>
  !!t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || (t.tagName === "INPUT" && !["checkbox", "radio", "range", "button"].includes(t.type)));

export default function GlobalFx() {
  const [wheel, setWheel] = useState(false);
  const [heart, setHeart] = useState(false);
  const opener = useRef(null);
  const wheelOpen = useRef(false);

  const openWheel = useCallback(() => {
    opener.current = document.activeElement;
    wheelOpen.current = true;
    setWheel(true);
    playSfx("open");
  }, []);
  const closeWheel = useCallback(() => {
    wheelOpen.current = false;
    setWheel(false);
    opener.current?.focus?.();
  }, []);
  const closeHeart = useCallback(() => setHeart(false), []);

  useEffect(() => {
    let buf = [];

    const toggleSecret = () => {
      const root = document.documentElement;
      const on = !root.hasAttribute("data-secret");
      if (on) root.setAttribute("data-secret", "");
      else root.removeAttribute("data-secret");
      try {
        localStorage.setItem("p5:secret", on ? "1" : "0");
      } catch {}
      if (on) {
        playSfx("secret");
        setHeart(true);
      }
    };

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buf = [...buf, k].slice(-KONAMI.length);
      if (buf.join("|") === KONAMI.join("|")) {
        buf = [];
        toggleSecret();
        return;
      }
      if (k === "m" && !wheelOpen.current) {
        e.preventDefault();
        openWheel();
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onDown = (e) => {
      if (e.target.closest?.("button,a,[role=button]")) playSfx("click");
      if (reduce.matches) return;
      const s = document.createElement("span");
      s.className = "slash-fx";
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.setAttribute("aria-hidden", "true");
      s.addEventListener("animationend", () => s.remove(), { once: true });
      document.body.appendChild(s);
    };

    const onChange = (e) => e.target.matches?.("input[data-flip]") && playSfx("flip");
    document.addEventListener("change", onChange);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("change", onChange);
    };
  }, [openWheel]);

  return (
    <>
      <button
        type="button"
        onClick={openWheel}
        aria-label="Buka menu cepat (tombol M)"
        aria-haspopup="dialog"
        className="fixed bottom-4 left-4 z-50 grid h-14 w-14 -skew-x-12 place-items-center border-[3px] border-fg bg-bg font-display text-xl font-black italic transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5]"
      >
        <span className="skew-x-12">M</span>
      </button>
      {wheel && <CommandWheel onClose={closeWheel} />}
      {heart && <TakeYourHeart onDone={closeHeart} />}
    </>
  );
}
