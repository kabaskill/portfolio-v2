export const projectCategories = [
  { value: "development-design", label: "Development & Design" },
  { value: "sound-music", label: "Sound & Music" },
] as const;

export type ProjectCategory = (typeof projectCategories)[number]["value"];

export function getProjectCategoryLabel(category: ProjectCategory) {
  return projectCategories.find((item) => item.value === category)?.label ?? category;
}

export function getProjectPath(project: { slug: string; experiment: boolean }) {
  return project.experiment ? `/experiments/${project.slug}` : `/work/${project.slug}`;
}
