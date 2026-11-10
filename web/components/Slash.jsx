// Potongan teks majalah: kotak miring + teks italic tegak (inner di-unskew supaya terbaca di layar kecil).
const TONES = {
  w: "bg-fg text-bg", // hitam di putih / putih di hitam, ikut tema
  r: "bg-red text-[#f5f5f5]", // putih di merah
  k: "bg-bg text-fg border-[3px] border-fg", // outline
};

// display = judul besar; body = label kecil. Keduanya heavy italic.
const FONTS = {
  display: "font-display font-black uppercase italic tracking-tighter",
  body: "font-black uppercase italic tracking-tighter",
};

export default function Slash({ tone = "w", rot = 0, as: Tag = "span", font = "display", className = "", children }) {
  return (
    <Tag
      className={`inline-block -skew-x-12 px-[0.3em] py-[0.05em] ${FONTS[font]} ${TONES[tone]} ${className}`}
      style={rot ? { rotate: `${rot}deg` } : undefined}
    >
      <span className="inline-block skew-x-12">{children}</span>
    </Tag>
  );
}
