import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article
      id={project.slug}
      className="scroll-mt-24 border-b border-[var(--color-border)] pb-12 last:border-b-0 last:pb-0"
    >
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
        <span>{project.category}</span>
        <span aria-hidden>·</span>
        <span>{project.year}</span>
      </div>

      <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {project.title}
      </h3>
      <p className="mt-1.5 text-sm text-[var(--color-fg-muted)]">
        {project.subtitle}
      </p>

      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[var(--color-fg)]">
        {project.description}
      </p>

      <ul className="mt-4 max-w-3xl space-y-1.5 text-sm text-[var(--color-fg)]/90">
        {project.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--color-fg-muted)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {project.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--color-fg-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {project.videoEmbedUrl && (
        <div className="relative mt-6 aspect-video max-w-3xl overflow-hidden rounded-lg border border-[var(--color-border)] bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={project.videoEmbedUrl}
            title={`${project.title} demo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {project.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3.5 py-1.5 text-[var(--color-fg)] transition-colors hover:border-[var(--color-fg)] hover:text-[var(--color-accent)]"
          >
            {l.label}
            <span aria-hidden>↗</span>
          </a>
        ))}
      </div>
    </article>
  );
}
