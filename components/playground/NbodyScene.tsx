"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ---- Simulation constants ----
const G = 9.5; // gravitational constant (tuned for this scale)
const SOFT = 0.6; // softening length — avoids singular close encounters
const H = 0.0016; // FIXED integration substep → the run is deterministic
const BASE_SUBSTEPS = 6; // substeps per frame at play speed 1
const TRAIL_EVERY = 4; // record a trail point every N substeps
const MAX_TRAIL = 30000; // trail points kept per body (a whole run)
const BOUND = 52; // reseed once a body is flung past this radius
const MAX_AGE = 180; // sim-time before an auto-reseed

// Three suns and a lone planet — the chaotic four-body system.
const BODY_DEFS = [
  { star: true, color: "#ff7a3c", radius: 0.85 },
  { star: true, color: "#ffd24a", radius: 0.8 },
  { star: true, color: "#9fd2ff", radius: 0.78 },
  { star: false, color: "#5fa8d8", radius: 0.34 },
];
// Fixed, unequal masses + heights break the symmetry, so the dance is
// chaotic — yet fully determined by the sliders, never random.
const STAR_MASS = [1.0, 1.25, 0.78];
const STAR_Y = [0, 1.2, -1.0];

type Params = {
  radius: number; // ring the three stars start on
  starSpeed: number; // their initial tangential speed
  planetSpeed: number; // the planet's initial speed
  playSpeed: number; // simulation rate (0 = paused)
};

const DEFAULTS: Params = {
  radius: 4.7,
  starSpeed: 0.75,
  planetSpeed: 0.45,
  playSpeed: 3,
};

type Body = { pos: THREE.Vector3; vel: THREE.Vector3; mass: number };

// Deterministic initial conditions — a pure function of the slider params.
function seed(p: Params): Body[] {
  const bodies: Body[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const pos = new THREE.Vector3(
      Math.cos(a) * p.radius,
      STAR_Y[i],
      Math.sin(a) * p.radius,
    );
    const vel = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(
      p.starSpeed,
    );
    bodies.push({ pos, vel, mass: STAR_MASS[i] });
  }
  bodies.push({
    pos: bodies[0].pos.clone().add(new THREE.Vector3(2.4, 0.4, 0)),
    vel: bodies[0].vel.clone().add(new THREE.Vector3(0, 0, p.planetSpeed)),
    mass: 0.012,
  });

  // Remove centre-of-mass position & velocity, so the system stays framed.
  const M = bodies.reduce((s, b) => s + b.mass, 0);
  const cv = new THREE.Vector3();
  const cp = new THREE.Vector3();
  for (const b of bodies) {
    cv.addScaledVector(b.vel, b.mass);
    cp.addScaledVector(b.pos, b.mass);
  }
  cv.divideScalar(M);
  cp.divideScalar(M);
  for (const b of bodies) {
    b.vel.sub(cv);
    b.pos.sub(cp);
  }
  return bodies;
}

// A trail line that grows for the whole run — the full path stays drawn.
function makeTrail(hex: string): THREE.Line {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(MAX_TRAIL * 3), 3),
  );
  g.setDrawRange(0, 0);
  const m = new THREE.LineBasicMaterial({
    color: hex,
    transparent: true,
    opacity: 0.62,
  });
  const line = new THREE.Line(g, m);
  line.frustumCulled = false; // the path roams; never cull it
  return line;
}

// A static backdrop of distant stars (decorative — not part of the sim).
function makeStarfield(): THREE.Points {
  const n = 700;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(120 + Math.random() * 120);
    pos[i * 3] = v.x;
    pos[i * 3 + 1] = v.y;
    pos[i * 3 + 2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    color: "#cdd6e6",
    size: 0.7,
    sizeAttenuation: true,
  });
  return new THREE.Points(g, m);
}

// Integrates the gravitational N-body system with a fixed timestep, so the
// trajectory depends only on the initial conditions — never on frame timing.
function Sim({
  bodies,
  paramsRef,
  meshRefs,
  trails,
  api,
}: {
  bodies: React.RefObject<Body[]>;
  paramsRef: React.RefObject<Params>;
  meshRefs: React.RefObject<(THREE.Mesh | null)[]>;
  trails: THREE.Line[];
  api: React.RefObject<{ reset: () => void } | null>;
}) {
  const acc = useMemo(() => BODY_DEFS.map(() => new THREE.Vector3()), []);
  const trailN = useRef<number[]>([0, 0, 0, 0]);
  const sub = useRef(0);
  const age = useRef(0);

  useEffect(() => {
    api.current = {
      reset: () => {
        bodies.current = seed(paramsRef.current);
        trailN.current = [0, 0, 0, 0];
        sub.current = 0;
        age.current = 0;
        for (const t of trails) t.geometry.setDrawRange(0, 0);
      },
    };
    return () => {
      api.current = null;
    };
  }, [api, bodies, paramsRef, trails]);

  useFrame(() => {
    const steps = Math.round(BASE_SUBSTEPS * paramsRef.current.playSpeed);
    if (steps <= 0) return; // paused
    const bs = bodies.current;
    const counts = trailN.current;

    for (let step = 0; step < steps; step++) {
      for (let i = 0; i < bs.length; i++) acc[i].set(0, 0, 0);
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const dx = bs[j].pos.x - bs[i].pos.x;
          const dy = bs[j].pos.y - bs[i].pos.y;
          const dz = bs[j].pos.z - bs[i].pos.z;
          const r2 = dx * dx + dy * dy + dz * dz + SOFT * SOFT;
          const inv = G / (r2 * Math.sqrt(r2)); // 1/r³ with softening
          const fi = inv * bs[j].mass;
          const fj = inv * bs[i].mass;
          acc[i].x += dx * fi;
          acc[i].y += dy * fi;
          acc[i].z += dz * fi;
          acc[j].x -= dx * fj;
          acc[j].y -= dy * fj;
          acc[j].z -= dz * fj;
        }
      }
      for (let i = 0; i < bs.length; i++) {
        bs[i].vel.addScaledVector(acc[i], H);
        bs[i].pos.addScaledVector(bs[i].vel, H);
      }
      // Append to the permanent trail every few substeps.
      if (++sub.current >= TRAIL_EVERY) {
        sub.current = 0;
        for (let i = 0; i < bs.length; i++) {
          const c = counts[i];
          if (c < MAX_TRAIL) {
            const arr = trails[i].geometry.attributes.position
              .array as Float32Array;
            arr[c * 3] = bs[i].pos.x;
            arr[c * 3 + 1] = bs[i].pos.y;
            arr[c * 3 + 2] = bs[i].pos.z;
            counts[i] = c + 1;
          }
        }
      }
    }

    for (let i = 0; i < bs.length; i++) {
      meshRefs.current[i]?.position.copy(bs[i].pos);
      const g = trails[i].geometry;
      g.setDrawRange(0, counts[i]);
      g.attributes.position.needsUpdate = true;
    }

    age.current += steps * H;
    const dispersed = bs.some((b) => b.pos.length() > BOUND);
    if (dispersed || age.current > MAX_AGE) api.current?.reset();
  });

  return null;
}

// The slider panel — initial conditions plus the play-speed control.
function Controls({
  params,
  onChange,
}: {
  params: Params;
  onChange: (key: keyof Params, value: number) => void;
}) {
  const sliders: [keyof Params, string, string, number, number, number][] = [
    ["radius", "Radius", "ring the 3 stars start on", 1.5, 9, 0.05],
    ["starSpeed", "Star speed", "the stars' initial speed", 0, 1.6, 0.01],
    ["planetSpeed", "Planet speed", "the planet's initial speed", 0, 1, 0.01],
    ["playSpeed", "Play speed", "simulation playback rate", 0, 6, 0.05],
  ];
  return (
    <div className="absolute left-3 top-3 flex w-44 flex-col gap-3 rounded-lg border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
      {sliders.map(([key, label, desc, min, max, step]) => (
        <div key={key}>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/80">
              {label}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-[#4FC3F7]">
              {params[key].toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) => onChange(key, parseFloat(e.target.value))}
            className="mt-1 h-1 w-full cursor-pointer accent-[#4FC3F7]"
          />
          <p className="mt-0.5 font-mono text-[8px] leading-tight text-white/35">
            {desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function NbodyScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<Params>({ ...DEFAULTS });
  const bodies = useRef<Body[]>(seed(paramsRef.current));
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const api = useRef<{ reset: () => void } | null>(null);
  const [params, setParams] = useState<Params>(paramsRef.current);
  const [running, setRunning] = useState(true);

  const trails = useMemo(() => BODY_DEFS.map((d) => makeTrail(d.color)), []);
  const starfield = useMemo(makeStarfield, []);

  const [env] = useState(() => ({
    lowPerf: window.matchMedia("(max-width: 768px)").matches,
  }));

  // An initial-condition change reseeds; play-speed just changes the rate.
  const onParam = useCallback((key: keyof Params, value: number) => {
    paramsRef.current = { ...paramsRef.current, [key]: value };
    setParams(paramsRef.current);
    if (key !== "playSpeed") api.current?.reset();
  }, []);

  useEffect(() => {
    return () => {
      for (const t of trails) {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
      }
      starfield.geometry.dispose();
      (starfield.material as THREE.Material).dispose();
    };
  }, [trails, starfield]);

  // Pause the render loop when the tab is hidden or the canvas scrolls away.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let tabVisible = document.visibilityState === "visible";
    let onScreen = true;
    const sync = () => setRunning(tabVisible && onScreen);
    const onVis = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.04 },
    );
    io.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={env.lowPerf ? [1, 1.5] : [1, 1.75]}
        frameloop={running ? "always" : "never"}
        camera={{ position: [0, 16, 38], fov: 45, near: 0.5, far: 600 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[14, 16, 10]} intensity={1.5} />

        <primitive object={starfield} />

        <Sim
          bodies={bodies}
          paramsRef={paramsRef}
          meshRefs={meshRefs}
          trails={trails}
          api={api}
        />

        {BODY_DEFS.map((d, i) => (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={bodies.current[i].pos.toArray()}
          >
            <sphereGeometry args={[d.radius, 28, 20]} />
            <meshStandardMaterial
              color={d.color}
              emissive={d.color}
              emissiveIntensity={d.star ? 1.7 : 0.3}
              roughness={d.star ? 0.4 : 0.6}
            />
          </mesh>
        ))}

        {trails.map((t, i) => (
          <primitive key={i} object={t} />
        ))}

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={12}
          maxDistance={90}
        />
      </Canvas>

      <Controls params={params} onChange={onParam} />

      <button
        type="button"
        onClick={() => api.current?.reset()}
        className="absolute right-3 top-3 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        Restart
      </button>
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
        Drag to orbit · deterministic
      </p>
    </div>
  );
}
