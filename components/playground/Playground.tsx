"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Each 3D scene is its own chunk, loaded with ssr:false so nothing runs
// during static export and the bundle only downloads on this page.
const sceneLoader = (label: string) => () => (
  <div className="flex h-full w-full items-center justify-center">
    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
      {label}
    </span>
  </div>
);

const PhysicsScene = dynamic(() => import("./PhysicsScene"), {
  ssr: false,
  loading: sceneLoader("Initializing WebGL…"),
});

const RaceScene = dynamic(() => import("./RaceScene"), {
  ssr: false,
  loading: sceneLoader("Loading track…"),
});

const NbodyScene = dynamic(() => import("./NbodyScene"), {
  ssr: false,
  loading: sceneLoader("Summoning gravity…"),
});

export function Playground() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
          Playground
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Real-time 3D
        </h1>
        <p className="mt-3 max-w-xl text-[var(--color-fg-muted)]">
          A couple of things I built for the fun of it, running live in your
          browser.
        </p>
      </header>

      <Experiment
        title="Three-Body Problem"
        description="Three suns and a lone planet, bound only by gravity — a chaotic four-body dance."
      >
        <NbodyScene />
      </Experiment>

      <Experiment
        title="Physics Sandbox"
        description="The letters of my name, dropped in as real-time rigid bodies — react-three-fiber + Rapier."
      >
        <PhysicsScene />
      </Experiment>

      <Experiment
        title="Arcade Circuit"
        description="A 3D racer — WASD or arrows, touch on mobile. Chase your best lap."
      >
        <RaceScene />
      </Experiment>
    </div>
  );
}

// A titled card. The 3D scene inside is mounted only once the card nears the
// viewport, so a second heavy WebGL context isn't created until it's needed.
function Experiment({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="mb-14 last:mb-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-[var(--color-fg-muted)]">
        {description}
      </p>
      <div
        ref={card}
        className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#0a0c10]"
      >
        {show && children}
      </div>
    </section>
  );
}
