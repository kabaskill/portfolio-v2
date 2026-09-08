# Astro portfolio prototype

This is the first migration slice from the Next.js/Payload portfolio.

## Local development

```bash
bun install
bun run dev
```

## Verification

```bash
bun run check
bun run build
```

## Current scope

- Static Astro site with typed Markdown content collections
- Work, experiments, journal, detail, 404, and spatial gallery routes
- All 39 projects from the Payload seed and one journal entry migrated to Markdown
- YouTube, Vimeo, and Spotify embeds migrated into reusable Astro media blocks
- React Three Fiber island at `/threescene` with real project covers, category filtering, selection, navigation, links, and an accessible fallback list
- Current Next.js/Payload application remains untouched

## Updating project content

Project pages live in `src/content/projects`. Edit a Markdown file, add or replace a project image in `src/assets/images`, and keep its existing `/images/...` cover path in frontmatter. Each project uses one `category` (`development-design` or `sound-music`) and an `experiment` boolean. Astro resolves the cover path through the project image registry and generates optimized variants during the build. The shared display order lives in `src/lib/project-order.ts`. Run `bun run build` to produce the deployable static site. The one-time `bun run migrate:projects` script can fill in any missing project files from the current Payload seed without replacing existing Markdown entries.

Replace the placeholder `site` value in `astro.config.mjs` before production deployment.
