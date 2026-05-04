"use client"

import * as React from "react"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { normalizeChangelogComposeValues } from "@/lib/changelog/normalize-compose-values"
import { parsePublishedAtLocal } from "@/lib/changelog/published-at-local"
import { ChangelogComposePanel } from "@/components/changelog/changelog-compose-panel"

export type ChangelogEntryFormMode = "create" | "edit"

type SubmitArgs = {
  values: ChangelogComposeFormValues
  normalized: ReturnType<typeof normalizeChangelogComposeValues>
  publishedAt: string
  composeForm: UseFormReturn<ChangelogComposeFormValues>
}

export type ChangelogEntryFormContext = {
  composeForm: UseFormReturn<ChangelogComposeFormValues>
  composeTitle: string
}

type ModeCosmetics = {
  sectionTitle: string
  bodyClassName: string
  submitLabel: string
  submitPendingLabel: string
}

const MODE_COSMETICS: Record<ChangelogEntryFormMode, ModeCosmetics> = {
  create: {
    sectionTitle: "Compose",
    bodyClassName:
      "max-h-[min(34vh,280px)] min-h-[min(30vh,220px)] resize-y overflow-y-auto font-mono text-sm",
    submitLabel: "Add entry",
    submitPendingLabel: "Adding\u2026",
  },
  edit: {
    sectionTitle: "Entry details",
    bodyClassName:
      "min-h-[min(42vh,320px)] resize-y overflow-y-auto font-mono text-sm",
    submitLabel: "Save changes",
    submitPendingLabel: "Saving\u2026",
  },
}

type CommonProps = {
  mode: ChangelogEntryFormMode
  composeForm: UseFormReturn<ChangelogComposeFormValues>

  renderPreCompose?: (ctx: ChangelogEntryFormContext) => React.ReactNode

  submitPending: boolean
  onSubmit: (args: SubmitArgs) => Promise<void> | void

  leadingActionSlot?: React.ReactNode
}

export function ChangelogEntryForm({
  mode,
  composeForm,
  renderPreCompose,
  submitPending,
  onSubmit,
  leadingActionSlot,
}: CommonProps) {
  const cosmetics = MODE_COSMETICS[mode]
  const { handleSubmit } = composeForm

  const composeTitle = composeForm.watch("title")
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const onSubmitEntry = handleSubmit(async (values) => {
    const publishedAt = parsePublishedAtLocal(values.publishedAtLocal)
    if (!publishedAt) {
      toast.error("Choose a valid release date")
      return
    }

    const normalized = normalizeChangelogComposeValues(values)
    try {
      await onSubmit({ values, normalized, publishedAt, composeForm })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  })

  return (
    <div className="min-h-0 min-w-0">
      {renderPreCompose ? (
        <div className="mb-4">
          {renderPreCompose({ composeForm, composeTitle })}
        </div>
      ) : null}
      <ChangelogComposePanel
        composeForm={composeForm}
        previewOpen={previewOpen}
        onPreviewOpenChange={setPreviewOpen}
        submitPending={submitPending}
        onSubmitEntry={onSubmitEntry}
        sectionTitle={cosmetics.sectionTitle}
        bodyClassName={cosmetics.bodyClassName}
        submitLabel={cosmetics.submitLabel}
        submitPendingLabel={cosmetics.submitPendingLabel}
        leadingActionSlot={leadingActionSlot}
      />
    </div>
  )
}
