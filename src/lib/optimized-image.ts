import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

// Called only from Astro frontmatter: static builds emit files in dist/_astro.
// React receives the generated URL and never needs a runtime image endpoint.
export function optimizedImage(src: ImageMetadata, maxWidth = 1600) {
  return getImage({
    src,
    width: Math.min(src.width, maxWidth),
    format: "webp",
    quality: 80,
  });
}
