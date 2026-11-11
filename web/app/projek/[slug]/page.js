import { notFound } from "next/navigation";
import { getSiteData } from "../../../lib/api";
import Slash from "../../../components/Slash";
import { IconArrowLeft, IconCode, IconImage, IconGithub } from "../../../components/Icons";

export const revalidate = 60;

const PF_LABEL = { web: "Web App", internal: "Internal", game: "Game" };

function slugify(h, i) {
  return (h.code ? h.code : `vea-${String(i + 1).padStart(2, "0")}`).toLowerCase();
}

export default async function ProjekDetail({ params }) {
  const { slug } = await params;
  const { heists } = await getSiteData();
  const h = heists.find((x, idx) => slugify(x, idx) === slug);
  if (!h) notFound();

  const statusLabel = { Secured: "Selesai", "In Progress": "Berjalan" }[h.status] ?? h.status;
  const done = statusLabel === "Selesai";

  return (
    <main id="main" className="min-h-screen pb-24 pt-10">
      <div className="mx-auto max-w-5xl px-4">
        <a
          href="/#projects"
          data-nav="wipe"
          className="inline-flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-mu hover:text-rt"
        >
          <IconArrowLeft width={18} height={18} /> Kembali ke Proyek
        </a>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black uppercase italic tracking-tighter text-rt sm:text-sm">{h.category}</p>
          <span
            className={`-skew-x-12 border-4 px-3 py-1 text-xs font-black uppercase italic tracking-tighter sm:text-sm ${
              done ? "border-red text-rt" : "border-fg text-fg"
            }`}
          >
            <span className="inline-block skew-x-12">{statusLabel}</span>
          </span>
        </div>

        {h.code && <p className="mt-1 font-mono text-xs tracking-[0.25em] text-mu">{h.code}</p>}
        <h1 className="mt-2 text-4xl font-black uppercase italic leading-[0.95] tracking-tighter sm:text-6xl">{h.codename}</h1>
        {h.tagline && (
          <p className="mt-3 text-base font-bold uppercase italic tracking-tight text-rt sm:text-lg">{h.tagline}</p>
        )}

        {h.image && (
          <div className="pj-shot mt-10 max-w-4xl" style={{ rotate: "-0.8deg" }}>
            <span className="pj-frame">
              <span className="pj-img">
                <img src={h.image} alt={`Tampilan ${h.codename}`} />
              </span>
            </span>
          </div>
        )}

        <p className="mt-8 max-w-2xl text-base leading-relaxed sm:text-lg">{h.target}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-3 -skew-x-12 border-[3px] border-fg px-4 py-3">
            <span className="grid h-9 w-9 skew-x-12 place-items-center bg-fg text-bg">
              <IconCode width={18} height={18} />
            </span>
            <span className="skew-x-12">
              <span className="block text-xl font-black italic leading-none">{(h.loot ?? []).length}</span>
              <span className="block text-[0.65rem] font-black uppercase tracking-tighter text-mu">Teknologi</span>
            </span>
          </div>
          {h.shots?.length > 0 && (
            <div className="flex items-center gap-3 -skew-x-12 border-[3px] border-fg px-4 py-3">
              <span className="grid h-9 w-9 skew-x-12 place-items-center bg-fg text-bg">
                <IconImage width={18} height={18} />
              </span>
              <span className="skew-x-12">
                <span className="block text-xl font-black italic leading-none">{h.shots.length}</span>
                <span className="block text-[0.65rem] font-black uppercase tracking-tighter text-mu">Dokumentasi</span>
              </span>
            </div>
          )}
        </div>

        <dl className="mt-8 grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-bold text-mu">Kategori</dt>
          <dd className="font-black uppercase italic tracking-tight">{PF_LABEL[h.type] ?? h.type ?? "—"}</dd>
          <dt className="font-bold text-mu">Status</dt>
          <dd className="font-black uppercase italic tracking-tight">{statusLabel}</dd>
        </dl>

        {h.link && (
          <a
            href={h.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 -skew-x-12 bg-red px-5 py-3 text-sm font-black uppercase italic tracking-tighter text-[#f5f5f5] transition-opacity hover:opacity-90"
          >
            <span className="inline-flex skew-x-12 items-center gap-2">
              <IconGithub width={16} height={16} /> Lihat Kode di GitHub
            </span>
          </a>
        )}

        <h2 className="mb-4 mt-14">
          <Slash tone="r" className="text-xl sm:text-2xl">Teknologi yang Digunakan</Slash>
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="Teknologi">
          {(h.loot ?? []).map((l) => (
            <li
              key={l}
              className="-skew-x-12 border-[3px] border-fg px-3 py-1.5 text-sm font-black uppercase italic tracking-tighter"
            >
              <span className="inline-block skew-x-12">{l}</span>
            </li>
          ))}
        </ul>

        {h.shots?.length > 0 && (
          <>
            <h2 className="mb-4 mt-14">
              <Slash tone="r" className="text-xl sm:text-2xl">Tampilan Aplikasi</Slash>
            </h2>
            <ul className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4">
              {h.shots.map((s, si) => (
                <li key={s.src} className="pj-phone" style={{ rotate: si % 2 ? "1.2deg" : "-1.2deg" }}>
                  <img src={s.src} alt={s.alt} className="block w-full" loading="lazy" />
                  {s.alt && <p className="bg-fg px-2.5 py-2 text-[0.7rem] font-bold leading-snug text-bg">{s.alt}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
