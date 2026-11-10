import Slash from "./Slash";
import { IconGithub, IconInstagram, IconLinkedin, IconStar } from "./Icons";

const TONES = ["w", "r", "k"];
const ROTS = [-1.5, 1, -0.5];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

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
  const ticker = Array.from({ length: 6 }, () => `${profile.title} // ${profile.nickname} // Take your heart`);

  return (
    <section id="home" aria-labelledby="hero-title" className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-between overflow-hidden">
      <div aria-hidden="true" className="shard-a absolute -right-6 -top-4 h-[55vw] max-h-[26rem] w-[60vw] max-w-[30rem] bg-red" />
      <div aria-hidden="true" className="shard-b absolute -left-4 bottom-24 h-[40vw] max-h-72 w-[40vw] max-w-72 bg-fg opacity-10" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:pt-20">
        <p className="mb-4">
          <Slash tone="k" className="text-xs sm:text-sm">
            All-out attack // Portfolio
          </Slash>
        </p>
        <h1 id="hero-title" className="flex flex-wrap items-start gap-x-2 gap-y-2 text-[clamp(2.6rem,13vw,7.5rem)] leading-[0.95]">
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
            href="#heists"
            className="-skew-x-12 bg-red px-6 py-3 text-base font-black uppercase italic tracking-tighter text-[#f5f5f5] transition-colors duration-100 hover:bg-fg hover:text-bg"
          >
            <span className="inline-block skew-x-12">Lihat Heists</span>
          </a>
          <a
            href="#contact"
            className="-skew-x-12 border-[3px] border-fg px-6 py-3 text-base font-black uppercase italic tracking-tighter transition-colors duration-100 hover:bg-fg hover:text-bg"
          >
            <span className="inline-block skew-x-12">Hubungi</span>
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
function Pips({ level }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`Level ${level} dari 9`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} aria-hidden="true" className={`h-4 w-3 -skew-x-12 border-2 border-fg sm:w-5 ${i < level ? "bg-red" : ""}`} />
      ))}
    </span>
  );
}

export function Profile({ profile }) {
  return (
    <section id="profile" aria-labelledby="profile-title" className="inv torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="profile-title" kicker="Status screen">
          Profile
        </SectionTitle>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div >
            <p className="text-lg font-bold leading-snug sm:text-xl">{profile.bio}</p>
            <p className="mt-4">
              <Slash tone="r">{profile.university}</Slash>
            </p>
          </div>
          <ul className="space-y-4">
            {profile.stats.length === 0 && <li className="text-mu">Data stats belum tersedia.</li>}
            {profile.stats.map((s) => (
              <li key={s.key} >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter sm:text-2xl">
                    <IconStar className="h-5 w-5 text-rt" />
                    {s.key}
                  </span>
                  <Pips level={s.level} />
                </div>
                <p className="mt-1 text-sm text-mu">{s.skill}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- HEISTS ---------------- */
export function Heists({ heists }) {
  return (
    <section id="heists" aria-labelledby="heists-title" className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle id="heists-title" kicker="Mission log">
        Heists
      </SectionTitle>
      {heists.length === 0 ? (
        <p className="text-mu">Belum ada heist yang tercatat.</p>
      ) : (
        <ul className="grid gap-8 md:grid-cols-2">
          {heists.map((h, i) => (
            <li key={h.id ?? h.codename} className={`${i % 2 ? "md:mt-10" : ""}`}>
              <article className="group -skew-x-6 border-[3px] border-fg bg-bg shadow-[8px_8px_0_var(--fg)] transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5]">
                <div className="skew-x-6 p-5">
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase italic tracking-tighter text-rt group-hover:text-[#f5f5f5]">
                      Heist #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`-skew-x-12 px-3 py-1 text-xs font-black uppercase italic tracking-tighter ${
                        h.status === "Secured" ? "bg-red text-[#f5f5f5] group-hover:bg-bg group-hover:text-fg" : "bg-fg text-bg group-hover:bg-[#f5f5f5] group-hover:text-[#0f0f0f]"
                      }`}
                    >
                      <span className="inline-block skew-x-12">{h.status}</span>
                    </span>
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase italic leading-tight tracking-tighter sm:text-3xl">{h.codename}</h3>
                  <p className="mt-3 text-sm font-bold">
                    <span className="uppercase text-rt group-hover:text-[#f5f5f5]">Target:</span> {h.target}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Loot">
                    {(h.loot ?? []).map((l) => (
                      <li key={l} className="border-2 border-current px-2 py-0.5 text-xs font-black uppercase italic">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- CONFIDANT ---------------- */
export function Confidant({ confidants }) {
  return (
    <section id="confidant" aria-labelledby="confidant-title" className="inv torn -mt-5 pb-20 pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle id="confidant-title" kicker="Bonds">
          Confidant
        </SectionTitle>
        {confidants.length === 0 ? (
          <p className="text-mu">Belum ada confidant.</p>
        ) : (
          <ul className="grid gap-8 md:grid-cols-3">
            {confidants.map((c, i) => (
              <li key={c.name} >
                <figure className={`border-[3px] border-fg bg-bg p-5 ${i % 2 ? "md:translate-y-6" : ""}`}>
                  <p className="font-display text-5xl font-black italic leading-none text-rt" aria-label={`Rank ${c.rank}`}>
                    {ROMAN[c.rank] ?? c.rank}
                  </p>
                  <blockquote className="mt-3 text-base font-bold leading-snug">“{c.quote}”</blockquote>
                  <figcaption className="mt-4 flex flex-wrap items-center gap-2">
                    <Slash tone="w" className="text-sm">
                      {c.name}
                    </Slash>
                    <span className="text-xs font-black uppercase italic tracking-tighter text-mu">{c.arc}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
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
      <SectionTitle id="contact-title" kicker="Calling card">
        Contact
      </SectionTitle>
      <p className="mb-8 max-w-xl text-lg font-bold">Ada proyek atau ide gila? Kirim calling card — gue balas secepatnya.</p>
      <ul className="grid gap-4 sm:grid-cols-3">
        {SOCIALS.filter(([k]) => profile.links?.[k]).map(([k, label, Icon]) => (
          <li key={k}>
            <a
              href={profile.links[k]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (buka di tab baru)`}
              className="flex -skew-x-6 items-center gap-4 border-[3px] border-fg bg-bg p-5 shadow-[6px_6px_0_var(--red)] transition-colors duration-100 hover:bg-red hover:text-[#f5f5f5]"
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
