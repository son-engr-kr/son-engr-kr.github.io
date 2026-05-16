"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// --- Scene constants (world units) ---
const NAME = "HYOUNGSEO SON";
const SLOT = 1.2; // horizontal advance per character
const LETTER_SIZE = 1;
const LETTER_DEPTH = 0.42;
const FLOOR_Y = 0;
const FONT_URL = "/fonts/helvetiker_bold.typeface.json";

// Span the settled name occupies — used to frame the camera and the cage.
const NAME_WIDTH = NAME.length * SLOT;

// Damped spring that pulls every letter back to its slot, so the name always
// re-forms after the cursor scatters it — readability never breaks for good.
const SPRING_K = 26; // stiffness (pull toward the slot)
const SPRING_C = 8; // velocity damping
const SETTLE_EPS = 0.018; // below this displacement a body is left asleep

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

// Keep the whole name framed regardless of the card's aspect ratio: "contain"
// fit, so a wide-short hero and a narrow phone both read the full name.
function FitCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const halfTan = Math.tan(((camera.fov ?? 16) * Math.PI) / 360);
    const targetW = NAME_WIDTH + 1.6; // name + horizontal margin
    const targetH = LETTER_SIZE + 1.4; // name + vertical margin
    const zForWidth = targetW / aspect / 2 / halfTan;
    const zForHeight = targetH / 2 / halfTan;
    camera.position.set(0, 0.55, Math.max(zForWidth, zForHeight));
    camera.lookAt(0, 0.55, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// The letters drop into their slots with rotation locked, so they always land
// upright and readable. A damped spring on X/Z slides any displaced letter
// home; gravity and the floor own the vertical axis.
function Letters({ dark, onReady }: { dark: boolean; onReady?: () => void }) {
  const letters = useLetters();
  const refs = useRef<(RapierRigidBody | null)[]>([]);
  const readyFired = useRef(false);

  // Free the per-letter geometries only when the scene actually unmounts.
  useEffect(() => {
    return () => {
      for (const l of letters) l.geometry.dispose();
    };
  }, [letters]);

  // Signal the parent once — guarded so a changing callback identity is safe.
  useEffect(() => {
    if (readyFired.current) return;
    readyFired.current = true;
    onReady?.();
  }, [onReady]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30); // cap after a paused/hidden frame
    for (let i = 0; i < letters.length; i++) {
      const rb = refs.current[i];
      if (!rb) continue;
      const p = rb.translation();
      const dx = letters[i].slotX - p.x;
      const dz = -p.z;
      const v = rb.linvel();
      // Resting in its slot — skip so Rapier can keep the body asleep.
      if (
        Math.abs(dx) < SETTLE_EPS &&
        Math.abs(dz) < SETTLE_EPS &&
        Math.hypot(v.x, v.y, v.z) < 0.06
      ) {
        continue;
      }
      // Impulse scaled by mass → a mass-independent damped spring on X/Z.
      const m = rb.mass();
      rb.applyImpulse(
        {
          x: (SPRING_K * dx - SPRING_C * v.x) * dt * m,
          y: 0,
          z: (SPRING_K * dz - SPRING_C * v.z) * dt * m,
        },
        true,
      );
    }
  });

  return (
    <>
      {letters.map((l, i) => {
        const restY = FLOOR_Y + l.half[1] + 0.02;
        const spawnY = restY + 3.4 + i * 0.09; // drop height + cascade
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
            linearDamping={0.35}
          >
            <CuboidCollider args={l.half} />
            <mesh geometry={l.geometry}>
              {/* Dark page: the playground's glowing light-blue. Light page:
                  a vivid deep blue that reads on white — a faint same-hue
                  emissive keeps the shadowed faces from going dull. */}
              <meshStandardMaterial
                color={dark ? "#5BC8F7" : "#0a6fc0"}
                emissive={dark ? "#4FC3F7" : "#0a6fc0"}
                emissiveIntensity={dark ? 0.12 : 0.06}
                roughness={dark ? 0.34 : 0.36}
                metalness={dark ? 0.3 : 0.15}
              />
            </mesh>
          </RigidBody>
        );
      })}
    </>
  );
}

// Invisible cage: the floor catches the drop; side, front and back walls keep
// a hard cursor sweep from flinging letters out of frame. Nothing is rendered.
function Cage() {
  const hw = NAME_WIDTH / 2 + 2.5;
  const hd = 1.6;
  const hh = 6;
  const t = 0.5;
  return (
    <RigidBody type="fixed" restitution={0.1} friction={0.9}>
      <CuboidCollider args={[hw, t, hd]} position={[0, FLOOR_Y - t, 0]} />
      <CuboidCollider args={[t, hh, hd]} position={[-hw - t, hh, 0]} />
      <CuboidCollider args={[t, hh, hd]} position={[hw + t, hh, 0]} />
      <CuboidCollider args={[hw, hh, t]} position={[0, hh, -hd - t]} />
      <CuboidCollider args={[hw, hh, t]} position={[0, hh, hd + t]} />
    </RigidBody>
  );
}

// Invisible kinematic ball that rides the cursor on the z=0 plane and shoves
// the letters; the spring pulls them back, so the name re-forms (desktop only).
function Pointer({ hover }: { hover: RefObject<boolean> }) {
  const body = useRef<RapierRigidBody>(null);
  const camera = useThree((s) => s.camera);
  const pointer = useThree((s) => s.pointer);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const hw = NAME_WIDTH / 2 + 2;

  useFrame(() => {
    const rb = body.current;
    if (!rb) return;
    if (!hover.current) {
      // Cursor left the hero — park the pusher far below so it stops pinning
      // whichever letter it happened to be resting against.
      rb.setNextKinematicTranslation({ x: 0, y: -40, z: 0 });
      return;
    }
    ray.setFromCamera(pointer, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return;
    rb.setNextKinematicTranslation({
      x: clamp(hit.x, -hw, hw),
      y: clamp(hit.y, FLOOR_Y - 0.5, FLOOR_Y + 6),
      z: 0,
    });
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" ccd>
      <BallCollider args={[0.6]} />
    </RigidBody>
  );
}

export default function HeroNameScene({
  onReady,
}: {
  onReady?: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const [running, setRunning] = useState(true);

  // Detected once: transparent canvas inherits the page background, so the
  // material — not the backdrop — is what has to adapt to light/dark.
  const [env] = useState(() => ({
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    touch: window.matchMedia("(hover: none)").matches,
    lowPerf: window.matchMedia("(max-width: 768px)").matches,
  }));

  // Pause the render loop when the hero scrolls away or the tab is hidden.
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
      { threshold: 0.05 },
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
        camera={{ position: [0, 0.55, 12], fov: 16 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onPointerMove={() => {
          hover.current = true;
        }}
        onPointerLeave={() => {
          hover.current = false;
        }}
      >
        {/* Dark page mirrors the playground; light page lifts the ambient
            and warms the fill so the name stays vivid on white. */}
        <ambientLight intensity={env.dark ? 0.5 : 0.7} />
        <directionalLight
          position={[9, 16, 12]}
          intensity={env.dark ? 2.6 : 2.8}
        />
        <directionalLight
          position={[-9, 5, -6]}
          intensity={0.6}
          color={env.dark ? "#4FC3F7" : "#a9d6f0"}
        />

        <FitCamera />

        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]} paused={!running}>
            <Cage />
            <Letters dark={env.dark} onReady={onReady} />
            {!env.touch && <Pointer hover={hover} />}
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
}
