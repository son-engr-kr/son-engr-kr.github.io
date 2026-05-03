export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  links: { label: string; href: string }[];
  videoEmbedUrl?: string;
};

export const projects: Project[] = [
  {
    slug: "tekkal",
    title: "TEKKAL",
    subtitle: "AI-Friendly Slide Authoring Tool",
    description:
      "Local-first, AI-agent-driven slide platform. Visual editor backed by a JSON scene graph, where every drag-and-drop action maps to structured code.",
    bullets: [
      "React 19 + TypeScript, Vite, Tailwind CSS v4, Zustand",
      "Monaco Editor for JSON editing, KaTeX for math, TikZ support (server-side & WASM)",
      "File System Access API for local project management without a backend",
    ],
    links: [
      { label: "Live Demo", href: "https://tekkal.dev" },
      { label: "GitHub", href: "https://github.com/son-engr-kr/tekkal" },
    ],
  },
  {
    slug: "bci-visualization",
    title: "BCI Neural Visualization System",
    subtitle: "Precision Neuroscience BCI Hackathon, 1st Place ($1,000)",
    description:
      "Real-time neural activity visualization and BCI array placement guidance system. Processes live data from a 1024-channel micro-ECoG array (32×32 grid) to help neurosurgeons optimize BCI array placement during surgery.",
    bullets: [
      "CNN-based denoising (ResNet U-Net with CBAM attention)",
      "Kalman filter and EMA-based position tracking",
      "Real-time heatmap smoothing with configurable web UI",
      "500 Hz sampling, ~20–50 ms end-to-end latency",
    ],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/son-engr-kr/H2W-brainstorm-track2",
      },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/XMMdG1X3W9g",
  },
  {
    slug: "booky",
    title: "Booky",
    subtitle: "YHack 2026",
    description:
      "Social reading platform that transforms solitary reading into a connected experience. Readers highlight passages, discuss with friends, make story-branching choices (Detroit: Become Human style), and explore an AI-generated solar system visualizing reading compatibility.",
    bullets: [
      "Next.js 16, React 19, Three.js for 3D planet visualization",
      "FastAPI backend with Firebase Firestore and ChromaDB",
      "Google K2 Think V2 for AI content, Gemini 2.0 Flash for voice Q&A, Vertex AI Imagen for illustrations",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/son-engr-kr/booky-yhack" },
    ],
    videoEmbedUrl: "https://www.youtube.com/embed/vb6r4Af8pb0",
  },
];
