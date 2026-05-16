"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  RoundCuboidCollider,
  TrimeshCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

// ---- Track geometry constants ----
const SAMPLES = 240; // centerline resolution
const HALF_WIDTH = 7; // half the track width
const GRASS = 6; // off-track margin before the barrier

// ---- Driving constants (world units, seconds) ----
const GRAVITY = 26;
const ENGINE_ACCEL = 38; // forward acceleration at full throttle
const BRAKE_ACCEL = 34;
const REVERSE_ACCEL = 16;
const MAX_SPEED = 40;
const MAX_SPEED_OFF = 19;
const MAX_REVERSE = 13;
const STEER_YAW = 2.0; // yaw rate (rad/s) at full lock
const ROLL_OFF = 2.8; // rolling drag off the track
const GROUND_DIST = 3.2; // body within this of the surface → grounded
const CAR_ROUND = 0.25; // rounded collider edges, so the car rolls over bumps
const WALL_PUSH = 44; // barrier shove strength
const RECOVER_TIME = 2.6; // seconds upside-down before an auto-flip

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const fmt = (t: number) => (t > 0 ? t.toFixed(2) : "—");

// --- Elevation: paved maps are flat; off-road is a rolling, bumpy field ---
type Elev = (x: number, z: number) => number;
const FLAT: Elev = () => 0;
const offroadHeight: Elev = (x, z) => {
  let h = 0;
  h += 4.2 * Math.sin(x * 0.038) * Math.cos(z * 0.033); // big hills
  h += 3.0 * Math.sin(x * 0.025 + z * 0.041 + 0.6); // long ridges
  h += 1.4 * Math.sin(x * 0.097 + 1.2) * Math.sin(z * 0.11); // medium rolls
  h += 0.7 * Math.sin(x * 0.3 + z * 0.21); // bumps
  h += 0.5 * Math.cos(x * 0.24 - z * 0.33 + 1.7); // bumps
  h += 0.3 * Math.sin(x * 0.62 + z * 0.55); // fine chatter
  return h;
};

function terrainNormal(elev: Elev, x: number, z: number): [number, number, number] {
  const e = 1.2;
  const nx = elev(x - e, z) - elev(x + e, z);
  const nz = elev(x, z - e) - elev(x, z + e);
  const ny = 2 * e;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}

// ---- Selectable maps ----
type MapDef = {
  id: string;
  name: string;
  points: [number, number][];
  trackColor: string;
  edgeColor: string;
  groundColor: string;
  sky: string;
  grip: number; // lateral grip on the track surface
  rollDrag: number; // rolling resistance on the track surface
  elevation: Elev;
  terrain: boolean;
};

const MAPS: MapDef[] = [
  {
    id: "circuit",
    name: "Circuit",
    points: [
      [0, -62],
      [46, -56],
      [72, -22],
      [58, 12],
      [64, 46],
      [26, 64],
      [-22, 60],
      [-58, 40],
      [-70, -6],
      [-40, -52],
    ],
    trackColor: "#2b2e35",
    edgeColor: "#e9e9e9",
    groundColor: "#4a7a3c",
    sky: "#a8c9e6",
    grip: 6.5,
    rollDrag: 0.5,
    elevation: FLAT,
    terrain: false,
  },
  {
    id: "speedway",
    name: "Speedway",
    points: [
      [0, -85],
      [68, -74],
      [96, -18],
      [92, 44],
      [58, 84],
      [-12, 90],
      [-74, 66],
      [-100, 4],
      [-84, -52],
      [-38, -84],
    ],
    trackColor: "#34373f",
    edgeColor: "#e9e9e9",
    groundColor: "#456f9a",
    sky: "#bcd6ea",
    grip: 7,
    rollDrag: 0.44,
    elevation: FLAT,
    terrain: false,
  },
  {
    id: "offroad",
    name: "Off-road",
    points: [
      [0, -52],
      [34, -56],
      [56, -34],
      [40, -6],
      [58, 20],
      [48, 52],
      [10, 50],
      [-20, 62],
      [-48, 46],
      [-56, 10],
      [-40, -16],
      [-50, -42],
    ],
    trackColor: "#6b4a2f",
    edgeColor: "#b89a63",
    groundColor: "#7a6f42",
    sky: "#c7bb98",
    grip: 4.3,
    rollDrag: 0.95,
    elevation: offroadHeight,
    terrain: true,
  },
];

// ---- Selectable cars ----
type CarDef = {
  id: string;
  name: string;
  kind: "car" | "truck";
  body: string;
  accent: string;
  engineMul: number;
  topMul: number;
  gripMul: number;
  mass: number;
  half: [number, number, number]; // collider half-extents
};

const CARS: CarDef[] = [
  {
    id: "comet",
    name: "Comet",
    kind: "car",
    body: "#e63946",
    accent: "#c62e3a",
    engineMul: 1,
    topMul: 1,
    gripMul: 1,
    mass: 1100,
    half: [0.98, 0.66, 2.05],
  },
  {
    id: "aero",
    name: "Aero",
    kind: "car",
    body: "#2f96d8",
    accent: "#2680ba",
    engineMul: 1.12,
    topMul: 1.2,
    gripMul: 0.86,
    mass: 1000,
    half: [0.98, 0.62, 2.1],
  },
  {
    id: "boar",
    name: "Boar",
    kind: "truck",
    body: "#e0a52f",
    accent: "#c48f22",
    engineMul: 1.16,
    topMul: 0.86,
    gripMul: 1.2,
    mass: 1850,
    half: [1.18, 1.2, 2.3],
  },
];

type Stats = {
  speed: number;
  lap: number;
  lapTime: number;
  best: number;
  started: boolean;
  airborne: boolean;
};

type Control = "up" | "down" | "left" | "right";

// --- Build centerline samples + flat ribbon geometries for a map ---
type TrackData = {
  centers: THREE.Vector3[];
  startHeading: number;
  asphalt: THREE.BufferGeometry;
  edgeL: THREE.BufferGeometry;
  edgeR: THREE.BufferGeometry;
  start: THREE.BufferGeometry;
};

function buildTrack(points: [number, number][], elev: Elev): TrackData {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    "catmullrom",
    0.5,
  );
  const raw = curve.getSpacedPoints(SAMPLES);
  const centers: THREE.Vector3[] = [];
  for (let i = 0; i < SAMPLES; i++) centers.push(raw[i]);

  const perps: THREE.Vector3[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const a = centers[(i - 1 + SAMPLES) % SAMPLES];
    const b = centers[(i + 1) % SAMPLES];
    const tx = b.x - a.x;
    const tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    perps.push(new THREE.Vector3(tz / len, 0, -tx / len));
  }

  const ribbon = (offset: number, width: number, lift: number) => {
    const pos: number[] = [];
    const nrm: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const c = centers[i % SAMPLES];
      const p = perps[i % SAMPLES];
      for (const s of [offset + width / 2, offset - width / 2]) {
        const vx = c.x + p.x * s;
        const vz = c.z + p.z * s;
        pos.push(vx, elev(vx, vz) + lift, vz);
        const n = terrainNormal(elev, vx, vz);
        nrm.push(n[0], n[1], n[2]);
      }
    }
    for (let i = 0; i < SAMPLES; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    g.setIndex(idx);
    return g;
  };

  const c0 = centers[0];
  const p0 = perps[0];
  const t0 = new THREE.Vector3().subVectors(centers[1], centers[0]).normalize();
  const hl = 2.4;
  const corner = (s: number, l: number) => {
    const vx = c0.x + p0.x * HALF_WIDTH * s + t0.x * hl * l;
    const vz = c0.z + p0.z * HALF_WIDTH * s + t0.z * hl * l;
    return [vx, elev(vx, vz) + 0.08, vz];
  };
  const start = new THREE.BufferGeometry();
  start.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)].flat(),
      3,
    ),
  );
  start.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute([1, 1, 0, 1, 0, 0, 1, 0], 2),
  );
  start.setIndex([0, 1, 2, 0, 2, 3]);
  start.computeVertexNormals();

  return {
    centers,
    startHeading: Math.atan2(t0.x, t0.z),
    asphalt: ribbon(0, HALF_WIDTH * 2, 0.06),
    edgeL: ribbon(HALF_WIDTH - 0.3, 0.5, 0.09),
    edgeR: ribbon(-HALF_WIDTH + 0.3, 0.5, 0.09),
    start,
  };
}

// A displaced grid — both the visual mesh and the physics trimesh use this.
function buildGround(elev: Elev) {
  const SIZE = 420;
  const N = 130;
  const step = SIZE / N;
  const half = SIZE / 2;
  const pos: number[] = [];
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = -half + i * step;
      const z = -half + j * step;
      pos.push(x, elev(x, z), z);
    }
  }
  const idx: number[] = [];
  const row = N + 1;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const vertices = new Float32Array(pos);
  const indices = new Uint32Array(idx);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return { geometry, vertices, indices };
}

function makeCheckerTexture(): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 2;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(0, 0, 2, 2);
  ctx.fillStyle = "#161616";
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillRect(1, 1, 1, 1);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.repeat.set(HALF_WIDTH, 2.4);
  return tex;
}

// --- Vehicle models, forward = local +z, wheel bottoms at local y = 0.
// Wheels stay on the chassis; the hull rides above on the suspension. ---
function CarWheels() {
  const wheel = (x: number, z: number) => (
    <mesh key={`${x},${z}`} position={[x, 0.42, z]} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.42, 0.42, 0.34, 18]} />
      <meshStandardMaterial color="#15171c" roughness={0.85} />
    </mesh>
  );
  return (
    <>
      {wheel(-0.96, 1.3)}
      {wheel(0.96, 1.3)}
      {wheel(-0.96, -1.3)}
      {wheel(0.96, -1.3)}
    </>
  );
}

function CarHull({ body, accent }: { body: string; accent: string }) {
  return (
    <>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.8, 0.5, 4]} />
        <meshStandardMaterial color={body} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 1.7]}>
        <boxGeometry args={[1.7, 0.3, 0.8]} />
        <meshStandardMaterial color={accent} roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.05, -0.2]}>
        <boxGeometry args={[1.45, 0.5, 1.7]} />
        <meshStandardMaterial color="#1f2933" roughness={0.25} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.06, -1.95]}>
        <boxGeometry args={[1.9, 0.1, 0.5]} />
        <meshStandardMaterial color="#1f2933" roughness={0.5} />
      </mesh>
    </>
  );
}

function TruckWheels() {
  const wheel = (x: number, z: number) => (
    <mesh key={`${x},${z}`} position={[x, 0.82, z]} rotation-z={Math.PI / 2}>
      <cylinderGeometry args={[0.82, 0.82, 0.62, 20]} />
      <meshStandardMaterial color="#15171c" roughness={0.95} />
    </mesh>
  );
  return (
    <>
      {wheel(-1.2, 1.5)}
      {wheel(1.2, 1.5)}
      {wheel(-1.2, -1.55)}
      {wheel(1.2, -1.55)}
    </>
  );
}

function TruckHull({ body, accent }: { body: string; accent: string }) {
  return (
    <>
      <mesh position={[0, 1.2, -0.1]}>
        <boxGeometry args={[2.1, 0.6, 4.2]} />
        <meshStandardMaterial color={body} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.9, 0.55]}>
        <boxGeometry args={[1.95, 0.95, 1.8]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 2.05, 1.46]}>
        <boxGeometry args={[1.65, 0.55, 0.12]} />
        <meshStandardMaterial color="#1f2933" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.15, -0.7]}>
        <boxGeometry args={[2.0, 0.14, 0.14]} />
        <meshStandardMaterial color="#1f2933" roughness={0.5} />
      </mesh>
    </>
  );
}

// Reads the rigid-body car each frame, applies driving forces, runs the
// camera and lap timing. Yaw is player-driven; pitch/roll is left to the
// physics engine — so the car genuinely tumbles, flips and lands.
function Driver({
  carRef,
  hullRef,
  map,
  car,
  track,
  input,
  stats,
  api,
}: {
  carRef: React.RefObject<RapierRigidBody | null>;
  hullRef: React.RefObject<THREE.Group | null>;
  map: MapDef;
  car: CarDef;
  track: TrackData;
  input: React.RefObject<{ throttle: number; steer: number }>;
  stats: React.RefObject<Stats>;
  api: React.RefObject<{ reset: () => void } | null>;
}) {
  const camera = useThree((s) => s.camera);
  const tmp = useMemo(
    () => ({
      q: new THREE.Quaternion(),
      fwd: new THREE.Vector3(),
      up: new THREE.Vector3(),
      want: new THREE.Vector3(),
    }),
    [],
  );
  const view = useRef({ heading: track.startHeading, snap: true });
  const prog = useRef({ prevIndex: 0, passedCp: false, flipped: 0 });
  // Cosmetic suspension: hull heave + lean, plus last-frame velocity.
  const susp = useRef({
    y: 0,
    vy: 0,
    pitch: 0,
    roll: 0,
    pvx: 0,
    pvy: 0,
    pvz: 0,
  });

  const nearest = (x: number, z: number) => {
    let bd = Infinity;
    let bi = 0;
    const c = track.centers;
    for (let i = 0; i < SAMPLES; i++) {
      const dx = c[i].x - x;
      const dz = c[i].z - z;
      const d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    return { index: bi, dist: Math.sqrt(bd) };
  };

  useEffect(() => {
    const place = (
      x: number,
      z: number,
      heading: number,
      rb: RapierRigidBody,
    ) => {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        heading,
      );
      rb.setTranslation(
        { x, y: map.elevation(x, z) + 2.4, z },
        true,
      );
      rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
    };
    const reset = () => {
      const rb = carRef.current;
      if (rb) place(track.centers[0].x, track.centers[0].z, track.startHeading, rb);
      view.current = { heading: track.startHeading, snap: true };
      prog.current = { prevIndex: 0, passedCp: false, flipped: 0 };
      susp.current = { y: 0, vy: 0, pitch: 0, roll: 0, pvx: 0, pvy: 0, pvz: 0 };
      const s = stats.current;
      s.speed = 0;
      s.lap = 0;
      s.lapTime = 0;
      s.best = 0;
      s.started = false;
      s.airborne = false;
    };
    api.current = { reset };
    // Fresh stats whenever the map or car changes (Game remounts).
    const s = stats.current;
    s.speed = 0;
    s.lap = 0;
    s.lapTime = 0;
    s.best = 0;
    s.started = false;
    s.airborne = false;
    return () => {
      api.current = null;
    };
  }, [api, carRef, map, stats, track]);

  useFrame((_, raw) => {
    const rb = carRef.current;
    if (!rb) return;
    const dt = Math.min(raw, 1 / 30);
    const s = stats.current;
    const { throttle, steer } = input.current;
    const m = rb.mass() || 1;

    const t = rb.translation();
    const r = rb.rotation();
    tmp.q.set(r.x, r.y, r.z, r.w);
    tmp.fwd.set(0, 0, 1).applyQuaternion(tmp.q);
    tmp.up.set(0, 1, 0).applyQuaternion(tmp.q);

    // Horizontal forward / right axes for steering and grip.
    let hfx = tmp.fwd.x;
    let hfz = tmp.fwd.z;
    const hlen = Math.hypot(hfx, hfz);
    if (hlen > 0.15) {
      hfx /= hlen;
      hfz /= hlen;
      view.current.heading = Math.atan2(hfx, hfz);
    }
    const hrx = hfz;
    const hrz = -hfx;

    const surfaceY = map.elevation(t.x, t.z);
    const grounded = t.y - surfaceY < GROUND_DIST;
    const upright = tmp.up.y > 0.5;
    s.airborne = !grounded;

    const lv = rb.linvel();
    const fwdSpeed = lv.x * hfx + lv.z * hfz;
    const latSpeed = lv.x * hrx + lv.z * hrz;
    const near = nearest(t.x, t.z);
    const onTrack = near.dist <= HALF_WIDTH;
    if (throttle > 0) s.started = true;

    if (grounded && upright) {
      const topSpeed = (onTrack ? MAX_SPEED : MAX_SPEED_OFF) * car.topMul;
      // Engine / brake / reverse — impulse along the car's forward axis.
      if (throttle > 0 && fwdSpeed < topSpeed) {
        const f = ENGINE_ACCEL * car.engineMul * throttle * dt * m;
        rb.applyImpulse(
          { x: tmp.fwd.x * f, y: tmp.fwd.y * f, z: tmp.fwd.z * f },
          true,
        );
      } else if (throttle < 0) {
        if (fwdSpeed > 0.6) {
          const f = BRAKE_ACCEL * dt * m;
          rb.applyImpulse({ x: -hfx * f, y: 0, z: -hfz * f }, true);
        } else if (fwdSpeed > -MAX_REVERSE) {
          const f = REVERSE_ACCEL * dt * m;
          rb.applyImpulse(
            { x: -tmp.fwd.x * f, y: 0, z: -tmp.fwd.z * f },
            true,
          );
        }
      }
      // Rolling drag — gentle on tarmac, strong on dirt/grass.
      const drag = (onTrack ? map.rollDrag : ROLL_OFF) * dt;
      rb.applyImpulse(
        { x: -lv.x * drag * m, y: 0, z: -lv.z * drag * m },
        true,
      );
      // Tyre grip — cancel sideways slide (momentum / drift live here).
      const grip = clamp(
        (onTrack ? map.grip : 2.4) * car.gripMul * dt,
        0,
        0.9,
      );
      rb.applyImpulse(
        { x: -hrx * latSpeed * grip * m, y: 0, z: -hrz * latSpeed * grip * m },
        true,
      );
      // Steering — drive the yaw rate directly; pitch/roll stay physical.
      const authority = clamp(Math.abs(fwdSpeed) / 6, 0, 1);
      const av = rb.angvel();
      rb.setAngvel(
        {
          x: av.x,
          y: -steer * STEER_YAW * authority * Math.sign(fwdSpeed || 1),
          z: av.z,
        },
        true,
      );
    }

    // Barrier — shove the car back toward the track if it strays too far.
    const limit = HALF_WIDTH + GRASS;
    if (near.dist > limit) {
      const c = track.centers[near.index];
      const dx = c.x - t.x;
      const dz = c.z - t.z;
      const len = Math.hypot(dx, dz) || 1;
      const push = (near.dist - limit) * WALL_PUSH * dt * m;
      rb.applyImpulse({ x: (dx / len) * push, y: 0, z: (dz / len) * push }, true);
    }

    // Auto-flip back if the car has been stuck upside-down.
    if (!upright && Math.hypot(lv.x, lv.z) < 4) {
      prog.current.flipped += dt;
      if (prog.current.flipped > RECOVER_TIME) {
        const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          view.current.heading,
        );
        rb.setTranslation({ x: t.x, y: surfaceY + 2, z: t.z }, true);
        rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        prog.current.flipped = 0;
      }
    } else {
      prog.current.flipped = 0;
    }

    // Lap timing, validated by a checkpoint on the far side of the circuit.
    const idx = near.index;
    const prev = prog.current.prevIndex;
    if (idx > SAMPLES * 0.4 && idx < SAMPLES * 0.6) prog.current.passedCp = true;
    const crossed =
      prev > SAMPLES * 0.85 && idx < SAMPLES * 0.15 && prog.current.passedCp;
    if (crossed) {
      if (s.started && s.lap > 0 && (s.best === 0 || s.lapTime < s.best)) {
        s.best = s.lapTime;
      }
      s.lap += 1;
      s.lapTime = 0;
      prog.current.passedCp = false;
    }
    prog.current.prevIndex = idx;
    if (s.started) s.lapTime += dt;
    s.speed = Math.hypot(lv.x, lv.z) * 3.6;

    // --- Cosmetic suspension: the hull heaves and leans on the chassis ---
    const sp = susp.current;
    const ax = (lv.x - sp.pvx) / dt;
    const ay = (lv.y - sp.pvy) / dt;
    const az = (lv.z - sp.pvz) / dt;
    sp.pvx = lv.x;
    sp.pvy = lv.y;
    sp.pvz = lv.z;
    // Heave — a damped spring; the hull resists vertical jolts.
    sp.vy += (-90 * sp.y - 11 * sp.vy - ay) * dt;
    sp.y += sp.vy * dt;
    // Pitch / roll lean from longitudinal & lateral acceleration.
    const aFwd = ax * hfx + az * hfz;
    const aLat = ax * hrx + az * hrz;
    const lean = 1 - Math.exp(-dt * 9);
    sp.pitch += (clamp(-0.006 * aFwd, -0.16, 0.16) - sp.pitch) * lean;
    sp.roll += (clamp(-0.006 * aLat, -0.17, 0.17) - sp.roll) * lean;
    if (hullRef.current) {
      hullRef.current.position.y = clamp(sp.y, -0.22, 0.16);
      hullRef.current.rotation.set(sp.pitch, 0, sp.roll);
    }

    // Chase camera — follows position and a stable horizontal heading,
    // so it stays sane while the car flips.
    const h = view.current.heading;
    const cfx = Math.sin(h);
    const cfz = Math.cos(h);
    tmp.want.set(t.x - cfx * 10, surfaceY + 5.2, t.z - cfz * 10);
    if (view.current.snap) {
      camera.position.copy(tmp.want);
      view.current.snap = false;
    } else {
      camera.position.lerp(tmp.want, 1 - Math.exp(-dt * 4.2));
    }
    camera.lookAt(t.x + cfx * 4, t.y + 0.6, t.z + cfz * 4);
  });

  return null;
}

function Game({
  map,
  car,
  input,
  stats,
  api,
}: {
  map: MapDef;
  car: CarDef;
  input: React.RefObject<{ throttle: number; steer: number }>;
  stats: React.RefObject<Stats>;
  api: React.RefObject<{ reset: () => void } | null>;
}) {
  const track = useMemo(() => buildTrack(map.points, map.elevation), [map]);
  const ground = useMemo(
    () => (map.terrain ? buildGround(map.elevation) : null),
    [map],
  );
  const checker = useMemo(makeCheckerTexture, []);
  const carRef = useRef<RapierRigidBody>(null);
  const hullRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const geos = [track.asphalt, track.edgeL, track.edgeR, track.start];
    return () => {
      for (const g of geos) g.dispose();
      ground?.geometry.dispose();
      checker.dispose();
    };
  }, [track, ground, checker]);

  const sx = track.centers[0].x;
  const sz = track.centers[0].z;
  const sy = map.elevation(sx, sz) + car.half[1] + 0.4;

  return (
    <>
      <hemisphereLight args={["#dff0ff", "#3c5a32", 0.9]} />
      <directionalLight position={[60, 90, 30]} intensity={1.7} />

      {ground ? (
        <mesh geometry={ground.geometry}>
          <meshStandardMaterial color={map.groundColor} roughness={1} flatShading />
        </mesh>
      ) : (
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[600, 600]} />
          <meshStandardMaterial color={map.groundColor} roughness={1} />
        </mesh>
      )}

      <mesh geometry={track.asphalt}>
        <meshStandardMaterial
          color={map.trackColor}
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={track.edgeL}>
        <meshStandardMaterial color={map.edgeColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={track.edgeR}>
        <meshStandardMaterial color={map.edgeColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={track.start}>
        <meshStandardMaterial map={checker} side={THREE.DoubleSide} />
      </mesh>

      {/* terrain collider — exact trimesh of the displaced ground */}
      <RigidBody type="fixed" colliders={false}>
        {ground ? (
          <TrimeshCollider
            args={[ground.vertices, ground.indices]}
            friction={1}
          />
        ) : (
          <CuboidCollider
            args={[320, 8, 320]}
            position={[0, -8, 0]}
            friction={1}
          />
        )}
      </RigidBody>

      {/* the car — a real dynamic rigid body */}
      <RigidBody
        ref={carRef}
        colliders={false}
        ccd
        canSleep={false}
        position={[sx, sy, sz]}
        rotation={[0, track.startHeading, 0]}
        linearDamping={0.12}
        angularDamping={0.55}
      >
        <RoundCuboidCollider
          args={[
            car.half[0] - CAR_ROUND,
            car.half[1] - CAR_ROUND,
            car.half[2] - CAR_ROUND,
            CAR_ROUND,
          ]}
          mass={car.mass}
          friction={0.85}
          restitution={0.12}
        />
        <group position={[0, -car.half[1], 0]}>
          {car.kind === "truck" ? <TruckWheels /> : <CarWheels />}
          <group ref={hullRef}>
            {car.kind === "truck" ? (
              <TruckHull body={car.body} accent={car.accent} />
            ) : (
              <CarHull body={car.body} accent={car.accent} />
            )}
          </group>
        </group>
      </RigidBody>

      <Driver
        carRef={carRef}
        hullRef={hullRef}
        map={map}
        car={car}
        track={track}
        input={input}
        stats={stats}
        api={api}
      />
    </>
  );
}

function Hud({ stats }: { stats: React.RefObject<Stats> }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 90);
    return () => window.clearInterval(id);
  }, []);
  const s = stats.current;
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold tabular-nums text-white">
          {Math.round(s.speed)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
          km/h
        </span>
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
        Lap {Math.max(1, s.lap + (s.started ? 1 : 0))} · {fmt(s.lapTime)}
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#4FC3F7]">
        Best {fmt(s.best)}
      </div>
    </div>
  );
}

function TouchPad({
  onControl,
}: {
  onControl: (c: Control, on: boolean) => void;
}) {
  const btn = (c: Control, label: string, extra: string) => {
    const press = (on: boolean) => (e: React.PointerEvent) => {
      e.preventDefault();
      onControl(c, on);
    };
    return (
      <button
        type="button"
        aria-label={c}
        onPointerDown={press(true)}
        onPointerUp={press(false)}
        onPointerLeave={press(false)}
        onPointerCancel={press(false)}
        className={`pointer-events-auto flex select-none items-center justify-center rounded-xl border border-white/15 bg-white/10 font-mono text-lg text-white/85 backdrop-blur-sm active:bg-white/30 ${extra}`}
      >
        {label}
      </button>
    );
  };
  return (
    <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
      <div className="flex gap-2">
        {btn("left", "◀", "h-14 w-14")}
        {btn("right", "▶", "h-14 w-14")}
      </div>
      <div className="flex flex-col gap-2">
        {btn("up", "▲", "h-14 w-16")}
        {btn("down", "▼", "h-14 w-16")}
      </div>
    </div>
  );
}

function Garage({
  mapId,
  carId,
  onMap,
  onCar,
  onClose,
}: {
  mapId: number;
  carId: number;
  onMap: (i: number) => void;
  onCar: (i: number) => void;
  onClose: () => void;
}) {
  const cell = (active: boolean) =>
    `pointer-events-auto rounded-lg border px-2 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
      active
        ? "border-white/45 bg-white/25 text-white"
        : "border-white/15 bg-white/5 text-white/55 hover:bg-white/10"
    }`;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/75 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Map
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MAPS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMap(i)}
              className={cell(i === mapId)}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Car
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CARS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCar(i)}
              className={`${cell(i === carId)} flex items-center justify-center gap-1.5`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: c.body }}
              />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="pointer-events-auto rounded-full border border-white/25 bg-white/15 px-6 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/25"
      >
        Drive →
      </button>
    </div>
  );
}

export default function RaceScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef({ throttle: 0, steer: 0 });
  const pressed = useRef(new Set<Control>());
  const locked = useRef(false);
  const stats = useRef<Stats>({
    speed: 0,
    lap: 0,
    lapTime: 0,
    best: 0,
    started: false,
    airborne: false,
  });
  const api = useRef<{ reset: () => void } | null>(null);

  const [running, setRunning] = useState(true);
  const [mapId, setMapId] = useState(0);
  const [carId, setCarId] = useState(0);
  const [garageOpen, setGarageOpen] = useState(false);

  const [env] = useState(() => ({
    touch: window.matchMedia("(hover: none)").matches,
    lowPerf: window.matchMedia("(max-width: 768px)").matches,
  }));

  const applyInput = useCallback(() => {
    const p = pressed.current;
    input.current.throttle = (p.has("up") ? 1 : 0) - (p.has("down") ? 1 : 0);
    input.current.steer = (p.has("right") ? 1 : 0) - (p.has("left") ? 1 : 0);
  }, []);
  const setControl = useCallback(
    (c: Control, on: boolean) => {
      if (locked.current) return;
      if (on) pressed.current.add(c);
      else pressed.current.delete(c);
      applyInput();
    },
    [applyInput],
  );

  const openGarage = useCallback(() => {
    locked.current = true;
    pressed.current.clear();
    applyInput();
    setGarageOpen(true);
  }, [applyInput]);
  const closeGarage = useCallback(() => {
    locked.current = false;
    setGarageOpen(false);
  }, []);

  useEffect(() => {
    const m: Record<string, Control> = {
      w: "up",
      arrowup: "up",
      s: "down",
      arrowdown: "down",
      a: "left",
      arrowleft: "left",
      d: "right",
      arrowright: "right",
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const c = m[e.key.toLowerCase()];
      if (!c) return;
      e.preventDefault();
      setControl(c, down);
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [setControl]);

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
        camera={{ position: [0, 30, 40], fov: 55, near: 0.5, far: 700 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {/* Sky + the physics world stay mounted; only Game's contents are
            keyed, so changing map/car never tears down the Rapier world. */}
        <color attach="background" args={[MAPS[mapId].sky]} />
        <fog attach="fog" args={[MAPS[mapId].sky, 130, 340]} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -GRAVITY, 0]} paused={!running}>
            <Game
              key={`${mapId}:${carId}`}
              map={MAPS[mapId]}
              car={CARS[carId]}
              input={input}
              stats={stats}
              api={api}
            />
          </Physics>
        </Suspense>
      </Canvas>

      <Hud stats={stats} />

      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={garageOpen ? closeGarage : openGarage}
          className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Garage
        </button>
        <button
          type="button"
          onClick={() => api.current?.reset()}
          className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Reset
        </button>
      </div>

      {garageOpen && (
        <Garage
          mapId={mapId}
          carId={carId}
          onMap={setMapId}
          onCar={setCarId}
          onClose={closeGarage}
        />
      )}

      {env.touch ? (
        <TouchPad onControl={setControl} />
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
          WASD / arrows to drive
        </p>
      )}
    </div>
  );
}
