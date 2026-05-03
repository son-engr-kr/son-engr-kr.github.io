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

