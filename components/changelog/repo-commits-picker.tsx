"use client"

import { format, parseISO } from "date-fns"
import { GitBranchIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type GithubCommitRow = {
  sha: string
  shortSha: string
  subject: string
  authorDate: string
  htmlUrl: string
}

type RepoCommitsPickerProps = {
  commits: GithubCommitRow[]
  selected: ReadonlySet<string>
  loadError?: string | null
  selectionError?: string | null
  onToggleSha: (sha: string, checked: boolean) => void
  onSelectAll: () => void
  onSelectNone: () => void
}

export function RepoCommitsPicker({
  commits,
  selected,
  loadError,
  selectionError,
  onToggleSha,
  onSelectAll,
  onSelectNone,
}: RepoCommitsPickerProps) {
  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 py-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            Commits
          </span>
          {commits.length > 0 ? (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {selected.size}/{commits.length}
            </span>
          ) : (
            <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
              Awaiting fetch
            </span>
          )}
          {selectionError ? (
            <span className="text-xs text-destructive" role="alert">
              {selectionError}
            </span>
          ) : null}
        </div>
        {commits.length > 0 ? (
          <div className="flex shrink-0 flex-wrap gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7"
              onClick={onSelectAll}
            >
              All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={onSelectNone}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] border-t border-border/40 pt-1">
        {commits.length === 0 ? (
          <div
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/55 bg-muted/25 px-5 py-8 text-center sm:min-h-48"
            role="status"
          >
            <div className="flex size-10 items-center justify-center rounded-full border border-border/40 bg-background/80 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <GitBranchIcon className="size-5" weight="duotone" aria-hidden />
            </div>
            <p className="font-heading text-sm font-medium tracking-tight text-foreground">
              {loadError ? "Could not load commits" : "No commits loaded"}
            </p>
            <p className="max-w-70 text-xs leading-relaxed text-muted-foreground">
              {loadError
                ? loadError
                : "Set repo URL, branch, and date range, then use Fetch commits to load history for draft generation."}
            </p>
          </div>
        ) : (
          <table
            className={cn(
              "w-full table-fixed caption-bottom border-collapse text-xs",
              "[&_td]:p-1.5 [&_th]:h-8 [&_th]:px-2 [&_th]:py-1"
            )}
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-19 whitespace-nowrap">Date</TableHead>
                <TableHead className="min-w-0">Subject</TableHead>
                <TableHead className="w-18 font-mono">SHA</TableHead>
                <TableHead className="w-9 text-end [&:has([role=checkbox])]:pr-2">
                  <span className="sr-only">Select</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commits.map((c) => (
                <TableRow key={c.sha}>
                  <TableCell className="py-1.5 text-[0.6875rem] whitespace-nowrap text-muted-foreground tabular-nums">
                    {format(parseISO(c.authorDate), "MMM d HH:mm")}
                  </TableCell>
                  <TableCell className="max-w-0 min-w-0 truncate py-1.5 text-[0.6875rem]">
                    {c.subject}
                  </TableCell>
                  <TableCell className="py-1.5 font-mono text-[0.6875rem] leading-none">
                    <a
                      href={c.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {c.shortSha}
                    </a>
                  </TableCell>
                  <TableCell className="w-9 py-1.5 text-end">
                    <Checkbox
                      checked={selected.has(c.sha)}
                      onCheckedChange={(v) => onToggleSha(c.sha, v === true)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        )}
      </div>
    </>
  )
}
