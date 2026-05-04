import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"

export type NormalizedChangelogComposeValues = {
  title: string
  summary: string
  body: string
  category: string | null
  breaking: boolean
  tags: string[] | null
}

export function normalizeChangelogComposeValues(
  values: ChangelogComposeFormValues
): NormalizedChangelogComposeValues {
  return {
    title: values.title,
    summary: values.summary,
    body: values.body,
    category: values.category.trim() || null,
    breaking: values.breaking,
    tags: values.tags.length > 0 ? values.tags : null,
  }
}

