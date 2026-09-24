"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * One Lenis instance for the whole site, mounted in app/layout.tsx.
 *
 * It has to be exactly one: Lenis drives the real document scroll, so two instances fight each other
 * for the same scrollTop and the page stutters. ScrollStack used to create its own on the home page —
 * it now reads this one through useLenis(), and every other page gets smooth scrolling for free.
 *
 * Can return null (see RESPECT_REDUCED_MOTION below); consumers fall back to native scroll events,
 * which keep firing either way because Lenis scrolls the document for real.
 */
const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

/** Matches html{scroll-padding-top:100px} in globals.css: clears the sticky navigation bar. */
const ANCHOR_OFFSET = -100;

/**
 * Whether to switch smooth scrolling off for visitors whose OS asks for reduced motion.
 *
 * Off, deliberately. On Windows this media query follows "Animation effects" in Settings, which every
 * performance guide — and Velyro Optimizer itself — tells people to turn off. Honouring it here would
 * silently disable smooth scrolling for a large part of this site's actual audience, and the home page
 * never honoured it either (ScrollStack's old Lenis had no such check).
 *
 * Flip this to true if you would rather follow the OS: smooth scrolling is a known vestibular trigger,
 * and everything on the site keeps working without it — Lenis scrolls the document for real, so the
 * scroll listeners and IntersectionObservers fire the same either way.
 *
 * It governs the CSS animations too: when it is on and the OS asks for reduced motion, <html> gets
 * data-motion="calm" and globals.css collapses every animation to a single frame.
 */
const RESPECT_REDUCED_MOTION = false;

const wantsCalm = () =>
  RESPECT_REDUCED_MOTION && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** Anchor navigation that works with or without Lenis, for the few places that scroll on click. */
export function scrollToTarget(lenis: Lenis | null, target: HTMLElement | string) {
  const element =
    typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target;
  if (!element) return;
  if (lenis) lenis.scrollTo(element, { offset: ANCHOR_OFFSET });
  else element.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (wantsCalm()) {
      // layout.tsx renders data-motion="full", so nothing animates before this point either way.
      document.documentElement.setAttribute("data-motion", "calm");
      return;
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
      // Lenis intercepts in-page #links itself, so every anchor on the site eases instead of jumping.
      anchors: { offset: ANCHOR_OFFSET },
    });

    let frame = requestAnimationFrame(function raf(time: number) {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    });

    setLenis(instance);
    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // A new page starts at the top. Skipped on the first render and whenever the URL carries a hash,
  // so landing on /#pricing still lands on the pricing section.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!lenis || window.location.hash) return;
    lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  // Radix dialogs lock the page by putting data-scroll-locked on <body>. Lenis keeps animating its own
  // scroll position regardless, so without this the page creeps along behind an open modal.
  useEffect(() => {
    if (!lenis) return;
    const sync = () => {
      if (document.body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => observer.disconnect();
  }, [lenis]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
