export type Education = {
  school: string;
  location: string;
  cityShort?: string;
  degreeLevel: string;
  major: string;
  minor?: string;
  minorShort?: string;
  period: string;
  yearRange: string;
  gpa: string;
  honors?: string;
  advisor?: string;
  logo: string;
  logoAlt: string;
};

export type Industry = {
  company: string;
  role: string;
  period: string;
  bullets: string[];
};

export type Award = {
  title: string;
  year: string;
  href?: string;
  readme: string;
};

export const education: Education[] = [
  {
    school: "Northeastern University",
    location: "Boston, MA",
    cityShort: "Boston",
    degreeLevel: "Ph.D.",
    major: "Mechanical Engineering",
    period: "2024.09 - present",
    yearRange: "2024 – present",
    gpa: "3.96 / 4.0",
    advisor: "Seungmoon Song",
    logo: "/images/logos/nu.png",
    logoAlt: "Northeastern University",
  },
  {
    school: "Kyungpook National University",
    location: "South Korea",
    degreeLevel: "B.S.",
    major: "Mechanical Engineering",
    minor: "Computer Science",
    minorShort: "CS",
    period: "2018.03 - 2021.02",
    yearRange: "2018 – 2021",
    gpa: "3.84 / 4.0",
    honors: "Summa Cum Laude, 1st / 152",
    logo: "/images/logos/knu.png",
    logoAlt: "Kyungpook National University",
  },
];

export const researchInterests: string[] = [
  "Physics Simulation",
  "GPU-Accelerated Simulation",
  "Reinforcement Learning",
  "Deep Learning",
  "Differentiable Simulation",
];

export const coursework: string[] = [
  "Reinforcement Learning and Sequential Decision Making",
  "Deep Learning",
  "Machine Learning",
  "Theory of Optimization",
  "Human Movement Simulation",
  "Wearable Robotics",
];

export const industry: Industry[] = [
  {
    company: "Gachisoft Inc.",
    role: "Software Research Engineer",
    period: "2021 – 2024",
    bullets: [
      "Logistics Digital Twin System deployed at two Korea Post sites",
      "3D vision system for Coupang; PLC integration for real-time control (C++, OpenCV)",
    ],
  },
];

export const awards: Award[] = [
  {
    title: "HackPrinceton Spring 2026, Knot API track, 1st Place",
    year: "2026",
    href: "/projects/#flanner",
    readme: "**HackPrinceton Spring 2026** — Knot API track, 1st Place",
  },
  {
    title: "Precision Neuroscience BCI Hackathon, 1st Place",
    year: "2026",
    href: "/projects/#bci-visualization",
    readme: "**Precision Neuroscience BCI Hackathon** — 1st Place ($1,000)",
  },
  {
    title: "R-BIZ Challenge, Presidential Award",
    year: "2019",
    readme: "**R-BIZ Challenge** — Presidential Award (2019)",
  },
  {
    title: "National Scholarship for Science and Engineering, Full Tuition",
    year: "2020",
    readme: "**National Scholarship for Science and Engineering** — Full Tuition",
  },
];
