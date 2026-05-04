import type { UseFormReturn } from "react-hook-form"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { formatPublishedAtLocal } from "@/lib/changelog/published-at-local"
import { mergeUniqueTags } from "@/lib/changelog/tag-utils"

export type ChangelogDraftPayload = {
  title: string
  summary: string
  bodyMarkdown: string
  suggestedPublishedAt?: string
  category?: string
  breaking?: boolean
  tags?: string[]
}

export function applyDraftToCompose(
  composeForm: UseFormReturn<ChangelogComposeFormValues>,
  data: ChangelogDraftPayload
): void {
  const { setValue, getValues } = composeForm

  setValue("title", data.title)
  setValue("summary", data.summary)
  setValue("body", data.bodyMarkdown)
  setValue("breaking", Boolean(data.breaking))

  if (data.category) {
    setValue("category", data.category)
  }

  if (data.suggestedPublishedAt) {
    const publishedAtLocal = formatPublishedAtLocal(data.suggestedPublishedAt)
    if (publishedAtLocal) {
      setValue("publishedAtLocal", publishedAtLocal)
    }
  }

  if (data.tags?.length) {
    setValue("tags", mergeUniqueTags(getValues("tags"), data.tags))
  }
}
