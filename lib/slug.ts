/** URL-safe slug from display title (fallback `changelog` if empty). */
export function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)

  return s.length > 0 ? s : "changelog"
}
