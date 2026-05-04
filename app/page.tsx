import Image from "next/image";
import Link from "next/link";
import { projects } from "@/lib/projects";
import { TypingQuote } from "@/components/TypingQuote";
import {
  awards,
  coursework,
  education,
  industry,
  researchInterests,
  type Education,
} from "@/lib/profile";

function degreeLine(e: Education): string {
  return `${e.degreeLevel}, ${e.major}${e.minor ? ` (${e.minor} minor)` : ""}`;
}

function detailLine(e: Education): string {
  return [
    e.advisor && `Advised by ${e.advisor}`,
    `GPA ${e.gpa}`,
    e.honors,
  ]
    .filter(Boolean)
    .join(" · ");
}

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
          <TypingQuote />
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
                <p className="mt-1 text-sm text-[var(--color-fg)]">{degreeLine(e)}</p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {detailLine(e)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Research */}
      <Section title="Research Interests">
        <p className="text-[var(--color-fg)]">
          {researchInterests.join(" · ")}
        </p>
      </Section>

      {/* Coursework */}
      <Section title="Coursework">
        <p className="text-[var(--color-fg)]">{coursework.join(", ")}</p>
      </Section>

      {/* Selected Projects */}
      <Section
        title="Selected Projects"
        action={
          <Link
            href="/projects"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            View all ↗
          </Link>
        }
      >
        <ul className="divide-y divide-[var(--color-border)]">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/projects/#${p.slug}`}
                className="group block py-4 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
                    {p.title}
                    <span className="ml-2 inline-block translate-x-0 text-xs text-[var(--color-fg-muted)] transition-transform group-hover:translate-x-1">
                      ↗
                    </span>
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
                    {p.category} · {p.year}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {p.tagline}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Industry */}
      <Section title="Industry Experience">
        {industry.map((job) => (
          <div key={job.company} className="mb-6 last:mb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-base font-semibold tracking-tight">
                {job.company}
                <span className="ml-2 font-normal text-[var(--color-fg-muted)]">
                  {job.role}
                </span>
              </h3>
              <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                {job.period}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-fg)]">
              {job.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--color-fg-muted)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      {/* Awards */}
      <Section title="Honors & Awards">
        <ul className="divide-y divide-[var(--color-border)]">
          {awards.map((a) => {
            const row = (
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {a.title}
                  {a.href && (
                    <span className="ml-1.5 text-xs text-[var(--color-fg-muted)]">
                      ↗
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                  {a.year}
                </span>
              </div>
            );
            return (
              <li key={a.title} className="first:[&>*]:pt-0 last:[&>*]:pb-0">
                {a.href ? (
                  <Link
                    href={a.href}
                    className="block text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
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

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
