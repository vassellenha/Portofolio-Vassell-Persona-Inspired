import ThemeToggle from "./ThemeToggle";
import Slash from "./Slash";

const NAV = [
  ["#home", "Home"],
  ["#profile", "Profil"],
  ["#skills", "Skills"],
  ["#projects", "Proyek"],
  ["#references", "Referensi"],
  ["#playground", "Playground"],
  ["#contact", "Kontak"],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-fg bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <a href="#home" aria-label="VEA, kembali ke atas" className="shrink-0 text-xl">
          <Slash tone="r">VEA</Slash>
        </a>
        <nav aria-label="Navigasi utama" className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
          <ul className="flex w-max gap-1 sm:gap-2">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="block -skew-x-12 px-3 py-2 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg sm:text-sm"
                >
                  <span className="inline-block skew-x-12">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
