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
        // Tanpa webfont = nol layout shift & nol request tambahan.
        display: ['"Arial Black"', "Impact", '"Helvetica Neue"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
