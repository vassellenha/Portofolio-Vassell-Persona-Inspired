"use client";
// Transisi antarhalaman (tanpa reload, jadi musik tetap jalan):
//  - a[data-nav="dagger"] : belati menancap di titik klik, tinta merah menyebar menutup layar, lalu pindah halaman.
//  - a[data-nav="wipe"]   : sapuan merah-hitam menutup layar, lalu pindah halaman (langsung ke anchor tujuan, tanpa scroll).
// Setelah halaman baru siap, penutup disapu keluar. Elemen dibuat langsung di DOM (bukan state React).
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { playSfx } from "../lib/sfx";

const DAGGER = `<svg viewBox="0 0 60 220" width="60" height="220" aria-hidden="true">
  <g stroke="#0b0b0b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="30" cy="16" r="11" fill="#f5f5f5"/>
    <path d="M23 26h14l-2 58H25z" fill="#f5f5f5"/>
    <path d="M24 38l12 7M24 50l12 7M24 62l12 7M25 74l10 6" fill="none" stroke-width="3"/>
    <path d="M4 80c8-6 16 4 26 4s18-10 26-4c-3 9-12 14-26 14S7 89 4 80z" fill="#f5f5f5"/>
    <path d="M21 94h18l-9 124z" fill="#f5f5f5"/>
    <path d="M30 98v104" fill="none" stroke-width="2.5"/>
  </g>
</svg>`;

function blob(seed) {
  // percikan tinta tak beraturan (pusat 0,0, radius ~60)
  let s = seed;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const n = 16;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rad = i % 2 ? 38 + r() * 10 : 52 + r() * 30;
    return [Math.cos(a) * rad, Math.sin(a) * rad];
  });
  let d = "";
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    d += i ? `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}` : `M${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  });
  const p0 = pts[0];
  const p1 = pts[1];
  d += `Q${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${((p0[0] + p1[0]) / 2).toFixed(1)} ${((p0[1] + p1[1]) / 2).toFixed(1)}Z`;
  const drops = Array.from({ length: 9 }, () => {
    const a = r() * Math.PI * 2;
    const dist = 95 + r() * 90;
    return `<circle cx="${(Math.cos(a) * dist).toFixed(1)}" cy="${(Math.sin(a) * dist).toFixed(1)}" r="${(4 + r() * 11).toFixed(1)}"/>`;
  }).join("");
  return `<svg class="nf-splat" viewBox="-200 -200 400 400" width="400" height="400" aria-hidden="true"><g fill="#dc0000"><path d="${d}"/>${drops}</g></svg>`;
}

export default function NavFx() {
  const router = useRouter();
  const pathname = usePathname();
  const st = useRef({ el: null, hash: "", pending: false, timer: 0 });

  // buka penutup setelah rute berganti
  function reveal() {
    const s = st.current;
    const el = s.el;
    clearTimeout(s.timer);
    s.pending = false;
    if (!el) return;
    s.el = null;
    const root = document.documentElement;
    const jump = () => {
      const target = s.hash && document.getElementById(s.hash);
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
      else window.scrollTo({ top: 0, behavior: "instant" });
    };
    root.style.scrollBehavior = "auto";
    jump();
    requestAnimationFrame(() => {
      jump();
      setTimeout(() => {
        jump();
        root.style.scrollBehavior = "";
        el.classList.add("nf-out");
        setTimeout(() => el.remove(), 700);
      }, 120);
    });
  }

  useEffect(() => {
    if (st.current.pending) reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const s = st.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function go(href, delay) {
      const url = new URL(href, location.href);
      s.hash = url.hash.slice(1);
      s.pending = true;
      const same = url.pathname === location.pathname;
      setTimeout(() => {
        router.push(url.pathname + url.search + url.hash, { scroll: false });
        if (same) setTimeout(reveal, 80);
        s.timer = setTimeout(reveal, 5000); // jaring pengaman
      }, delay);
    }

    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[data-nav]");
      if (!a || a.target === "_blank" || s.pending || s.el) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      e.preventDefault();
      if (reduce.matches) {
        s.el = null;
        router.push(url.pathname + url.search + url.hash);
        return;
      }
      const kind = a.dataset.nav;
      const box = a.getBoundingClientRect();
      const x = e.clientX || box.left + box.width / 2;
      const y = e.clientY || box.top + box.height / 2;
      const el = document.createElement("div");
      el.className = `navfx nf-${kind}`;
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.innerHTML = `<i class="nf-k"></i><i class="nf-r"></i>`;
      document.body.appendChild(el);
      s.el = el;

      if (kind === "dagger") {
        const D = Math.hypot(innerWidth, innerHeight);
        el.insertAdjacentHTML("beforeend", blob((x * 31 + y * 17) | 1) + `<span class="nf-blade">${DAGGER}</span>`);
        const splat = el.querySelector(".nf-splat");
        const dagger = el.querySelector(".nf-blade");
        const ROT = 32;
        const rad = (ROT * Math.PI) / 180;
        const far = D * 0.9;
        dagger.animate(
          [
            { transform: `translate(${Math.sin(rad) * far}px, ${-Math.cos(rad) * far}px) rotate(${ROT}deg)` },
            { transform: `translate(0,0) rotate(${ROT}deg)`, offset: 0.55 },
            { transform: `translate(0,0) rotate(${ROT - 7}deg)`, offset: 0.7 },
            { transform: `translate(0,0) rotate(${ROT + 4}deg)`, offset: 0.85 },
            { transform: `translate(0,0) rotate(${ROT}deg)` },
          ],
          { duration: 330, easing: "cubic-bezier(.5,0,.9,.4)", fill: "both" }
        );
        const card = a.closest(".pj");
        setTimeout(() => {
          playSfx("hit");
          card?.classList.add("pj-hit");
          setTimeout(() => card?.classList.remove("pj-hit"), 400);
        }, 180);
        const S = (D / 36) * 1.15;
        splat.animate(
          [
            { transform: "scale(0) rotate(0deg)" },
            { transform: "scale(0) rotate(0deg)", offset: 0.2 },
            { transform: "scale(1.15) rotate(8deg)", offset: 0.32 },
            { transform: "scale(1) rotate(10deg)", offset: 0.5 },
            { transform: `scale(${S}) rotate(40deg)` },
          ],
          { duration: 900, easing: "cubic-bezier(.6,0,.4,1)", fill: "both" }
        );
        dagger.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: 700, fill: "both" });
        go(a.href, 880);
      } else {
        go(a.href, 480);
      }
    }
    // kembali lewat tombol Back browser (bfcache): jangan sampai penutup tertinggal
    const onShow = (e) => {
      if (e.persisted) {
        document.querySelectorAll(".navfx").forEach((n) => n.remove());
        s.el = null;
        s.pending = false;
      }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return null;
}
