"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

// The 3D name is its own client-only chunk (three.js + Rapier, ~900KB). It
// stays off the home page's initial JS — only fetched at runtime, once the
// static heading below has already painted.
const HeroNameScene = dynamic(() => import("./HeroNameScene"), { ssr: false });

export function HeroName() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    // Respect reduced-motion: keep the plain heading, never fetch the 3D chunk.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    // Let the static heading paint first (two frames), then load the 3D chunk
    // straight away — it stays a separate chunk, but the visible-text window
    // is kept as short as the download allows.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!cancelled) setMounted(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div className="relative flex h-24 items-center sm:h-32">
      {/* Real heading: instant paint, the LCP element, and what crawlers and
          screen readers use. Stays in the DOM and accessible once the 3D name
          takes over — it just crossfades out under the canvas. */}
      <h1
        className={`text-3xl font-semibold tracking-tight transition-opacity duration-500 sm:text-4xl ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        Hyoungseo Son
      </h1>

      {mounted && (
        // Transparent canvas — the letters sit directly on the page.
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeroNameScene onReady={handleReady} />
        </div>
      )}
    </div>
  );
}
