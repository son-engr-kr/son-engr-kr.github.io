"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

// --- Scene constants (world units) ---
const BOX = { w: 12, h: 10, d: 4.2 } as const;
const WALL = 1;

const PALETTE = [
  "#4FC3F7",
  "#29B6F6",
  "#0288D1",
  "#81D4FA",
  "#ECEFF3",
  "#F6B852",
];
const KINDS = ["sphere", "box", "ico"] as const;
type Kind = (typeof KINDS)[number];

type BodyItem = {
  id: number;
  kind: Kind;
  size: number;
  color: string;
  position: [number, number, number];
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]) =>
  arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// A loose grid above the floor — spaced wide enough to avoid initial overlap.
function makeBodies(): BodyItem[] {
  const cols = 8;
  const rows = 3;
  const spanX = 9.8;
  const items: BodyItem[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const kind = pick(KINDS);
    const size = kind === "box" ? rand(0.8, 1.05) : rand(0.42, 0.6);
    const x = (col / (cols - 1) - 0.5) * spanX + rand(-0.1, 0.1);
    const y = 0.4 + row * 1.7 + rand(-0.1, 0.1);
    const z = rand(-1, 1);
    items.push({ id: i, kind, size, color: pick(PALETTE), position: [x, y, z] });
  }
  return items;
}

function Body({
  item,
  register,
}: {
  item: BodyItem;
  register: (rb: RapierRigidBody | null) => void;
}) {
  const colliders =
    item.kind === "box" ? "cuboid" : item.kind === "ico" ? "hull" : "ball";

  return (
    <RigidBody
      ref={register}
      colliders={colliders}
      position={item.position}
      restitution={0.5}
      friction={0.6}
      linearDamping={0.1}
      angularDamping={0.2}
      ccd
    >
      {item.kind === "sphere" && (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[item.size, 32, 24]} />
          <meshStandardMaterial
            color={item.color}
            roughness={0.32}
            metalness={0.25}
          />
        </mesh>
      )}
      {item.kind === "box" && (
        <RoundedBox
          args={[item.size, item.size, item.size]}
          radius={item.size * 0.16}
          smoothness={3}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={item.color}
            roughness={0.38}
            metalness={0.2}
          />
        </RoundedBox>
      )}
      {item.kind === "ico" && (
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[item.size, 0]} />
          <meshStandardMaterial
            color={item.color}
            roughness={0.28}
            metalness={0.35}
            flatShading
          />
        </mesh>
      )}
    </RigidBody>
  );
}

function Bodies({
  api,
}: {
  api: React.RefObject<{ shake: () => void } | null>;
}) {
  const items = useMemo(makeBodies, []);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);

  useEffect(() => {
    api.current = {
      shake: () => {
        for (const rb of bodies.current) {
          if (!rb) continue;
          rb.applyImpulse(
            { x: rand(-5, 5), y: rand(4, 9), z: rand(-5, 5) },
            true,
          );
          rb.applyTorqueImpulse(
            { x: rand(-3, 3), y: rand(-3, 3), z: rand(-3, 3) },
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
      {items.map((item, i) => (
        <Body
          key={item.id}
          item={item}
          register={(rb) => {
            bodies.current[i] = rb;
          }}
        />
      ))}
    </>
  );
}

// Fixed colliders forming a closed box, plus a visible floor and back panel.
function Walls() {
  const hw = BOX.w / 2;
  const hh = BOX.h / 2;
  const hd = BOX.d / 2;
  const t = WALL / 2;

  return (
    <>
      <RigidBody type="fixed" restitution={0.3} friction={0.7}>
        <CuboidCollider args={[hw, t, hd]} position={[0, -hh - t, 0]} />
        <CuboidCollider args={[hw, t, hd]} position={[0, hh + t, 0]} />
        <CuboidCollider args={[t, hh, hd]} position={[-hw - t, 0, 0]} />
        <CuboidCollider args={[t, hh, hd]} position={[hw + t, 0, 0]} />
        <CuboidCollider args={[hw, hh, t]} position={[0, 0, -hd - t]} />
        <CuboidCollider args={[hw, hh, t]} position={[0, 0, hd + t]} />
      </RigidBody>

      <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -hh, 0]}>
        <planeGeometry args={[BOX.w, BOX.d]} />
        <meshStandardMaterial color="#10141c" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh receiveShadow position={[0, 0, -hd]}>
        <planeGeometry args={[BOX.w, BOX.h]} />
        <meshStandardMaterial color="#0c1016" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

// A kinematic sphere that tracks the cursor and shoves the dynamic bodies.
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
      y: clamp(hit.y, -BOX.h / 2 + 1, BOX.h / 2 - 1),
      z: 0,
    });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders="ball" ccd>
      <mesh>
        <sphereGeometry args={[0.85, 32, 24]} />
        <meshStandardMaterial
          color="#4FC3F7"
          emissive="#4FC3F7"
          emissiveIntensity={0.55}
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
        shadows
        dpr={[1, 1.75]}
        frameloop={running ? "always" : "never"}
        camera={{ position: [0, 0, 17], fov: 38 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0c10"]} />
        <fog attach="fog" args={["#0a0c10", 20, 38]} />

        <ambientLight intensity={0.55} />
        <directionalLight
          castShadow
          position={[8, 14, 11]}
          intensity={2.6}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
        />
        <directionalLight
          position={[-9, 3, -6]}
          intensity={0.7}
          color="#4FC3F7"
        />

        <Suspense fallback={null}>
          <Physics gravity={[0, -14, 0]} paused={!running}>
            <Walls />
            <Bodies key={epoch} api={api} />
            <Pointer />
          </Physics>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          minDistance={11}
          maxDistance={30}
          minPolarAngle={Math.PI * 0.16}
          maxPolarAngle={Math.PI * 0.62}
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
          Drag to orbit · cursor pushes the shapes
        </p>
      </div>
    </div>
  );
}
