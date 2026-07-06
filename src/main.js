import "@fontsource/anton";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/jetbrains-mono/400.css";
import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { FrameSequence } from "./sequence.js";

gsap.registerPlugin(ScrollTrigger);

/* ================= LENIS SMOOTH SCROLL ================= */
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ================= PRELOADER ================= */
const preloader = document.getElementById("preloader");
const preloaderFill = document.getElementById("preloaderFill");
const preloaderPct = document.getElementById("preloaderPct");
const preloaderLabel = document.getElementById("preloaderLabel");
let pageRevealed = false;

function setLoadProgress(p) {
  const pct = Math.round(p * 100);
  preloaderFill.style.width = `${pct}%`;
  preloaderPct.textContent = `${String(pct).padStart(3, "0")}%`;
  if (p >= 0.4 && !pageRevealed) revealPage();
}

function revealPage() {
  if (pageRevealed) return;
  pageRevealed = true;
  preloaderLabel.textContent = "ORBIT LOCKED";
  setTimeout(() => {
    preloader.classList.add("done");
    heroIntro();
  }, 350);
}

// hard fallback so the page never stays locked
setTimeout(revealPage, 6000);

/* ================= HERO — ORBIT SCRUB ================= */
const canvas = document.getElementById("heroCanvas");
const sequence = new FrameSequence(canvas, { onProgress: setLoadProgress });
sequence.init();

const orbitDeg = document.getElementById("orbitDeg");
const frameReadout = document.getElementById("frameReadout");
const scrollCue = document.getElementById("scrollCue");

ScrollTrigger.create({
  trigger: "#hero",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate(self) {
    sequence.setProgress(self.progress);
    orbitDeg.textContent = String(Math.round(self.progress * 360)).padStart(3, "0");
    frameReadout.textContent = String(
      Math.round(self.progress * Math.max(sequence.count - 1, 359))
    ).padStart(4, "0");
  },
});

/* letter-by-letter split */
function splitChars(el) {
  const chars = el.textContent.split("");
  el.textContent = "";
  return chars.map((c) => {
    const s = document.createElement("span");
    s.className = "char";
    s.innerHTML = c === " " ? "&nbsp;" : c;
    el.appendChild(s);
    return s;
  });
}
const line1Chars = splitChars(document.getElementById("heroLine1"));
const line2Chars = splitChars(document.getElementById("heroLine2"));
gsap.set([...line1Chars, ...line2Chars], { yPercent: 120, rotate: 8, opacity: 0 });

async function heroIntro() {
  await document.fonts.ready;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(line1Chars, {
    yPercent: 0, rotate: 0, opacity: 1,
    duration: 1.3, stagger: 0.055,
  })
    .to(line2Chars, {
      yPercent: 0, rotate: 0, opacity: 1,
      duration: 1.3, stagger: 0.045,
    }, 0.25)
    .fromTo(".hero-name", { letterSpacing: "0.14em" }, {
      letterSpacing: "0.01em", duration: 1.8, ease: "expo.inOut",
    }, 0)
    .to("#heroSub", { opacity: 1, duration: 1.1, ease: "power2.out" }, 1.0);
}

/* scroll-driven hero kinetics: name drifts, cue fades */
gsap.to(".hero-content", {
  yPercent: -14,
  scale: 0.96,
  transformOrigin: "left bottom",
  ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom bottom", scrub: true },
});
gsap.to(scrollCue, {
  opacity: 0,
  ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "8% top", scrub: true },
});

/* ================= STATS COUNT-UP ================= */
document.querySelectorAll(".stat").forEach((stat) => {
  const target = Number(stat.dataset.count);
  const pad = Number(stat.dataset.pad || 0);
  const valueEl = stat.querySelector(".stat-value");
  const state = { v: 0 };
  ScrollTrigger.create({
    trigger: stat,
    start: "top 82%",
    once: true,
    onEnter() {
      gsap.fromTo(stat, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" });
      gsap.to(state, {
        v: target,
        duration: 1.8,
        ease: "power4.out",
        onUpdate() {
          valueEl.textContent = String(Math.round(state.v)).padStart(pad, "0");
        },
      });
    },
  });
});

/* ================= MARQUEE (velocity-reactive) ================= */
const marquee = document.getElementById("marqueeA");
let marqueeX = 0;
gsap.ticker.add((_, dt) => {
  const vel = Math.min(Math.abs(lenis.velocity) * 0.06, 6);
  marqueeX -= (0.06 + vel * 0.03) * dt;
  const width = marquee.scrollWidth / 2;
  if (-marqueeX >= width) marqueeX += width;
  marquee.style.transform = `translate3d(${marqueeX}px,0,0)`;
});

/* ================= PILLARS — one at a time ================= */
const pillars = gsap.utils.toArray(".pillar");
const dots = gsap.utils.toArray(".pillar-dot");
gsap.set(pillars, { opacity: 0, visibility: "hidden" });

ScrollTrigger.create({
  trigger: "#pillars",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate(self) {
    const p = self.progress;
    pillars.forEach((el, i) => {
      const lo = i / 3;
      const hi = (i + 1) / 3;
      const t = (p - lo) / (hi - lo); // local 0..1
      let alpha = 0;
      if (t >= 0 && t <= 1) {
        const fadeIn = Math.min(t / 0.18, 1);
        const fadeOut = i === 2 ? 1 : Math.min((1 - t) / 0.18, 1);
        alpha = Math.max(0, Math.min(fadeIn, fadeOut));
      }
      gsap.set(el, {
        opacity: alpha,
        visibility: alpha > 0.01 ? "visible" : "hidden",
        y: (0.5 - Math.max(0, Math.min(t, 1))) * 60,
      });
      dots[i].classList.toggle("active", p >= lo && p < hi + (i === 2 ? 0.01 : 0));
    });
  },
});

/* ================= LAZY BACKGROUND VIDEOS ================= */
document.querySelectorAll("video[data-src]").forEach((video) => {
  ScrollTrigger.create({
    trigger: video.closest("section"),
    start: "top 150%",
    once: true,
    onEnter() {
      video.src = video.dataset.src;
      video.play().catch(() => {});
    },
  });
});

/* ================= WORK CARDS ================= */
gsap.utils.toArray(".card").forEach((card) => {
  gsap.from(card, {
    y: 90,
    opacity: 0,
    duration: 1.1,
    ease: "power3.out",
    scrollTrigger: { trigger: card, start: "top 88%", once: true },
  });

  const setRX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
  const setRY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    gsap.set(card, { transformPerspective: 900 });
    setRX(-ny * 7);
    setRY(nx * 9);
    card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  });
  card.addEventListener("mouseleave", () => {
    setRX(0);
    setRY(0);
  });
});

/* work heading stroke fill on scroll */
gsap.fromTo(".work-heading",
  { backgroundSize: "0% 100%" },
  {
    backgroundSize: "100% 100%",
    ease: "none",
    scrollTrigger: { trigger: ".work-heading", start: "top 85%", end: "top 30%", scrub: true },
  }
);

/* ================= FINALE LINES ================= */
gsap.utils.toArray(".finale-line > span").forEach((line, i) => {
  gsap.from(line, {
    yPercent: 110,
    ease: "power3.out",
    duration: 1,
    scrollTrigger: {
      trigger: "#finale",
      start: `top ${78 - i * 6}%`,
      end: `top ${44 - i * 6}%`,
      scrub: true,
    },
  });
});

/* refresh after everything settles */
window.addEventListener("load", () => ScrollTrigger.refresh());
