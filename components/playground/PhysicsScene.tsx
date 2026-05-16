"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// --- Scene constants (world units) ---
const BOX = { w: 15.5, h: 6, d: 4 } as const;
const FLOOR_Y = -1;
const WALL = 1;

const NAME = "HYOUNGSEO SON";
const SLOT = 1.2; // horizontal advance per character
const LETTER_SIZE = 1;
const LETTER_DEPTH = 0.5;
const FONT_URL = "/fonts/helvetiker_bold.typeface.json";

const PALETTE = ["#4FC3F7", "#29B6F6", "#0288D1", "#81D4FA", "#F6B852"];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

type LetterSpec = {
  id: number;
  geometry: THREE.BufferGeometry;
  half: [number, number, number];
  slotX: number;
};

// Build one centered extruded geometry per character, with its half-extents.
function useLetters(): LetterSpec[] {
  const font = useLoader(FontLoader, FONT_URL) as Font;
  return useMemo(() => {
    const specs: LetterSpec[] = [];
    const size = new THREE.Vector3();
    for (let i = 0; i < NAME.length; i++) {
      const char = NAME[i];
      if (char === " ") continue;
      const geometry = new TextGeometry(char, {
        font,
        size: LETTER_SIZE,
        depth: LETTER_DEPTH,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 2,
      });
      geometry.center();
      geometry.computeBoundingBox();
      geometry.boundingBox!.getSize(size);
      specs.push({
        id: i,
        geometry,
        half: [size.x / 2, size.y / 2, size.z / 2],
        slotX: (i - (NAME.length - 1) / 2) * SLOT,
      });
    }
    return specs;
  }, [font]);
}

type Filler = {
  id: number;
  r: number;
  color: string;
  position: [number, number, number];
};

function makeFillers(): Filler[] {
  const arr: Filler[] = [];
  for (let i = 0; i < 7; i++) {
    arr.push({
      id: i,
      r: rand(0.3, 0.5),
      color: pick(PALETTE),
      position: [
        rand(-BOX.w / 2 + 1.5, BOX.w / 2 - 1.5),
        rand(2, 4),
        rand(-1, 1),
      ],
    });
  }
  return arr;
}

// Name letters fall straight into their slots; rotation is locked so they
// always land upright and stay readable. A few loose spheres add some life.
function Bodies({
  api,
}: {
  api: React.RefObject<{ shake: () => void } | null>;
}) {
  const letters = useLetters();
  const fillers = useMemo(makeFillers, []);
  const refs = useRef<(RapierRigidBody | null)[]>([]);

  useEffect(() => {
    return () => {
      for (const l of letters) l.geometry.dispose();
    };
  }, [letters]);

  useEffect(() => {
    api.current = {
      shake: () => {
        for (const rb of refs.current) {
          if (!rb) continue;
          rb.applyImpulse(
            { x: rand(-3.5, 3.5), y: rand(2.5, 6), z: rand(-3, 3) },
            true,
          );
          rb.applyTorqueImpulse(
            { x: rand(-2, 2), y: rand(-2, 2), z: rand(-2, 2) },
            true,
          );
        }
      },
    };
    return () => {
      api.current = null;
    };
  }, [api]);

  return (
    <>
      {letters.map((l, i) => {
        const restY = FLOOR_Y + l.half[1] + 0.05;
        const spawnY = restY + 3.2 + i * 0.12; // drop height + left-to-right cascade
        return (
          <RigidBody
            key={l.id}
            ref={(rb) => {
              refs.current[i] = rb;
            }}
            colliders={false}
            lockRotations
            ccd
            position={[l.slotX, spawnY, 0]}
            restitution={0.1}
            friction={1}
            linearDamping={0.3}
          >
            <CuboidCollider args={l.half} />
            <mesh geometry={l.geometry} castShadow receiveShadow>
              <meshStandardMaterial
                color="#5BC8F7"
                emissive="#4FC3F7"
                emissiveIntensity={0.12}
                roughness={0.34}
                metalness={0.3}
              />
            </mesh>
          </RigidBody>
        );
      })}

      {fillers.map((f, j) => (
        <RigidBody
          key={f.id}
          ref={(rb) => {
            refs.current[letters.length + j] = rb;
          }}
          colliders="ball"
          ccd
          position={f.position}
          restitution={0.6}
          friction={0.5}
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[f.r, 24, 18]} />
            <meshStandardMaterial
              color={f.color}
              roughness={0.3}
              metalness={0.25}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

// Fixed colliders forming a closed box, plus a visible floor and back panel.
function Walls() {
  const hw = BOX.w / 2;
  const hd = BOX.d / 2;
  const hh = BOX.h / 2;
  const t = WALL / 2;
  const ceil = FLOOR_Y + BOX.h;
  const midY = FLOOR_Y + hh;

  return (
    <>
      <RigidBody type="fixed" restitution={0.2} friction={0.8}>
        <CuboidCollider args={[hw, t, hd]} position={[0, FLOOR_Y - t, 0]} />
        <CuboidCollider args={[hw, t, hd]} position={[0, ceil + t, 0]} />
        <CuboidCollider args={[t, hh, hd]} position={[-hw - t, midY, 0]} />
        <CuboidCollider args={[t, hh, hd]} position={[hw + t, midY, 0]} />
        <CuboidCollider args={[hw, hh, t]} position={[0, midY, -hd - t]} />
        <CuboidCollider args={[hw, hh, t]} position={[0, midY, hd + t]} />
      </RigidBody>

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0]}>
        <planeGeometry args={[BOX.w, BOX.d]} />
        <meshStandardMaterial color="#10141c" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh receiveShadow position={[0, midY, -hd]}>
        <planeGeometry args={[BOX.w, BOX.h]} />
        <meshStandardMaterial color="#0c1016" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

// A kinematic sphere that tracks the cursor and shoves the bodies (desktop).
function Pointer() {
  const body = useRef<RapierRigidBody>(null);
  const camera = useThree((s) => s.camera);
  const pointer = useThree((s) => s.pointer);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const rb = body.current;
    if (!rb) return;
    ray.setFromCamera(pointer, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return;
    rb.setNextKinematicTranslation({
      x: clamp(hit.x, -BOX.w / 2 + 1, BOX.w / 2 - 1),
      y: clamp(hit.y, FLOOR_Y + 1, FLOOR_Y + BOX.h - 1),
      z: 0,
    });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders="ball" ccd>
      <mesh>
        <sphereGeometry args={[0.8, 32, 24]} />
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#4FC3F7"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0}
        />
      </mesh>
    </RigidBody>
  );
}

export default function PhysicsScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const api = useRef<{ shake: () => void } | null>(null);
  const [running, setRunning] = useState(true);
  const [epoch, setEpoch] = useState(0);

  // Touch devices skip the cursor body; low-power devices skip shadows.
  const [env] = useState(() => ({
    touch: window.matchMedia("(hover: none)").matches,
    lowPerf: window.matchMedia("(max-width: 768px)").matches,
  }));

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
        shadows={!env.lowPerf}
        dpr={env.lowPerf ? [1, 1.5] : [1, 1.75]}
        frameloop={running ? "always" : "never"}
        camera={{ position: [0, 1, 18], fov: 38 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0c10"]} />
        <fog attach="fog" args={["#0a0c10", 22, 44]} />

        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow={!env.lowPerf}
          position={[9, 16, 12]}
          intensity={2.6}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <directionalLight
          position={[-9, 5, -6]}
          intensity={0.6}
          color="#4FC3F7"
        />

        <Suspense fallback={null}>
          <Physics gravity={[0, -16, 0]} paused={!running}>
            <Walls />
            <Bodies key={epoch} api={api} />
            {!env.touch && <Pointer />}
          </Physics>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          minDistance={12}
          maxDistance={32}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.6}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => api.current?.shake()}
            className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Shake
          </button>
          <button
            type="button"
            onClick={() => setEpoch((e) => e + 1)}
            className="pointer-events-auto rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Reset
          </button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
          {env.touch
            ? "Drag to orbit · shake to scatter"
            : "Drag to orbit · cursor pushes the letters"}
        </p>
      </div>
    </div>
  );
}
