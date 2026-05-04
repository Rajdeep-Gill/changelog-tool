"use client"

import { EntryTags } from "@/components/changelog/entry-tags"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatChangelogDate } from "@/lib/changelog/date-format"
import type { ChangelogEntry } from "@/lib/changelog/types"

type ChangelogEntryViewProps = {
  entry: ChangelogEntry
}

export function ChangelogEntryView({ entry }: ChangelogEntryViewProps) {
  const formattedDate = formatChangelogDate(entry.publishedAt, "long")

  return (
    <>
      <header className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <time
            className="text-sm text-muted-foreground tabular-nums"
            dateTime={entry.publishedAt}
          >
            {formattedDate}
          </time>
          {entry.category ? <Badge variant="secondary">{entry.category}</Badge> : null}
          {entry.breaking ? <Badge variant="destructive">Breaking</Badge> : null}
          <EntryTags tags={entry.tags} />
        </div>
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {entry.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {entry.summary}
        </p>
      </header>

      <Separator className="mb-5" />

      <MarkdownBody className="pb-2">{entry.body}</MarkdownBody>
    </>
  )
}
