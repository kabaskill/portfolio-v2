import type { ImageMetadata } from "astro";

const projectImages = import.meta.glob("../assets/images/*", {
  eager: true,
  import: "default",
}) as Record<string, ImageMetadata>;

export function getProjectImage(path: string): ImageMetadata {
  const filename = path.split("/").pop();
  if (!filename) throw new Error(`Invalid project image path: ${path}`);

  const image = projectImages[`../assets/images/${filename}`];
  if (!image) throw new Error(`Project image not found: ${path}`);

  return image;
}
