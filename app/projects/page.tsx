import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata = {
  title: "Projects · Hyoungseo Son",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
          {projects.length} projects · {new Date().getFullYear()}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Projects
        </h1>
        <p className="mt-3 max-w-xl text-[var(--color-fg-muted)]">
          Selected work across research tooling, hackathon prototypes, and
          real-time systems.
        </p>
      </header>

      <div className="space-y-12">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
