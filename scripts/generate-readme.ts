#!/usr/bin/env tsx
/**
 * Sync auto-generated sections of a profile README from portfolio data.
 *
 * Usage: tsx scripts/generate-readme.ts <path-to-README.md>
 *
 * The target README must contain marker pairs for each section the script
 * writes. Anything outside the markers is preserved verbatim.
 *
 *   <!-- AUTO:EDUCATION:START -->
 *   ...generated content...
 *   <!-- AUTO:EDUCATION:END -->
 *
 * Markers handled: EDUCATION, RESEARCH, AWARDS, PROJECTS, INDUSTRY
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  awards,
  education,
  industry,
  researchInterests,
  type Education,
} from "../lib/profile";
import { projects, type Project } from "../lib/projects";

function educationLine(e: Education): string {
  const minorLabel = e.minorShort ?? e.minor;
  const minor = minorLabel ? ` (${minorLabel} Minor)` : "";
  const city = e.cityShort ? `, ${e.cityShort}` : "";
  const isCurrent = /present/i.test(e.period);
  let paren: string;
  if (isCurrent) {
    paren = `${e.yearRange}, GPA ${e.gpa.replace(/\s/g, "")}`;
  } else if (e.honors) {
    paren = e.honors;
  } else {
    paren = `${e.yearRange}, GPA ${e.gpa.replace(/\s/g, "")}`;
  }
  return `- **${e.degreeLevel}** ${e.major}${minor} — ${e.school}${city} *(${paren})*`;
}

function projectRow(p: Project): string {
  const gh = p.links.find((l) => l.label === "GitHub")?.href;
  const live = p.links.find((l) => /^Live/i.test(l.label))?.href;
  const titleCell = gh ? `[**${p.title}**](${gh})` : `**${p.title}**`;
  const liveSuffix = live ? ` ([Live](${live}))` : "";
  return `| ${titleCell} | ${p.tagline}${liveSuffix} |`;
}

const sections: Record<string, () => string> = {
  EDUCATION: () => education.map(educationLine).join("\n"),
  RESEARCH: () => researchInterests.join(" · "),
  AWARDS: () => awards.map((a) => `- ${a.readme}`).join("\n"),
  PROJECTS: () =>
    [
      "| Project | Description |",
      "|---------|-------------|",
      ...projects.map(projectRow),
    ].join("\n"),
  INDUSTRY: () =>
    industry
      .map(
        (job) =>
          `**${job.company}** — ${job.role} (${job.period})\n` +
          job.bullets.map((b) => `- ${b}`).join("\n")
      )
      .join("\n\n"),
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SOURCE_HINT: Record<string, string> = {
  EDUCATION: "lib/profile.ts",
  RESEARCH: "lib/profile.ts",
  AWARDS: "lib/profile.ts",
  PROJECTS: "lib/projects.ts",
  INDUSTRY: "lib/profile.ts",
};

function replaceSection(content: string, key: string, body: string): { next: string; matched: boolean } {
  const start = `<!-- AUTO:${key}:START -->`;
  const end = `<!-- AUTO:${key}:END -->`;
  const re = new RegExp(`${escapeRegex(start)}[\\s\\S]*?${escapeRegex(end)}`, "g");
  if (!re.test(content)) return { next: content, matched: false };
  const hint = SOURCE_HINT[key];
  const note = hint
    ? `<!-- Auto-generated from ${hint} in son-engr-kr.github.io. Do not edit by hand. -->`
    : "";
  const inner = note ? `${note}\n${body}` : body;
  const replaced = content.replace(re, `${start}\n${inner}\n${end}`);
  return { next: replaced, matched: true };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: tsx scripts/generate-readme.ts <path-to-README.md>");
    process.exit(2);
  }
  const path = resolve(target);
  const original = readFileSync(path, "utf8");
  let content = original;
  const missing: string[] = [];
  const updated: string[] = [];

  for (const [key, generate] of Object.entries(sections)) {
    const body = generate();
    const { next, matched } = replaceSection(content, key, body);
    if (!matched) {
      missing.push(key);
    } else if (next !== content) {
      updated.push(key);
      content = next;
    }
  }

  if (missing.length > 0) {
    const msg = `Markers not found in ${path}: ${missing.join(
      ", "
    )}. Add <!-- AUTO:KEY:START --> and <!-- AUTO:KEY:END --> pairs from scripts/profile-readme.template.md.`;
    console.error(msg);
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::warning::${msg}`);
    }
  }

  if (content === original) {
    console.log("No changes.");
    process.exit(0);
  }

  writeFileSync(path, content);
  console.log(`Updated sections: ${updated.join(", ")}`);
}

main();
