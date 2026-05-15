"use client";

import dynamic from "next/dynamic";

// The 3D scene is a separate chunk, loaded with ssr:false so it never runs
// during static export and only downloads once this page actually mounts.
const PhysicsScene = dynamic(() => import("./PhysicsScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
        Initializing WebGL…
      </span>
    </div>
  ),
});

export function Playground() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
          Playground
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Physics Sandbox
        </h1>
        <p className="mt-3 max-w-xl text-[var(--color-fg-muted)]">
          A real-time rigid-body simulation running entirely in your browser —
          rendered with react-three-fiber and stepped by the Rapier physics
          engine. Drag to orbit; sweep your cursor through the shapes to knock
          them around.
        </p>
      </header>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#0a0c10]">
        <PhysicsScene />
      </div>
    </div>
  );
}
