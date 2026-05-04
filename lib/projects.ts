export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  tagline: string;
  description: string;
  bullets: string[];
  tags: string[];
  links: { label: string; href: string; primary?: boolean }[];
  videoEmbedUrl?: string;
};

export const projects: Project[] = [
  {
    slug: "tekkal",
    title: "TEKKAL",
    subtitle: "AI-Friendly Slide Authoring Tool",
    category: "Tool",
    year: "2026",
    tagline:
      "Local-first slide platform where every drag-and-drop maps to structured code.",
    description:
      "Local-first, AI-agent-driven slide platform. Visual editor backed by a JSON scene graph, where every drag-and-drop action maps to structured code.",
    bullets: [
      "React 19 + TypeScript, Vite, Tailwind CSS v4, Zustand",
      "Monaco Editor for JSON editing, KaTeX for math, TikZ support (server-side & WASM)",
      "File System Access API for local project management without a backend",
    ],
    tags: [
      "React 19",
      "TypeScript",
      "Vite",
      "Tailwind v4",
      "Zustand",
      "Monaco",
      "KaTeX",
      "TikZ",
    ],
    links: [
      { label: "Live Demo", href: "https://tekkal.dev", primary: true },
      { label: "GitHub", href: "https://github.com/son-engr-kr/tekkal" },
    ],
  },
  {
    slug: "flanner",
    title: "Flanner",
    subtitle: "HackPrinceton Spring 2026 · Knot API track, 1st Place",
    category: "Hackathon",
    year: "2026",
    tagline:
      "Turns six months of DoorDash / Uber Eats orders into a weekly home-cooked meal plan, then auto-fills your Amazon Fresh cart.",
    description:
      "A mirror on your delivery habits. Pulls six months of real DoorDash / Uber Eats orders via Knot API, decomposes each dish into ingredients with K2 Think V2, generates a weekly home-cooked plan respecting calendar and dietary constraints, and pushes the exact ingredients to a real Amazon Fresh cart in one tap.",
    bullets: [
      "Next.js 15 + React 19 on Vercel; FastAPI on Cloud Run; MongoDB Atlas",
      "Knot API in production mode: TransactionLink for delivery history, AgenticShopping for real Amazon Fresh cart push (checkout intentionally stubbed)",
      "K2 Think V2 for weekly plan reasoning; Gemma 4 31B for photo recognition and check-in classification",
      "Photon spectrum-ts bridge for live iMessage orchestration during the demo",
    ],
    tags: [
      "Next.js 15",
      "React 19",
      "FastAPI",
      "Python",
      "MongoDB",
      "K2 Think V2",
      "Gemma",
      "Knot API",
      "Cloud Run",
      "Vercel",
    ],
    links: [
      { label: "Live", href: "https://flanner.health" },
      { label: "GitHub", href: "https://github.com/son-engr-kr/hackprinceton-beta" },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/gfLijC1apBo",
  },
  {
    slug: "motzip",
    title: "MotZip",
    subtitle: "Next-Gen Hacks Beta · Spring 2026 · Judging in progress",
    category: "Hackathon",
    year: "2026",
    tagline:
      "Restaurants by voice. Speak what you want, watch a 3D map filter to candidates, then have an AI agent call every restaurant in parallel.",
    description:
      "Bilingual (EN/KO) restaurant discovery built around two ideas: voice-first filtering on a 3D map, and an AI phone agent that calls restaurants for you. Speak a query, the map sinks non-matching food into the ground; pick questions (reservations, vegetarian, wheelchair access...), click \"Call N selected,\" and watch real Twilio calls return ✓/✗/? per question.",
    bullets: [
      "Next.js 16 + React 19 + Tailwind 4 frontend; MapLibre GL + Three.js for the 3D scene",
      "FastAPI on Cloud Run; Google Places API (New) for restaurant data, dedup'd across 7 cuisine groups",
      "Voice search: Google Cloud STT → Gemini 2.0 Flash filter extraction → in-process filtering → Cloud TTS reply",
      "Batch calls: Twilio chained <Gather> per question, per-turn STT + Gemini parsing, streamed back as a checklist",
      "Graceful degradation: ElevenLabs Scribe/Turbo as STT/TTS fallback, keyword heuristics if Gemini JSON parse fails",
    ],
    tags: [
      "Next.js 16",
      "React 19",
      "Tailwind 4",
      "MapLibre GL",
      "Three.js",
      "FastAPI",
      "Twilio Voice",
      "Gemini 2.0",
      "Google Places",
      "TRELLIS",
    ],
    links: [
      { label: "Live", href: "https://motzip.vercel.app" },
      { label: "GitHub", href: "https://github.com/son-engr-kr/next-gen-hacks-beta" },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/a8UhKh7S4FU",
  },
  {
    slug: "bci-visualization",
    title: "BCI Neural Visualization System",
    subtitle: "Precision Neuroscience BCI Hackathon, 1st Place ($1,000)",
    category: "Hackathon",
    year: "2026",
    tagline:
      "Real-time guidance for surgeons placing 1024-channel ECoG arrays.",
    description:
      "Real-time neural activity visualization and BCI array placement guidance system. Processes live data from a 1024-channel micro-ECoG array (32×32 grid) to help neurosurgeons optimize BCI array placement during surgery.",
    bullets: [
      "CNN-based denoising (ResNet U-Net with CBAM attention)",
      "Kalman filter and EMA-based position tracking",
      "Real-time heatmap smoothing with configurable web UI",
      "500 Hz sampling, ~20–50 ms end-to-end latency",
    ],
    tags: [
      "PyTorch",
      "ResNet U-Net",
      "CBAM",
      "Kalman Filter",
      "Real-time",
      "ECoG",
    ],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/son-engr-kr/H2W-brainstorm-track2",
        primary: true,
      },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/XMMdG1X3W9g",
  },
  {
    slug: "zerve-odsc-datathon",
    title: "Zerve × ODSC AI Datathon",
    subtitle: "ODSC AI Datathon · 2026",
    category: "Datathon",
    year: "2026",
    tagline:
      "Production-style MLOps pipeline for subscription upgrade prediction — 32 blocks, 5-model ensemble, weekly drift detection, all built inside the Zerve canvas.",
    description:
      "End-to-end MLOps pipeline as a 32-block, 42-edge parallel-converge DAG inside the Zerve canvas: schema/leakage validation → EDA + 15-stage funnel → a 5-candidate AutoML pool → drift detection → champion picked for serving → weekly retraining loop. A Next.js frontend renders the DAG and calls a deployed FastAPI for live inference, reading canvas variables in real time.",
    bullets: [
      "5-candidate model pool: calibrated XGBoost + RF + HGB soft-vote ensemble, PyTorch tab-MLP, sklearn GBM — isotonic calibration throughout",
      "PR-AUC 0.2645, ROC-AUC 0.812 on 3.5M rows / 17,541 users (1.84% upgrade rate, ~53:1 imbalance); top-5% precision ~9× lift",
      "Tree SHAP + segment-level diagnostics map top features to marketing actions",
      "Weekly drift watch (PSI 0.10/0.25 + KS) with append-only event store, label-stable retraining gates, would_promote_new_model flag",
      "Next.js 14 + ReactFlow frontend draws the canvas DAG and queries the deployed FastAPI for live PNGs and inference",
    ],
    tags: [
      "Python",
      "XGBoost",
      "PyTorch",
      "scikit-learn",
      "SHAP",
      "FastAPI",
      "Next.js 14",
      "ReactFlow",
      "Zerve",
    ],
    links: [
      { label: "Live", href: "https://anmemol-beta.github.io/zerve-odsc-ai-datathon/" },
      { label: "GitHub", href: "https://github.com/anmemol-beta/zerve-odsc-ai-datathon" },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/TSgGcswV9NA",
  },
  {
    slug: "booky",
    title: "Booky",
    subtitle: "YHack 2026",
    category: "Hackathon",
    year: "2026",
    tagline:
      "Social reading platform with story-branching choices and an AI-generated solar system.",
    description:
      "Social reading platform that transforms solitary reading into a connected experience. Readers highlight passages, discuss with friends, make story-branching choices (Detroit: Become Human style), and explore an AI-generated solar system visualizing reading compatibility.",
    bullets: [
      "Next.js 16, React 19, Three.js for 3D planet visualization",
      "FastAPI backend with Firebase Firestore and ChromaDB",
      "Google K2 Think V2 for AI content, Gemini 2.0 Flash for voice Q&A, Vertex AI Imagen for illustrations",
    ],
    tags: [
      "Next.js 16",
      "React 19",
      "Three.js",
      "FastAPI",
      "Firestore",
      "ChromaDB",
      "Vertex AI",
    ],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/son-engr-kr/booky-yhack",
        primary: true,
      },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/vb6r4Af8pb0",
  },
];

