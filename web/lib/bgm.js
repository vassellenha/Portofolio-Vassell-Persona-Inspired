// Satu elemen <audio> untuk seluruh situs. Intro memulai lagu di sini, lalu Jukebox mengambil alih
// elemen yang sama sehingga musik tidak terputus saat intro selesai.
let el = null;

export function sharedAudio() {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "none";
  }
  return el;
}

// Apakah elemen sedang memuat file ini? (src elemen berupa URL absolut, file berupa path)
export function samePath(a, file) {
  if (!a || !a.src || !file) return false;
  try {
    return decodeURIComponent(new URL(a.src, location.href).pathname) === file;
  } catch {
    return false;
  }
}
