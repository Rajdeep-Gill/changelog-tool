export const changelogQueryKeys = {
  all: ["changelog"] as const,
  list: () => [...changelogQueryKeys.all, "list"] as const,
  detail: (slug: string) =>
    [...changelogQueryKeys.all, "detail", slug] as const,
}
