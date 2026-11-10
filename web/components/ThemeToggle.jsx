"use client";
// Client Component kecil. Ikon diganti murni lewat CSS (dark:) -> tidak ada state, tidak ada hydration mismatch, tidak ada layout shift.

import { IconMoon, IconSun } from "./Icons";

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const dark = root.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema"
      className="grid h-11 w-11 shrink-0 -skew-x-12 place-items-center bg-red text-[#f5f5f5] transition-colors duration-100 hover:bg-fg hover:text-bg"
    >
      <span className="skew-x-12">
        <IconSun className="hidden dark:block" />
        <IconMoon className="block dark:hidden" />
      </span>
    </button>
  );
}
