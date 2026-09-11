import type { CollectionEntry } from "astro:content";

export type ProjectCategory = CollectionEntry<"projects">["data"]["categories"][number];
export type Project = {
  title: string;
  slug: string;
  cover: string;
  summary: string;
  categories: ProjectCategory[];
  link: string | null;
};
export type Arrangement = "orbit" | "constellation";
export type ScenePalette = Record<"background" | "foreground" | "muted" | "surface" | "border" | "accent", string>;
export const categories: { label: string; short: string; value: ProjectCategory }[] = [
  { value: "development-design", label: "Design & development", short: "Design & code" },
  { value: "sound-music", label: "Sound & music", short: "Sound & music" },
  { value: "experiment", label: "Experiments", short: "Experiments" },
];
