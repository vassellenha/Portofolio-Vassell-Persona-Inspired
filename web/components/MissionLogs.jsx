"use client";
// Mission Logs: lini masa pengalaman dengan lintasan berkelok. Sebuah van misi melaju di lintasan
// mengikuti scroll; tiap kali melewati pos, log di pos itu terbuka. Progres hanya maju — setelah
// van tiba di tujuan semua log tetap terlihat. Refresh halaman = van kembali ke garis start.
// Tanpa JS / prefers-reduced-motion: semua log langsung terlihat.
import { useEffect, useRef, useState } from "react";
import Slash from "./Slash";
import { IconBriefcase, IconUsers, IconCamera, IconCap, IconStar } from "./Icons";
import { playSfx } from "../lib/sfx";

const XP_ICON = { internship: IconBriefcase, competition: IconStar, photo: IconCamera, org: IconUsers, academic: IconCap };
const XP_KIND = { internship: "Magang", competition: "Kompetisi", photo: "Dokumentasi", org: "Organisasi", academic: "Akademik" };

// Van orisinal (tampak samping, menghadap kanan)
const Van = () => (
  <svg viewBox="0 0 84 52" width="84" height="52" aria-hidden="true" focusable="false">
    <g stroke="#f5f5f5" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M4 38V14c0-3 2-5 5-5h42c3 0 5 1 7 4l8 11 10 3c3 1 4 3 4 6v5H4z" fill="#dc0000" />
      <path d="M48 14h4l8 11H48z" fill="#0b0b0b" />
      <path d="M10 14h14v9H10zM28 14h14v9H28z" fill="#0b0b0b" />
    </g>
    <path d="M4 30h76" stroke="#0b0b0b" strokeWidth="4" />
    <path d="M74 31h5v4h-5z" fill="#ffd400" />
    <g fill="#0b0b0b" stroke="#f5f5f5" strokeWidth="2.5">
      <circle className="ml-wheel" cx="22" cy="40" r="8" />
      <circle className="ml-wheel" cx="62" cy="40" r="8" />
    </g>
    <g fill="#f5f5f5">
      <circle cx="22" cy="40" r="2.5" />
      <circle cx="62" cy="40" r="2.5" />
    </g>
  </svg>
);

export default function MissionLogs({ items }) {
  const n = items.length;
  const listRef = useRef(null);
  const roadRef = useRef(null);
  const dashRef = useRef(null);
  const doneRef = useRef(null);
  const vanRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(-1); // indeks log terakhir yang sudah terbuka
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const list = listRef.current;
    const road = roadRef.current;
    if (!list || !road || !road.getTotalLength) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // semua log langsung terlihat
    setArmed(true);

    const G = { total: 0, nodes: [], y0: 0, y1: 0, ready: false };
    let cur = 0; // panjang lintasan yang sudah ditempuh (px)
    let target = 0;
    let opened = -1;
    let done = false;
    let face = 1;
    let raf = 0;
    let last = 0;
    let visible = false;

    // panjang lintasan pada ketinggian y (lintasan selalu turun -> cari biner)
    const lenAtY = (y) => {
      let lo = 0;
      let hi = G.total;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (road.getPointAtLength(mid).y < y) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    function build() {
      const box = list.getBoundingClientRect();
      const stamps = [...list.querySelectorAll(".wx-date")];
      if (!stamps.length || !box.width) return;
      const pts = stamps.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
      });
      const cx = pts[0][0];
      const amp = Math.max(18, Math.min(96, cx - 16, box.width - cx - 16)); // seberapa lebar kelokannya
      const H = list.offsetHeight;
      const S = [cx, Math.max(8, pts[0][1] - 96)];
      const E = [cx, Math.min(H - 30, pts[pts.length - 1][1] + 150)];
      const all = [S, ...pts, E];
      let d = `M${S[0].toFixed(1)} ${S[1].toFixed(1)}`;
      for (let i = 0; i < all.length - 1; i++) {
        const p = all[i];
        const q = all[i + 1];
        const dy = q[1] - p[1];
        const side = i % 2 ? -1 : 1;
        const k = i === 0 || i === all.length - 2 ? 0.55 : 1; // ruas awal & akhir lebih kalem
        d += `C${(p[0] + side * amp * k).toFixed(1)} ${(p[1] + dy * 0.36).toFixed(1)} ${(q[0] + side * amp * k).toFixed(1)} ${(q[1] - dy * 0.36).toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      }
      const svg = road.ownerSVGElement;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${H}`);
      svg.style.height = `${H}px`;
      [road, dashRef.current, doneRef.current].forEach((p) => p?.setAttribute("d", d));
      const keep = G.total ? cur / G.total : 0;
      G.total = road.getTotalLength();
      G.y0 = S[1];
      G.y1 = E[1];
      G.nodes = pts.map((p) => lenAtY(p[1]));
      G.ready = true;
      cur = keep * G.total;
      target = Math.max(target, cur);
      if (doneRef.current) doneRef.current.style.strokeDasharray = `${G.total} ${G.total}`;
      if (startRef.current) startRef.current.style.transform = `translate(${S[0]}px, ${S[1]}px)`;
      if (endRef.current) endRef.current.style.transform = `translate(${E[0]}px, ${E[1]}px)`;
      place();
    }

    function place() {
      if (!G.ready) return;
      const p = road.getPointAtLength(cur);
      const q = road.getPointAtLength(Math.min(G.total, cur + 6));
      const dx = q.x - p.x;
      if (Math.abs(dx) > 0.25) face = dx > 0 ? 1 : -1;
      const tilt = Math.max(-16, Math.min(16, (q.y - p.y) * 2.2)) * face;
      const van = vanRef.current;
      if (van) {
        van.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        van.firstElementChild.style.transform = `translate(-50%, -78%) scaleX(${face}) rotate(${tilt.toFixed(1)}deg)`;
      }
      if (doneRef.current) doneRef.current.style.strokeDashoffset = `${G.total - cur}`;
    }

    function tick(now) {
      raf = 0;
      if (!G.ready) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      // titik acuan: 58% tinggi layar. Van mengejar titik itu, tapi tidak pernah mundur.
      const box = list.getBoundingClientRect();
      const y = window.innerHeight * 0.58 - box.top;
      if (y > G.y0) target = Math.max(target, y >= G.y1 || box.bottom <= window.innerHeight * 0.92 ? G.total : lenAtY(y));
      const gap = target - cur;
      const moving = gap > 0.5;
      if (moving) {
        const speed = Math.max(140, Math.min(1500, gap * 2.6)); // px/detik: ngebut kalau tertinggal jauh
        cur = Math.min(target, cur + speed * dt);
        place();
        let k = opened;
        while (k + 1 < G.nodes.length && cur >= G.nodes[k + 1] - 4) k++;
        if (k !== opened) {
          opened = k;
          setShown(k);
          playSfx("flip");
        }
        if (!done && cur >= G.total - 1) {
          done = true;
          setArrived(true);
          playSfx("rankup");
        }
      }
      vanRef.current?.classList.toggle("is-moving", moving);
      if (visible && (moving || !done)) raf = requestAnimationFrame(tick);
    }
    const kick = () => {
      if (!raf && visible) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        kick();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(list);
    const ro = new ResizeObserver(() => {
      build();
      kick();
    });
    ro.observe(list);
    // setelah armed, tata letak bisa bergeser satu frame -> bangun ulang
    const t = setTimeout(build, 60);
    window.addEventListener("scroll", kick, { passive: true });
    return () => {
      clearTimeout(t);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      cancelAnimationFrame(raf);
    };
  }, [n]);

  const open = armed ? shown + 1 : n;

  return (
    <div className="ml">
      <div className="mb-8 mt-14 flex flex-wrap items-end gap-x-4 gap-y-2">
        <h3>
          <Slash tone="r" className="text-2xl sm:text-3xl">Mission Logs</Slash>
        </h3>
        <p className="text-xs font-black uppercase italic tracking-tighter text-mu" aria-live="polite">
          <span className="text-rt">
            {open}/{n}
          </span>{" "}
          log terbuka{armed && !arrived ? " — scroll, van misi membuka sisanya" : ""}
        </p>
      </div>

      <ol ref={listRef} className={`wx ${armed ? "is-armed" : ""} ${arrived ? "is-done" : ""}`} aria-label="Mission logs, terbaru di atas">
        <li className="ml-layer" aria-hidden="true" role="presentation">
          <svg className="ml-road" preserveAspectRatio="none" focusable="false">
            <path ref={roadRef} className="ml-asphalt" fill="none" />
            <path ref={doneRef} className="ml-done" fill="none" />
            <path ref={dashRef} className="ml-dash" fill="none" />
          </svg>
          <span ref={startRef} className="ml-pin ml-start">
            <b>Start</b>
          </span>
          <span ref={endRef} className="ml-pin ml-goal">
            <i />
            <b>{arrived ? "Mission complete" : "Tujuan"}</b>
          </span>
          <span ref={vanRef} className="ml-van">
            <span className="ml-van-in">
              <Van />
            </span>
          </span>
        </li>

        {items.map((e, i) => {
          const Icon = XP_ICON[e.kind] ?? IconBriefcase;
          const no = String(i + 1).padStart(2, "0");
          const on = !armed || i <= shown;
          return (
            <li key={i} className={`wx-row ${i % 2 ? "is-alt" : ""} ${on ? "is-shown" : ""}`}>
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
                      <span className="inline-block skew-x-12">
                        Log {no} · {XP_KIND[e.kind] ?? "Misi"}
                      </span>
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
    </div>
  );
}
