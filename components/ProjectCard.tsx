import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]/50">
      <header className="mb-3">
        <h3 className="text-xl font-semibold tracking-tight">{project.title}</h3>
        <p className="mt-1 text-sm italic text-[var(--color-fg-muted)]">
          {project.subtitle}
        </p>
      </header>

      <p className="text-sm leading-relaxed text-[var(--color-fg)]">
        {project.description}
      </p>

      <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--color-fg)]/90">
        {project.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      {project.videoEmbedUrl && (
        <div className="relative mt-5 aspect-video overflow-hidden rounded-lg border border-[var(--color-border)]">
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

      <footer className="mt-5 flex flex-wrap gap-3 text-sm">
        {project.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-accent)]"
          >
            {l.label} ↗
          </a>
        ))}
      </footer>
    </article>
  );
}
