import { defineCollection, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    summary: z.string(),
    slug: z.string(),
    cover: image(),
    alt: z.string(),
    categories: z
      .array(z.enum(["development-design", "sound-music", "experiment"]))
      .min(1),
    showInWork: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    year: z.number().nullable().default(null),
    role: z.string().nullable().default(null),
    featured: z.boolean().default(false),
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
      .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
      .default([]),
  });

const postSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  publishedAt: z.coerce.date(),
  cover: z.string().nullable().default(null),
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
