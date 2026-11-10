import { ImageResponse } from "next/og";

export const alt = "Vassell Enha Atthayya — Full Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Open Graph image dibuat otomatis saat build (tanpa file gambar).
export default function Image() {
  const box = (bg, fg, text, fs, rot = 0) => (
    <div style={{ display: "flex", background: bg, color: fg, padding: "6px 28px", fontSize: fs, fontWeight: 900, transform: `skewX(-12deg) rotate(${rot}deg)`, marginBottom: 14 }}>
      {text}
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0f0f0f", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 520, height: 630, background: "#dc0000", clipPath: "polygon(38% 0, 100% 0, 100% 72%, 80% 100%, 64% 52%)" }} />
        {box("#f5f5f5", "#0f0f0f", "VASSELL ENHA", 110, -1)}
        {box("#dc0000", "#f5f5f5", "ATTHAYYA", 110, 1)}
        {box("#f5f5f5", "#0f0f0f", "FULL STACK DEVELOPER", 44)}
      </div>
    ),
    size
  );
}
