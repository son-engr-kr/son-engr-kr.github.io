import Image from "next/image";

const education = [
  {
    school: "Northeastern University",
    location: "Boston, MA",
    degree: "Ph.D., Mechanical Engineering",
    period: "2024.09 - present",
    logo: "/images/logos/nu.png",
    logoAlt: "Northeastern University",
    details: [
      "Advised by Seungmoon Song",
      "GPA 3.96 / 4.0",
    ],
  },
  {
    school: "Kyungpook National University",
    location: "South Korea",
    degree: "B.S., Mechanical Engineering (CS minor)",
    period: "2018.03 - 2021.02",
    logo: "/images/logos/knu.png",
    logoAlt: "Kyungpook National University",
    details: [
      "GPA 3.84 / 4.0",
      "Summa Cum Laude (1st / 152)",
    ],
  },
];

const awards = [
  ["Precision Neuroscience BCI Hackathon, 1st Place", "2026"],
  ["R-BIZ Challenge, Presidential Award", "2019"],
  ["National Scholarship for Science and Engineering, Full Tuition", "2020"],
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Hero */}
      <section className="mb-16 flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <Image
            src="/images/main_page_images/profile-img-hsson-4.jpg"
            alt="Hyoungseo Son"
            width={180}
            height={180}
            className="rounded-2xl object-cover ring-1 ring-[var(--color-border)]"
            priority
          />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Hyoungseo Son
          </h1>
          <p className="mt-2 text-[var(--color-fg-muted)]">
            Industry-experienced PhD student · Northeastern University
          </p>
          <p className="mt-4 max-w-2xl text-[var(--color-fg)]">
            &ldquo;Dreams feel real while we&rsquo;re in them.&rdquo; · Inception · So
            do good simulations.
          </p>
          <div className="mt-6">
            <a
              href="/assets/resume/cv_hyoungseo_son.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-black"
            >
              Download CV (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* Education */}
      <Section title="Education">
        <ul className="divide-y divide-[var(--color-border)]">
          {education.map((e) => (
            <li
              key={e.school}
              className="flex items-start gap-5 py-5 first:pt-0 last:pb-0"
            >
              <Image
                src={e.logo}
                alt={e.logoAlt}
                width={48}
                height={48}
                className="mt-1 h-12 w-12 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold tracking-tight">
                    {e.school}
                    <span className="ml-2 font-normal text-[var(--color-fg-muted)]">
                      {e.location}
                    </span>
                  </h3>
                  <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                    {e.period}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-fg)]">{e.degree}</p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {e.details.join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Research */}
      <Section title="Research Interests">
        <p className="text-[var(--color-fg)]">
          Physics Simulation, GPU-Accelerated Simulation, Reinforcement Learning,
          Deep Learning, Differentiable Simulation
        </p>
      </Section>

      {/* Coursework */}
      <Section title="Coursework">
        <p className="text-[var(--color-fg)]">
          Reinforcement Learning and Sequential Decision Making, Deep Learning,
          Machine Learning, Theory of Optimization, Human Movement Simulation,
          Wearable Robotics
        </p>
      </Section>

      {/* Industry */}
      <Section title="Industry Experience">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold">
            Gachisoft Inc., Software Research Engineer
          </h3>
          <p className="mt-1 text-xs text-[var(--color-fg-muted)]">2021 - 2024</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-[var(--color-fg)]">
            <li>Logistics Digital Twin System deployed at two Korea Post sites</li>
            <li>
              3D vision system for Coupang; PLC integration for real-time control
              (C++, OpenCV)
            </li>
          </ul>
        </div>
      </Section>

      {/* Awards */}
      <Section title="Honors & Awards">
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {awards.map(([title, year]) => (
            <li
              key={title}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span>{title}</span>
              <span className="text-[var(--color-fg-muted)]">{year}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Tech Stack */}
      <Section title="Tech Stack">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://skillicons.dev/icons?i=python,cpp,cs,pytorch,js,react,unity,blender,opencv,kotlin"
            alt="Tech stack icons"
            className="max-w-full"
          />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
