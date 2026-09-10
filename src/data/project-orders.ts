import type { CollectionEntry } from "astro:content";
import orders from "./project-orders.json";

const orderIndexes = new Map(
  orders.map(({ id, slugs }) => [id, new Map(slugs.map((slug, index) => [slug, index]))]),
);

export function sortProjects(
  projects: CollectionEntry<"projects">[],
  orderId: string,
) {
  const order = orderIndexes.get(orderId);

  return [...projects].sort((a, b) => {
    const aIndex = order?.get(a.data.slug);
    const bIndex = order?.get(b.data.slug);

    if (aIndex === undefined && bIndex !== undefined) return -1;
    if (aIndex !== undefined && bIndex === undefined) return 1;

    return (aIndex ?? 0) - (bIndex ?? 0) || a.data.title.localeCompare(b.data.title);
  });
}
