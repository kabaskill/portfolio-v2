import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProjects } from "../../portfolio/src/seed/data.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(scriptDirectory);
const contentDirectory = join(projectDirectory, "src", "content", "projects");
const mergedProjectSlugs = new Set([
  "redesign-kia",
  "redesign-subaru",
  "redesign-up",
  "unity-demo-angry-birds-clone",
  "unity-demo-bedroom-guitarist",
  "p5-js-demo-clock-v1",
  "p5-js-demo-clock-v2",
  "p5-js-demo-game-of-life",
  "p5-js-demo-snake-clone",
]);

mkdirSync(contentDirectory, { recursive: true });

function yaml(value) {
  return JSON.stringify(value);
}

function categoryFromDisciplines(disciplines) {
  const hasDevelopmentDesign = disciplines.some((discipline) =>
    ["development", "design"].includes(discipline),
  );
  const hasSoundMusic = disciplines.some((discipline) => ["sound", "music"].includes(discipline));

  if (hasDevelopmentDesign === hasSoundMusic) {
    throw new Error(`Could not derive a single project category: ${disciplines.join(", ")}`);
  }

  return hasDevelopmentDesign ? "development-design" : "sound-music";
}

function frontmatter(project) {
  const featured = project.promotedIn.includes("homepage");
  const category = categoryFromDisciplines(project.disciplines);
  const experiment = project.disciplines.includes("experiment");
  const lines = [
    `title: ${yaml(project.title)}`,
    `summary: ${yaml(project.summary)}`,
    `slug: ${yaml(project.slug)}`,
    `cover: ${yaml(`/images/${project.asset}`)}`,
    `alt: ${yaml(project.alt)}`,
    `category: ${yaml(category)}`,
    `experiment: ${yaml(experiment)}`,
    `tags: ${yaml(project.tags)}`,
    `featured: ${yaml(featured)}`,
    `published: true`,
    `links: ${yaml(project.links)}`,
    `embeds: ${yaml(project.embeds)}`,
  ];

  if (project.year !== undefined) lines.splice(7, 0, `year: ${yaml(project.year)}`);
  if (project.role !== undefined)
    lines.splice(project.year === undefined ? 7 : 8, 0, `role: ${yaml(project.role)}`);
  return lines.join("\n");
}

const existingFiles = new Set(readdirSync(contentDirectory));
let created = 0;
let skipped = 0;

for (const project of seedProjects) {
  if (mergedProjectSlugs.has(project.slug)) {
    skipped += 1;
    continue;
  }

  const filename = `${project.slug}.md`;
  const destination = join(contentDirectory, filename);

  // Keep the hand-written prototype entries intact; the generated catalogue fills in the rest.
  if (existingFiles.has(filename)) {
    skipped += 1;
    continue;
  }

  const body = project.description
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
  writeFileSync(destination, `---\n${frontmatter(project)}\n---\n\n${body}\n`, "utf8");
  created += 1;
}

console.log(`Migrated ${created} projects; kept ${skipped} existing prototype entries.`);
