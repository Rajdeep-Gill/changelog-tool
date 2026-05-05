"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { format } from "date-fns"
import { CalendarBlankIcon, Eye } from "@phosphor-icons/react"
import { getMarkdown } from "@milkdown/kit/utils"
import { MilkdownProvider, useInstance } from "@milkdown/react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { ChangelogComposeBodyField } from "@/components/changelog/changelog-compose-body-field"
import { ChangelogComposePreviewDialog } from "@/components/changelog/changelog-compose-preview-dialog"
import { ComposeTagsField } from "@/components/changelog/compose-tags-field"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function publishedLocalToDate(local: string): Date | undefined {
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function publishedLocalTimeHm(local: string): string {
  if (local.length >= 16 && local[10] === "T") {
    return local.slice(11, 16)
  }
  return "12:00"
}

function mergePublishedLocalDate(local: string, nextDay: Date): string {
  const prev = publishedLocalToDate(local)
  const merged = new Date(nextDay)
  merged.setHours(
    prev ? prev.getHours() : 12,
    prev ? prev.getMinutes() : 0,
    0,
    0,
  )
  return format(merged, "yyyy-MM-dd'T'HH:mm")
}

function mergePublishedLocalTime(local: string, hm: string): string {
  const datePart =
    local.length >= 10 && local[4] === "-" && local[7] === "-"
      ? local.slice(0, 10)
      : format(new Date(), "yyyy-MM-dd")
  return `${datePart}T${hm}`
}

export type ChangelogComposePanelProps = {
  composeForm: UseFormReturn<ChangelogComposeFormValues>
  /** Remounts the body editor when the loaded entry / generation changes (e.g. edit slug + server payload). */
  composeBodyKey?: string
  previewOpen: boolean
  onPreviewOpenChange: (open: boolean) => void
  submitPending: boolean
  onSubmitEntry: () => void
  sectionTitle?: string
  bodyClassName?: string
  submitLabel?: string
  submitPendingLabel?: string
  leadingActionSlot?: React.ReactNode
  /** Prefer API/fetched markdown until the form reset applies (edit flow). */
  composeBodySeedMarkdown?: string
  /**
   * `viewport` — panel fills height and scrolls internally (create / split layouts).
   * `document` — panel grows with the page; only the body editor scrolls internally.
   */
  scrollLayout?: "viewport" | "document"
}

function ChangelogComposePanelForm({
  composeForm,
  composeBodyKey,
  composeBodySeedMarkdown,
  previewOpen,
  onPreviewOpenChange,
  submitPending,
  onSubmitEntry,
  sectionTitle = "Compose",
  bodyClassName = "w-full font-mono text-sm",
  submitLabel = "Add entry",
  submitPendingLabel = "Adding…",
  leadingActionSlot,
  scrollLayout = "viewport",
}: ChangelogComposePanelProps) {
  const [editorLoading, getEditorInstance] = useInstance()
  const { control, setValue } = composeForm
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

  const syncBodyFromEditor = React.useCallback(() => {
    const editor = getEditorInstance()
    if (!editor) return
    const markdown = editor.action(getMarkdown())
    setValue("body", markdown, { shouldValidate: true, shouldDirty: true })
  }, [getEditorInstance, setValue])

  const syncBodyMarkdownFromTyping = React.useCallback(
    (markdown: string) => {
      setValue("body", markdown, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    },
    [setValue],
  )

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editorLoading) return
    syncBodyFromEditor()
    onSubmitEntry()
  }

  const handlePreviewOpen = () => {
    if (editorLoading) return
    flushSync(() => {
      syncBodyFromEditor()
    })
    onPreviewOpenChange(true)
  }

  const busy = submitPending || editorLoading
  const isDocumentLayout = scrollLayout === "document"

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        !isDocumentLayout && "min-h-0 flex-1 overflow-hidden",
      )}
    >
      <form
        className={cn(
          "flex min-w-0 flex-col",
          !isDocumentLayout && "min-h-0 flex-1 overflow-hidden",
        )}
        onSubmit={handleFormSubmit}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col",
            !isDocumentLayout &&
              "min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          )}
        >
          <div className="mb-2 flex min-h-9 shrink-0 flex-wrap items-center border-b border-border/40 pb-2">
            <h2 className="font-heading text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {sectionTitle}
            </h2>
          </div>
          <div
            className={cn(
              "flex flex-col gap-3 pb-3 pt-1",
              !isDocumentLayout && "min-h-0 flex-1",
            )}
          >
          <div className="shrink-0 space-y-3">
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
          </div>
          <Controller
            name="body"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={cn(
                  "flex min-w-0 flex-col gap-2",
                  isDocumentLayout
                    ? "h-[min(50vh,420px)] min-h-[min(42vh,320px)]"
                    : "min-h-[min(42vh,320px)] flex-1",
                )}
              >
                <FieldLabel htmlFor={field.name}>Body</FieldLabel>
                <ChangelogComposeBodyField
                  key={composeBodyKey ?? "compose-body"}
                  id={field.name}
                  initialMarkdown={
                    field.value && field.value.length > 0
                      ? field.value
                      : (composeBodySeedMarkdown ?? "")
                  }
                  onMarkdownChange={syncBodyMarkdownFromTyping}
                  className={cn("min-h-0 flex-1", bodyClassName)}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
          <div className="min-h-0 shrink-0 space-y-3 pb-0.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="publishedAtLocal"
              control={control}
              render={({ field, fieldState }) => {
                const selected = publishedLocalToDate(field.value)
                const timeHm = publishedLocalTimeHm(field.value)
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Release date</FieldLabel>
                    <div className="flex min-w-0 flex-row items-center gap-2">
                      <Popover>
                        <PopoverTrigger
                          id={field.name}
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              aria-invalid={fieldState.invalid}
                              className={cn(
                                "min-w-0 flex-1 justify-start gap-2 px-2.5 font-normal",
                                fieldState.invalid && "border-destructive",
                              )}
                            >
                              <CalendarBlankIcon className="size-4 shrink-0 opacity-70" />
                              {selected ? (
                                format(selected, "LLL dd, y")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a date
                                </span>
                              )}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            defaultMonth={selected}
                            selected={selected}
                            onSelect={(day) => {
                              if (!day) return
                              field.onChange(mergePublishedLocalDate(field.value, day))
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        step={60}
                        value={timeHm}
                        aria-label="Release time"
                        className="w-25 shrink-0 font-variant-numeric tabular-nums"
                        onChange={(e) => {
                          field.onChange(
                            mergePublishedLocalTime(field.value, e.target.value),
                          )
                        }}
                      />
                    </div>
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )
              }}
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
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 border-t border-border/50 bg-background pt-2 pb-1",
            isDocumentLayout &&
              "sticky bottom-0 z-30 pt-3.5 pb-[max(0.875rem,calc(env(safe-area-inset-bottom)+0.5rem))]",
          )}
        >
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-center sm:justify-between",
              isDocumentLayout ? "gap-3.5" : "gap-3",
            )}
          >
            {leadingActionSlot ? (
              <div className="flex flex-wrap gap-2">{leadingActionSlot}</div>
            ) : null}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className={cn("w-full sm:w-auto", "gap-2")}
                disabled={busy}
                onClick={handlePreviewOpen}
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
                disabled={busy}
                className={cn(
                  "w-full sm:w-auto sm:min-w-40",
                  submitPending && "gap-2",
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

export function ChangelogComposePanel(props: ChangelogComposePanelProps) {
  return (
    <MilkdownProvider>
      <ChangelogComposePanelForm {...props} />
    </MilkdownProvider>
  )
}
