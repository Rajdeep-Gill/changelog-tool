"use client"

import { format, parseISO } from "date-fns"
import { GitBranchIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

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

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch] border-t border-border/40 px-1.5 pt-1">
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
          <div
            className="flex w-full min-w-0 flex-col text-xs"
            role="grid"
            aria-label="Commits"
          >
            <div
              className="grid w-full grid-cols-[2.25rem_3rem_minmax(12rem,1fr)] items-stretch border-b border-border/40"
              role="row"
            >
              <div
                className="flex items-center justify-center border-0 px-1 py-2"
                role="columnheader"
              >
                <span className="sr-only">Checkbox</span>
              </div>
              <div
                className="flex items-center border-0 px-1.5 py-2 text-[0.6875rem] font-medium whitespace-nowrap text-muted-foreground"
                role="columnheader"
              >
                Date
              </div>
              <div
                className="flex items-center border-0 px-1.5 py-2 text-[0.6875rem] font-medium whitespace-nowrap text-muted-foreground"
                role="columnheader"
              >
                Commit message
              </div>
            </div>
            {commits.map((c) => {
              const isSelected = selected.has(c.sha)
              const toggleRow = () => onToggleSha(c.sha, !isSelected)
              return (
                <div
                  key={c.sha}
                  role="row"
                  data-state={isSelected ? "selected" : undefined}
                  className="grid w-full grid-cols-[2.25rem_3rem_minmax(12rem,1fr)] items-stretch cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  tabIndex={0}
                  onClick={toggleRow}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggleRow()
                    }
                  }}
                >
                  <div
                    className="flex items-center justify-center py-1.5"
                    role="gridcell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) =>
                        onToggleSha(c.sha, v === true)
                      }
                    />
                  </div>
                  <div
                    className="flex min-w-0 items-center px-1 py-1.5 text-[0.6875rem] text-muted-foreground tabular-nums"
                    role="gridcell"
                  >
                    <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <span className="inline-block whitespace-nowrap">
                        {format(parseISO(c.authorDate), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex min-w-0 items-center px-1.5 py-1.5 text-[0.6875rem]"
                    role="gridcell"
                  >
                    <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <a
                        href={c.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={c.subject}
                        className="inline-block whitespace-nowrap text-primary underline underline-offset-4 decoration-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.subject}
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
