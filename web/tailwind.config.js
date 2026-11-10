const v = (n) => `var(--${n})`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), // latar
        fg: v("fg"), // teks / kotak kontras
        red: v("red"), // aksen #DC0000 (selalu dipakai sebagai FILL, teks putih di atasnya)
        rt: v("rt"), // merah untuk TEKS kecil (lolos AA di tiap tema)
        mu: v("mu"), // teks sekunder
      },
      fontFamily: {
        // Self-hosted via next/font/local (variable CSS di <html>), fallback system supaya tetap terbaca.
        display: ["var(--font-markin)", '"Arial Black"', "Impact", "sans-serif"], // judul: Markin Ultra Bold
        accent: ["var(--font-accent)", '"Arial Black"', "Impact", "sans-serif"], // Persona 5 Menu: ticker, stempel, angka
      },
    },
  },
  plugins: [],
};
