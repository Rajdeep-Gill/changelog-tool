"use client"

import { Controller, type Control } from "react-hook-form"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import {
  type GithubCommitRow,
  RepoCommitsPicker,
} from "@/components/changelog/repo-commits-picker"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type CreateChangelogDraftPanelProps = {
  commits: GithubCommitRow[]
  selected: ReadonlySet<string>
  loadError?: string | null
  commitSelectionError: string | null
  onToggleSha: (sha: string, checked: boolean) => void
  onSelectAll: () => void
  onSelectNone: () => void
  composeControl: Control<ChangelogComposeFormValues>
  generateDraftDisabled: boolean
  draftMutationPending: boolean
  /** Bound to validated repo-window submit handler (runs draft mutation inside). */
  onGenerateDraft: () => void
}

export function CreateChangelogDraftPanel({
  commits,
  selected,
  loadError,
  commitSelectionError,
  onToggleSha,
  onSelectAll,
  onSelectNone,
  composeControl,
  generateDraftDisabled,
  draftMutationPending,
  onGenerateDraft,
}: CreateChangelogDraftPanelProps) {
  return (
    <>
      <RepoCommitsPicker
        commits={commits}
        selected={selected}
        loadError={loadError}
        selectionError={commitSelectionError}
        onToggleSha={onToggleSha}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
      />

      <div className="shrink-0 space-y-2 border-t border-border/40 pt-3 pb-1">
        <Controller
          name="draftAdditionalContext"
          control={composeControl}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Additional context for AI
              </FieldLabel>
              <Textarea
                id={field.name}
                rows={3}
                placeholder="Audience, tone, product areas to emphasize, known caveats…"
                className="min-h-[72px] resize-y text-sm"
                aria-invalid={fieldState.invalid}
                {...field}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={generateDraftDisabled}
          onClick={onGenerateDraft}
        >
          {draftMutationPending ? (
            <>
              <Spinner className="size-4" />
              Generating…
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>
    </>
  )
}
