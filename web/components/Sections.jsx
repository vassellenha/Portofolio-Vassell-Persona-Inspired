import Slash from "./Slash";
import FlipCard from "./FlipCard";
import SocialStats from "./SocialStats";
import PlaygroundLoader from "./PlaygroundLoader";
import CopyEmail from "./CopyEmail";
import HeroCard from "./HeroCard";
import { IconGithub, IconInstagram, IconLinkedin, IconBriefcase, IconUsers, IconCamera, IconCap, IconStar, IconImage } from "./Icons";

const TONES = ["w", "r", "k"];
const ROTS = [-1.5, 1, -0.5];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const XP_ICON = { internship: IconBriefcase, competition: IconStar, photo: IconCamera, org: IconUsers, academic: IconCap };
const XP_KIND = { internship: "Magang", competition: "Kompetisi", photo: "Dokumentasi", org: "Organisasi", academic: "Akademik" };

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
    <section id="profile" aria-labelledby="profile-title" className="p5-dark torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="profile-title" kicker="Ringkasan profil — social stats">
          Profil
        </SectionTitle>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="text-lg font-bold leading-snug sm:text-xl">{profile.bio}</p>
            <p className="mt-4">
              <Slash tone="r" className="text-sm sm:text-base">{profile.university}</Slash>
            </p>
            <p className="mt-6 text-xs font-black uppercase italic tracking-tighter text-mu">
              Ketuk tiap parameter untuk melihat rinciannya — dan coba klik bintang emasnya.
            </p>
          </div>
          <SocialStats stats={profile.stats} />
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

      <ol className="wx" aria-label="Riwayat pengalaman, terbaru di atas">
        {profile.experience.map((e, i) => {
          const Icon = XP_ICON[e.kind] ?? IconBriefcase;
          const no = String(i + 1).padStart(2, "0");
          return (
            <li key={i} className={`wx-row ${i % 2 ? "is-alt" : ""}`}>
              <div className="wx-date" aria-hidden="true">
                <span className="wx-yr">{e.year}</span>
                <span className="wx-no">{no}</span>
              </div>
              <article className="wx-card">
                {i === 0 && <span className="wx-new">Terbaru</span>}
                <div className="wx-in inv">
                  <span className="wx-dots" aria-hidden="true" />
                  <span className="wx-ghost" aria-hidden="true">{no}</span>
                  <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="wx-icon">
                      <Icon width={20} height={20} />
                    </span>
                    <span className="-skew-x-12 bg-fg px-2 py-0.5 text-[0.7rem] font-black uppercase italic tracking-tighter text-bg">
                      <span className="inline-block skew-x-12">{XP_KIND[e.kind] ?? "Pengalaman"}</span>
                    </span>
                    <span className="text-[0.7rem] font-black uppercase italic tracking-tighter text-rt sm:text-xs">{e.period}</span>
                  </div>
                  <h4 className="relative mt-4 font-display text-xl font-black uppercase italic leading-[1.05] tracking-tighter sm:text-2xl">{e.role}</h4>
                  <p className="relative mt-2">
                    <span className="inline-block -skew-x-12 bg-red px-2 py-1 text-xs font-black tracking-tight text-[#f5f5f5] sm:text-sm">
                      <span className="inline-block skew-x-12">{e.org}</span>
                    </span>
                  </p>
                  <p className="relative mt-3 text-sm font-semibold leading-relaxed">{e.desc}</p>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

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

/* ---------------- PROYEK (berkas target: foto miring + pelat judul) ---------------- */
const PF_LABEL = { all: "Semua", web: "Web App", internal: "Internal", game: "Game" };
const PF_NOIMG = { internal: "Internal perusahaan — tanpa tangkapan layar publik", web: "Situs yang sedang kamu buka" };

export function Heists({ heists }) {
  const done = heists.filter((h) => h.status === "Selesai" || h.status === "Secured").length;
  const types = ["all", ...Array.from(new Set(heists.map((h) => h.type).filter(Boolean)))];
  return (
    <section id="projects" aria-labelledby="projects-title" className="inv torn -mt-5 pb-24 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="projects-title" kicker="Proyek — klik berkas untuk membuka detail">
          Proyek
        </SectionTitle>

        <p className="-mt-6 mb-8 flex flex-wrap gap-x-6 gap-y-1 text-xs font-black uppercase italic tracking-tighter text-mu">
          <span><span className="text-rt">{heists.length}</span> Total</span>
          <span><span className="text-rt">{done}</span> Selesai</span>
          <span><span className="text-rt">{heists.length - done}</span> Berjalan</span>
        </p>

        <div className="pf-tabs mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter tipe proyek">
          {types.map((t, ti) => (
            <span key={t}>
              <input type="radio" name="pf" id={`pf-${t}`} className="peer sr-only" defaultChecked={ti === 0} />
              <label
                htmlFor={`pf-${t}`}
                className="pf-tab -skew-x-12 cursor-pointer border-2 border-fg px-3 py-1 text-xs font-black uppercase italic tracking-tighter transition-colors duration-100"
              >
                <span className="inline-block skew-x-12">{PF_LABEL[t] ?? t}</span>
              </label>
            </span>
          ))}
        </div>

        <ul className="pf-grid pj-grid">
          {heists.map((h, i) => {
            const slug = (h.code ? h.code : `vea-${String(i + 1).padStart(2, "0")}`).toLowerCase();
            const status = { Secured: "Selesai", "In Progress": "Berjalan" }[h.status] ?? h.status;
            const loot = h.loot ?? [];
            return (
              <li key={h.id ?? h.codename} data-type={h.type} className="pj">
                <a href={`/projek/${slug}`} data-nav="dagger" className="pj-shot" aria-label={`Buka detail ${h.codename}`}>
                  <span className="pj-frame">
                    <span className="pj-img">
                      {h.image ? (
                        <img src={h.image} alt={`Tampilan ${h.codename}`} loading="lazy" />
                      ) : (
                        <span className="pj-noimg">
                          <b>{h.code ?? String(i + 1).padStart(2, "0")}</b>
                          <i>{PF_NOIMG[h.type] ?? "Tanpa tangkapan layar"}</i>
                        </span>
                      )}
                    </span>
                  </span>
                  {h.code && <span className="pj-code">{h.code}</span>}
                  <span className={`pj-stamp ${status === "Selesai" ? "" : "is-wip"}`}>{status}</span>
                  <span className="pj-open">Buka berkas →</span>
                </a>

                <div className="pj-body">
                  <h3>
                    <a href={`/projek/${slug}`} data-nav="dagger" className="pj-title">
                      {h.codename}
                    </a>
                  </h3>
                  <p className="mt-4 text-[0.7rem] font-black uppercase italic tracking-tighter text-rt sm:text-xs">
                    {h.category ?? PF_LABEL[h.type] ?? "Proyek"}
                    {h.tagline && <span className="text-mu"> — {h.tagline}</span>}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed">{h.target}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Teknologi">
                    {loot.slice(0, 5).map((l) => (
                      <li key={l} className="-skew-x-12 border-2 border-current px-2 py-0.5 text-[0.7rem] font-black uppercase italic tracking-tighter">
                        <span className="inline-block skew-x-12">{l}</span>
                      </li>
                    ))}
                    {loot.length > 5 && (
                      <li className="-skew-x-12 bg-fg px-2 py-0.5 text-[0.7rem] font-black uppercase italic tracking-tighter text-bg">
                        <span className="inline-block skew-x-12">+{loot.length - 5}</span>
                      </li>
                    )}
                  </ul>
                  <p className="mt-5 flex flex-wrap items-center gap-3">
                    <a href={`/projek/${slug}`} data-nav="dagger" className="pj-btn is-main">
                      <span>
                        <IconImage width={14} height={14} /> Detail
                      </span>
                    </a>
                    {h.link && (
                      <a href={h.link} target="_blank" rel="noopener noreferrer" aria-label={`Buka kode ${h.codename} di GitHub (tab baru)`} className="pj-btn">
                        <span>
                          <IconGithub width={14} height={14} /> Kode
                        </span>
                      </a>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
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
