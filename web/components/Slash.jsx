// Potongan teks majalah: kotak miring + teks italic tegak (inner di-unskew supaya terbaca di layar kecil).
const TONES = {
  w: "bg-fg text-bg", // hitam di putih / putih di hitam, ikut tema
  r: "bg-red text-[#f5f5f5]", // putih di merah
  k: "bg-bg text-fg border-[3px] border-fg", // outline
};

export default function Slash({ tone = "w", rot = 0, as: Tag = "span", className = "", children }) {
  return (
    <Tag
      className={`inline-block -skew-x-12 px-[0.3em] py-[0.05em] font-display font-black uppercase italic tracking-tighter ${TONES[tone]} ${className}`}
      style={rot ? { rotate: `${rot}deg` } : undefined}
    >
      <span className="inline-block skew-x-12">{children}</span>
    </Tag>
  );
}
