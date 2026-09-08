export const projectOrder = [
  "unides-yawara",
  "naviri",
  "formenwerkstatt",
  "sound-showreel",
  "logo-design",
  "tapari-spielwelt",
  "con-b-podcast",
  "benzersiz",
  "caravan-travels-of-an-ancient-civilization",
  "mevlana-s-744th-birthday",
  "aksu-candy",
  "human-unknown",
  "philips-infomercials",
  "blof",
  "arpedduo",
  "artern-lost-generation",
  "an-ordinary-day",
  "soul-of-the-light",
  "gamble",
  "zero",
  "personal-music-projects",
  "sound-redesigns",
  "10th-village",
  "odemis-yem-infomercial",
  "klein-verhaal-over-een-muzikant",
  "droplet",
  "blitz-cache",
  "blitz-react",
  "doner-html-transpiler",
  "3d-portfolio",
  "fugue-state",
  "gamedalf",
  "metanoia",
  "saya",
  "rubby-the-duck-tbd",
  "unity-demos",
  "p5-js-experiments",
] as const;

const projectOrderIndex = new Map<string, number>(projectOrder.map((slug, index) => [slug, index]));

export function sortProjects<T extends { data: { slug: string; title: string } }>(projects: T[]) {
  return [...projects].sort((a, b) => {
    const aIndex = projectOrderIndex.get(a.data.slug) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = projectOrderIndex.get(b.data.slug) ?? Number.MAX_SAFE_INTEGER;

    return aIndex - bIndex || a.data.title.localeCompare(b.data.title);
  });
}
