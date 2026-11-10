import Slash from "./Slash";
import FlipCard from "./FlipCard";
import StatAllocator from "./StatAllocator";
import PlaygroundLoader from "./PlaygroundLoader";
import CopyEmail from "./CopyEmail";
import HeroCard from "./HeroCard";
import { IconGithub, IconInstagram, IconLinkedin, IconBriefcase, IconUsers, IconCamera, IconCap, IconStar } from "./Icons";

const TONES = ["w", "r", "k"];
const ROTS = [-1.5, 1, -0.5];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const XP_ICON = { internship: IconBriefcase, competition: IconStar, photo: IconCamera, org: IconUsers, academic: IconCap };

function SectionTitle({ id, children, kicker }) {
  return (
    <div className="mb-8 sm:mb-12">
      {kicker && <p className="mb-2 text-xs font-black uppercase italic tracking-tighter text-rt sm:text-sm">{kicker}</p>}
      <h2 id={id} className="text-4xl leading-none sm:text-6xl">
        <Slash tone="r" rot={-1}>
          {children}
        </Slash>
      </h2>
    </div>
  );
}

/* ---------------- HERO ---------------- */
export function Hero({ profile }) {
  const words = profile.name.split(" ");
  const ticker = Array.from({ length: 6 }, () => `${profile.title} // ${profile.nickname} // Sistem Informasi — Telkom University`);

  return (
    <section id="home" aria-labelledby="hero-title" className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-between overflow-hidden">
      <div aria-hidden="true" className="shard-a absolute -right-6 -top-4 h-[55vw] max-h-[26rem] w-[60vw] max-w-[30rem] bg-red" />
      <div aria-hidden="true" className="shard-b absolute -left-4 bottom-24 h-[40vw] max-h-72 w-[40vw] max-w-72 bg-fg opacity-10" />

      {/* Kartu nama yang digantung dengan lanyard: bisa ditarik, diayun, dibalik */}
      <div className="pointer-events-none relative z-20 px-4 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[38%]">
        <HeroCard name={profile.name} role="Fullstack Developer · Cloud Engineer" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:pt-12 lg:pt-20">
        <p className="mb-4">
          <Slash tone="k" className="text-xs sm:text-sm">
            Portofolio // 2026
          </Slash>
        </p>
        <h1 id="hero-title" className="flex flex-wrap items-start gap-x-2 gap-y-2 text-[clamp(2.4rem,11vw,6.5rem)] leading-[0.95] lg:max-w-[62%]">
          {words.map((w, i) => (
            <Slash key={w + i} tone={TONES[i % 3]} rot={ROTS[i % 3]}>
              {w}
            </Slash>
          ))}
        </h1>
        <p className="mt-6 flex flex-wrap items-center gap-3">
          <Slash tone="w" className="text-lg sm:text-2xl">
            {profile.title}
          </Slash>
          <span className="text-sm font-black uppercase italic tracking-tighter sm:text-lg">a.k.a. “{profile.nickname}”</span>
        </p>
        <p className="mt-6 max-w-xl border-l-[6px] border-red bg-bg py-1 pl-4 text-base font-bold sm:text-lg">{profile.tagline}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#projects"
            className="-skew-x-12 bg-red px-6 py-3 text-base font-black uppercase italic tracking-tighter text-[#f5f5f5] transition-colors duration-100 hover:bg-fg hover:text-bg"
          >
            <span className="inline-block skew-x-12">Lihat Proyek</span>
          </a>
          <a
            href="#playground"
            className="-skew-x-12 border-[3px] border-fg px-6 py-3 text-base font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
          >
            <span className="inline-block skew-x-12">Playground</span>
          </a>
        </div>
      </div>

      {/* Marquee: dekoratif, murni CSS */}
      <div aria-hidden="true" className="relative -skew-y-1 overflow-hidden border-y-[3px] border-fg bg-fg py-2 text-bg">
        <div className="marquee flex w-max whitespace-nowrap font-display text-lg font-black uppercase italic tracking-tighter sm:text-2xl">
          {[0, 1].map((k) => (
            <span key={k} className="flex shrink-0 gap-8 pr-8">
              {ticker.map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROFILE / STATS ---------------- */
export function Profile({ profile }) {
  return (
    <section id="profile" aria-labelledby="profile-title" className="inv torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="profile-title" kicker="Ringkasan profil">
          Profil
        </SectionTitle>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-lg font-bold leading-snug sm:text-xl">{profile.bio}</p>
            <p className="mt-4">
              <Slash tone="r" className="text-sm sm:text-base">{profile.university}</Slash>
            </p>
          </div>
          <StatAllocator stats={profile.stats} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- SKILLS ---------------- */
export function Skills({ profile }) {
  return (
    <section id="skills" aria-labelledby="skills-title" className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle id="skills-title" kicker="Keahlian & teknologi">
        Skills
      </SectionTitle>
      <div className="grid gap-8 md:grid-cols-2">
        {profile.skills.map((g) => (
          <div key={g.group}>
            <h3 className="mb-3">
              <Slash tone="w" className="text-base sm:text-lg">
                {g.group}
              </Slash>
            </h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((it) => (
                <li
                  key={it}
                  className="-skew-x-12 border-[3px] border-fg px-3 py-1 text-sm font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5]"
                >
                  <span className="inline-block skew-x-12">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="mb-6 mt-14">
        <Slash tone="r" className="text-2xl sm:text-3xl">Work Experiences</Slash>
      </h3>
      <ul className="grid gap-6 sm:grid-cols-2">
        {profile.experience.map((e, i) => {
          const Icon = XP_ICON[e.kind] ?? IconBriefcase;
          const tone = i % 2 ? "k" : "r";
          return (
            <li key={i} className={`xp-card p-5 ${i % 2 ? "xp-tilt-r" : "xp-tilt-l"}`}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`grid h-10 w-10 -skew-x-12 place-items-center border-[3px] ${
                    tone === "r" ? "border-red bg-red text-[#f5f5f5]" : "border-fg bg-fg text-bg"
                  }`}
                >
                  <Icon width={20} height={20} className="skew-x-12" />
                </span>
                <span className="text-right text-[0.65rem] font-black uppercase italic leading-tight tracking-tighter text-rt sm:text-xs">
                  {e.period}
                </span>
              </div>
              <p className="mt-4 text-lg font-black uppercase italic leading-tight tracking-tighter sm:text-xl">{e.role}</p>
              <p className="text-sm font-bold text-mu">{e.org}</p>
              <p className="mt-2 text-sm">{e.desc}</p>
            </li>
          );
        })}
      </ul>

      <h3 className="mb-6 mt-14">
        <Slash tone="r" className="text-2xl sm:text-3xl">Sertifikat</Slash>
      </h3>
      <div className="max-w-xl overflow-hidden">
        <a href="/sertifikat-sap.jpg" target="_blank" rel="noreferrer" className="cert-frame block transition-opacity duration-100 hover:opacity-90">
          <span className="cert-ribbon" aria-hidden="true">Diperoleh</span>
          <img
            src="/sertifikat-sap.jpg"
            alt="Sertifikat Penghargaan — Asisten Praktikum Sistem Enterprise, Telkom University"
            className="block w-full"
            loading="lazy"
          />
        </a>
      </div>
      <p className="mt-3 max-w-xl text-sm text-mu">
        <span className="font-black uppercase italic tracking-tighter text-rt">Predikat Baik Sekali</span> — Asisten Praktikum Sistem Enterprise (SAP), Prodi S1 Sistem Informasi Telkom University, Semester Ganjil 2024/2025.
      </p>
    </section>
  );
}

/* ---------------- PROYEK (kartu flip + stempel) ---------------- */
function Stamp({ status }) {
  const done = status === "Secured" || status === "Selesai";
  const label = { Secured: "Selesai", "In Progress": "Berjalan" }[status] ?? status;
  return (
    <span
      aria-label={`Status: ${label}`}
      className={`absolute right-0 top-0 -rotate-12 border-4 px-3 py-1 font-display text-lg font-black uppercase italic tracking-tighter opacity-0 sm:text-2xl ${
        done ? "border-red text-rt" : "border-fg text-fg"
      } group-has-[:checked]:[animation:stamp_.35s_.35s_both]`}
    >
      {label}
    </span>
  );
}

export function Heists({ heists }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="inv torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="projects-title" kicker="Proyek — klik kartu untuk melihat detail">
          Proyek
        </SectionTitle>
        <ul className="grid gap-8 md:grid-cols-2">
          {heists.map((h, i) => (
            <li key={h.id ?? h.codename} className={`transition-transform duration-150 hover:rotate-0 ${i % 2 ? "md:mt-10 rotate-1" : "-rotate-1"}`}>
              <FlipCard
                id={`project-${i}`}
                label={`Buka detail ${h.codename}`}
                front={
                  <>
                    <p className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase italic tracking-tighter text-rt">Proyek {String(i + 1).padStart(2, "0")}</span>
                      <span className="-skew-x-12 bg-fg px-3 py-1 text-xs font-black uppercase italic tracking-tighter text-bg">
                        <span className="inline-block skew-x-12">{{ Secured: "Selesai", "In Progress": "Berjalan" }[h.status] ?? h.status}</span>
                      </span>
                    </p>
                    <h3 className="mt-3 text-2xl font-black uppercase italic leading-tight tracking-tighter sm:text-3xl">{h.codename}</h3>
                    <p className="mt-4 text-xs font-black uppercase italic tracking-tighter text-mu">Klik untuk membuka</p>
                  </>
                }
                back={
                  <div className="relative">
                    <Stamp status={h.status} />
                    <p className="text-xs font-black uppercase italic tracking-tighter text-rt">Deskripsi</p>
                    <p className="mt-1 max-w-[70%] text-sm font-bold">{h.target}</p>
                    <p className="mt-4 text-xs font-black uppercase italic tracking-tighter text-rt">Teknologi</p>
                    <ul className="mt-1 flex flex-wrap gap-2" aria-label="Teknologi">
                      {(h.loot ?? []).map((l) => (
                        <li key={l} className="border-2 border-current px-2 py-0.5 text-xs font-black uppercase italic">
                          {l}
                        </li>
                      ))}
                    </ul>
                    {h.shots?.length > 0 && (
                      <>
                        <p className="mt-4 text-xs font-black uppercase italic tracking-tighter text-rt">Tampilan Aplikasi</p>
                        <ul className="mt-1 flex flex-wrap gap-2" aria-label="Tangkapan layar">
                          {h.shots.map((s, si) => (
                            <li key={s.src} className={`-skew-x-6 border-2 border-current p-0.5 ${si % 2 ? "rotate-1" : "-rotate-1"}`}>
                              <img src={s.src} alt={s.alt} className="h-16 w-11 skew-x-6 object-cover object-top sm:h-20 sm:w-14" loading="lazy" />
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {h.link && (
                      <a
                        href={h.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buka ${h.codename} (tab baru)`}
                        className="mt-4 inline-block border-b-[3px] border-current text-sm font-black uppercase italic tracking-tighter hover:text-rt"
                      >
                        Lihat proyek
                      </a>
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------- REFERENSI (kartu testimoni) ---------------- */
export function Confidant({ confidants }) {
  return (
    <section id="references" aria-labelledby="references-title" className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle id="references-title" kicker="Relasi profesional — klik kartu untuk membaca testimoni">
        Referensi
      </SectionTitle>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {confidants.map((c, ci) => (
          <li key={c.name}>
            <FlipCard
              id={`ref-${ci}`}
              shadow="red"
              label={`Balik kartu ${c.role}: ${c.name}`}
              front={
                <div className="flex min-h-64 flex-col justify-between">
                  <div>
                    <p className="font-display text-6xl font-black italic leading-none text-rt" aria-hidden="true">
                      {String(ci + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-3 text-xl font-black uppercase italic leading-tight tracking-tighter">{c.role}</p>
                    <p className="mt-1 text-sm font-bold text-mu">{c.name}</p>
                  </div>
                  <p className="text-xs font-black uppercase italic tracking-tighter text-mu">Klik untuk membaca</p>
                </div>
              }
              back={
                <div className="flex min-h-64 flex-col justify-between">
                  <div>
                    <p className="text-xs font-black uppercase italic tracking-tighter text-rt">{c.role}</p>
                    <blockquote className="mt-3 text-sm font-bold leading-snug">“{c.quote}”</blockquote>
                  </div>
                  <p className="mt-3">
                    <Slash tone="w" className="text-sm">
                      {c.name}
                    </Slash>
                  </p>
                </div>
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- PLAYGROUND ---------------- */
export function Playground() {
  return (
    <section id="playground" aria-labelledby="playground-title" className="inv torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="playground-title" kicker="Mini-game & alat">
          Playground
        </SectionTitle>
        <p className="mb-8 max-w-xl font-bold">
          Beberapa proyek kecil interaktif. Dimuat hanya saat dibuka — tombol <kbd className="border-2 border-current px-1">M</kbd> membuka menu cepat. Ada
          kejutan kecil untuk yang menemukan kode lama.
        </p>
        <PlaygroundLoader />
      </div>
    </section>
  );
}

/* ---------------- CONTACT ---------------- */
const SOCIALS = [
  ["github", "GitHub", IconGithub],
  ["linkedin", "LinkedIn", IconLinkedin],
  ["instagram", "Instagram", IconInstagram],
];

export function Contact({ profile }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="mx-auto max-w-6xl px-4 pb-28 pt-20">
      <SectionTitle id="contact-title" kicker="Hubungi saya">
        Kontak
      </SectionTitle>
      <p className="mb-8 max-w-xl text-lg font-bold">Tertarik berkolaborasi atau punya pertanyaan? Silakan hubungi saya, akan saya balas secepatnya.</p>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          className="-skew-x-12 bg-red px-5 py-3 text-base font-black uppercase italic tracking-tighter text-[#f5f5f5] transition-colors duration-100 hover:bg-fg hover:text-bg"
        >
          <span className="inline-block skew-x-12">{profile.email}</span>
        </a>
        <CopyEmail email={profile.email} />
        <a
          href={profile.cv}
          download
          aria-label="Unduh CV (PDF)"
          className="-skew-x-12 border-[3px] border-fg px-5 py-2 text-sm font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
        >
          <span className="inline-block skew-x-12">Download CV</span>
        </a>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {SOCIALS.filter(([k]) => profile.links?.[k]).map(([k, label, Icon]) => (
          <li key={k}>
            <a
              href={profile.links[k]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (buka di tab baru)`}
              className="flex -skew-x-6 items-center gap-4 border-[3px] border-fg bg-bg p-5 shadow-[6px_6px_0_var(--red)] transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5] hover:shadow-[6px_6px_0_var(--fg)]"
            >
              <Icon className="h-8 w-8 shrink-0" />
              <span className="text-xl font-black uppercase italic tracking-tighter">{label}</span>
            </a>
          </li>
        ))}
      </ul>
      <footer className="mt-20 border-t-[3px] border-fg pt-6 text-xs font-bold uppercase text-mu">
        © {new Date().getFullYear()} {profile.name} · Built with Next.js + Express · Take your time.
      </footer>
    </section>
  );
}
