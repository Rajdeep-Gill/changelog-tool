"use client"

import { format } from "date-fns"

import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { EntryTags } from "@/components/changelog/entry-tags"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

function previewDateFromLocalInput(local: string): {
  label: string
  dateTime?: string
} {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) {
    return { label: "Invalid date" }
  }
  return { label: format(d, "MMM d, yyyy"), dateTime: d.toISOString() }
}

export type ChangelogComposePreviewData = Pick<
  ChangelogComposeFormValues,
  | "publishedAtLocal"
  | "category"
  | "title"
  | "summary"
  | "breaking"
  | "tags"
  | "body"
>

type ChangelogComposePreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
} & ChangelogComposePreviewData

export function ChangelogComposePreviewDialog({
  open,
  onOpenChange,
  publishedAtLocal,
  category,
  title,
  summary,
  breaking,
  tags,
  body,
}: ChangelogComposePreviewDialogProps) {
  const { label: dateLabel, dateTime } =
    previewDateFromLocalInput(publishedAtLocal)
  const trimmedCategory = category.trim()
  const displayTitle = title.trim() || "(No title)"
  const displaySummary = summary.trim() || "No summary yet."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,880px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden border bg-popover p-0 shadow-lg sm:w-full sm:max-w-3xl">
        <DialogTitle className="sr-only">Changelog entry preview</DialogTitle>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <header className="pb-10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <time
                  className="text-[0.9375rem] text-muted-foreground tabular-nums"
                  {...(dateTime ? { dateTime } : {})}
                >
                  {dateLabel}
                </time>
                {trimmedCategory ? (
                  <Badge variant="secondary">{trimmedCategory}</Badge>
                ) : null}
                {breaking ? <Badge variant="destructive">Breaking</Badge> : null}
                <EntryTags tags={tags.length > 0 ? tags : undefined} />
              </div>
              <p className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {displayTitle}
              </p>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
                {displaySummary}
              </p>
            </header>
            <Separator className="mb-10" />
            {body.trim() ? (
              <MarkdownBody className="pb-2">{body}</MarkdownBody>
            ) : (
              <p className="text-[0.9375rem] italic text-muted-foreground">
                No body yet — add markdown in the editor.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
