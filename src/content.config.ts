import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  slug: z.string(),
  cover: z.string(),
  alt: z.string(),
  disciplines: z.array(z.enum(["development", "design", "sound", "music", "experiment"])),
  tags: z.array(z.string()).default([]),
  year: z.number().optional(),
  role: z.string().optional(),
  featured: z.boolean().default(false),
  spatial: z.boolean().default(false),
  published: z.boolean().default(true),
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  embeds: z
    .array(
      z.object({
        provider: z.enum(["youtube", "vimeo", "spotify"]),
        title: z.string(),
        url: z.string(),
      }),
    )
    .default([]),
  gallery: z
    .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
    .default([]),
});

const postSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  publishedAt: z.coerce.date(),
  cover: z.string().optional(),
});

export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
    schema: projectSchema,
  }),
  posts: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
    schema: postSchema,
  }),
};
