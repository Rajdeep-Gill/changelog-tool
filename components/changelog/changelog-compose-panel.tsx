"use client"

import * as React from "react"
import { Eye } from "@phosphor-icons/react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { ChangelogComposePreviewDialog } from "@/components/changelog/changelog-compose-preview-dialog"
import { ComposeTagsField } from "@/components/changelog/compose-tags-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type ChangelogComposePanelProps = {
  composeForm: UseFormReturn<ChangelogComposeFormValues>
  previewOpen: boolean
  onPreviewOpenChange: (open: boolean) => void
  submitPending: boolean
  onSubmitEntry: () => void
  sectionTitle?: string
  bodyClassName?: string
  submitLabel?: string
  submitPendingLabel?: string
  leadingActionSlot?: React.ReactNode
}

export function ChangelogComposePanel({
  composeForm,
  previewOpen,
  onPreviewOpenChange,
  submitPending,
  onSubmitEntry,
  sectionTitle = "Compose",
  bodyClassName = "max-h-[min(34vh,280px)] min-h-[min(30vh,220px)] resize-y overflow-y-auto font-mono text-sm",
  submitLabel = "Add entry",
  submitPendingLabel = "Adding…",
  leadingActionSlot,
}: ChangelogComposePanelProps) {
  const { control } = composeForm
  const tags = useWatch({ control, name: "tags" }) ?? []
  const previewValues = useWatch({
    control,
    name: ["publishedAtLocal", "category", "title", "summary", "breaking", "body"],
  })
  const [
    publishedAtLocal = "",
    category = "",
    title = "",
    summary = "",
    breaking = false,
    body = "",
  ] = previewValues ?? []

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-h-0">
      <div className="mb-2 flex min-h-9 shrink-0 flex-row flex-wrap items-center border-b border-border/40 pb-2">
        <h2 className="font-heading text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {sectionTitle}
        </h2>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 [-webkit-overflow-scrolling:touch] sm:px-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmitEntry()
        }}
      >
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input id="title" aria-invalid={fieldState.invalid} {...field} />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="summary"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Summary</FieldLabel>
                <Textarea
                  id="summary"
                  className="min-h-[80px]"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <Controller
            name="body"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                <Textarea
                  id="body"
                  className={bodyClassName}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="publishedAtLocal"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Release date</FieldLabel>
                  <Input
                    id={field.name}
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  <Input id="category" aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </div>
          <ComposeTagsField composeForm={composeForm} />
          <Controller
            name="breaking"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                orientation="horizontal"
                data-invalid={fieldState.invalid}
                className="items-center gap-2"
              >
                <Checkbox
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel htmlFor={field.name} className="font-normal">
                  Breaking
                </FieldLabel>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>
        <Separator className="my-1 bg-border/60" />
        <div className="shrink-0 pb-1">
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            {leadingActionSlot ? (
              <div className="flex flex-wrap gap-2">{leadingActionSlot}</div>
            ) : null}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                disabled={submitPending}
                onClick={() => onPreviewOpenChange(true)}
              >
                <Eye aria-hidden className="size-4 shrink-0" weight="regular" />
                Preview
              </Button>
              <ChangelogComposePreviewDialog
                open={previewOpen}
                onOpenChange={onPreviewOpenChange}
                publishedAtLocal={publishedAtLocal}
                category={category}
                title={title}
                summary={summary}
                breaking={breaking}
                tags={tags}
                body={body}
              />
              <Button
                type="submit"
                disabled={submitPending}
                className={cn(
                  "w-full sm:w-auto sm:min-w-40",
                  submitPending && "gap-2"
                )}
              >
                {submitPending ? (
                  <>
                    <Spinner className="size-4" />
                    {submitPendingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
