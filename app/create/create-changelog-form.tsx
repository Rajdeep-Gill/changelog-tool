"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { endOfDay, format, formatISO, parseISO, startOfDay } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Eye, GitBranchIcon, XIcon } from "@phosphor-icons/react"

import { changelogQueryKeys } from "@/hooks/use-changelog-queries"
import { DEFAULT_CHANGELOG_TAGS } from "@/lib/changelog/default-tags"
import { parseGithubRepoInput } from "@/lib/changelog/parse-github-repo-url"
import {
  type RepoWindowFormValues,
  repoWindowFormSchema,
} from "@/lib/changelog/repo-window-form-schema"
import type { ChangelogEntry } from "@/lib/changelog/types"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { EntryTags } from "@/components/changelog/entry-tags"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import { changelogBreadcrumbRowClassName } from "@/components/changelog/layout-classes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type GithubCommitRow = {
  sha: string
  shortSha: string
  subject: string
  authorDate: string
  htmlUrl: string
}

function normalizeTagLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ")
}

function mergeUniqueTags(existing: string[], additions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of [...existing, ...additions]) {
    const n = normalizeTagLabel(t)
    if (!n) continue
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
  }
  return out
}

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

type CreateChangelogFormProps = {
  defaultRepoString?: string
}

export function CreateChangelogForm({
  defaultRepoString = "",
}: CreateChangelogFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const parsedDefault = React.useMemo(() => {
    const p = parseGithubRepoInput(defaultRepoString)
    if (!p) return ""
    return `https://github.com/${p.owner}/${p.repo}`
  }, [defaultRepoString])

  const repoWindowDefaults = React.useMemo((): RepoWindowFormValues => {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - 14)
    return {
      repoUrl: parsedDefault,
      branch: "main",
      dateFrom,
      dateTo: new Date(),
    }
  }, [parsedDefault])

  const repoForm = useForm<RepoWindowFormValues>({
    resolver: standardSchemaResolver(repoWindowFormSchema),
    defaultValues: repoWindowDefaults,
  })
  const {
    control: repoControl,
    handleSubmit: handleRepoSubmit,
    reset: resetRepoWindow,
  } = repoForm

  React.useEffect(() => {
    resetRepoWindow(repoWindowDefaults)
  }, [repoWindowDefaults, resetRepoWindow])

  const [commits, setCommits] = React.useState<GithubCommitRow[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())

  const [title, setTitle] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [body, setBody] = React.useState("")
  const [publishedAtLocal, setPublishedAtLocal] = React.useState(() =>
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [category, setCategory] = React.useState("")
  const [breaking, setBreaking] = React.useState(false)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
  const [commitSelectionError, setCommitSelectionError] = React.useState<
    string | null
  >(null)
  const [draftAdditionalContext, setDraftAdditionalContext] = React.useState("")
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const tagsScrollRef = React.useRef<HTMLDivElement>(null)
  const [tagsScrollFade, setTagsScrollFade] = React.useState({
    left: false,
    right: false,
  })

  const presetTagKeySet = React.useMemo(
    () => new Set(DEFAULT_CHANGELOG_TAGS.map((t) => t.toLowerCase())),
    []
  )

  const customTags = React.useMemo(
    () => tags.filter((t) => !presetTagKeySet.has(t.toLowerCase())),
    [tags, presetTagKeySet]
  )

  const updateTagsScrollFade = React.useCallback(() => {
    const el = tagsScrollRef.current
    if (!el) {
      setTagsScrollFade({ left: false, right: false })
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = el
    const overflow = scrollWidth - clientWidth
    const eps = 4
    setTagsScrollFade({
      left: scrollLeft > eps,
      right: overflow > eps && scrollLeft < overflow - eps,
    })
  }, [])

  React.useLayoutEffect(() => {
    updateTagsScrollFade()
    const el = tagsScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      updateTagsScrollFade()
    })
    ro.observe(el)
    window.addEventListener("resize", updateTagsScrollFade)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", updateTagsScrollFade)
    }
  }, [updateTagsScrollFade, tags, customTags])

  const addTagsFromInput = () => {
    const n = normalizeTagLabel(tagInput)
    if (!n) return
    setTags((prev) => mergeUniqueTags(prev, [n]))
    setTagInput("")
  }

  const toggleSuggestedTag = (label: string) => {
    const key = label.toLowerCase()
    setTags((prev) => {
      const has = prev.some((t) => t.toLowerCase() === key)
      if (has) {
        return prev.filter((t) => t.toLowerCase() !== key)
      }
      return mergeUniqueTags(prev, [label])
    })
  }

  const removeTag = (label: string) => {
    const key = label.toLowerCase()
    setTags((prev) => prev.filter((t) => t.toLowerCase() !== key))
  }

  const toggleSha = (sha: string, checked: boolean) => {
    if (checked) {
      setCommitSelectionError(null)
    }
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(sha)
      else next.delete(sha)
      return next
    })
  }

  const loadCommits = useMutation({
    mutationFn: async (data: RepoWindowFormValues) => {
      const parsed = parseGithubRepoInput(data.repoUrl)!
      const { owner, repo } = parsed
      const since = formatISO(startOfDay(data.dateFrom))
      const until = formatISO(endOfDay(data.dateTo))
      const qs = new URLSearchParams({
        owner,
        repo,
        since,
        until,
      })
      if (data.branch.trim()) {
        qs.set("sha", data.branch.trim())
      }
      const res = await fetch(`/api/github/commits?${qs}`)
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string
          hint?: string
        }
        throw new Error(j.hint ?? j.error ?? res.statusText)
      }
      const payload = (await res.json()) as { commits: GithubCommitRow[] }
      return payload.commits
    },
    onSuccess: (list) => {
      setCommits(list)
      setSelected(new Set())
      toast.success(`${list.length} commits`)
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const draftMutation = useMutation({
    mutationFn: async () => {
      const window = repoForm.getValues()
      const parsed = parseGithubRepoInput(window.repoUrl)!
      const { owner, repo } = parsed
      const shas = [...selected]
      const since = formatISO(startOfDay(window.dateFrom))
      const until = formatISO(endOfDay(window.dateTo))
      const ctx = draftAdditionalContext.trim()
      const res = await fetch("/api/changelog/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: window.branch.trim() || undefined,
          since,
          until,
          commitShas: shas,
          ...(ctx ? { additionalContext: ctx } : {}),
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? res.statusText)
      }
      return res.json() as Promise<{
        title: string
        summary: string
        bodyMarkdown: string
        suggestedPublishedAt?: string
        category?: string
        breaking?: boolean
        tags?: string[]
      }>
    },
    onSuccess: (data) => {
      setTitle(data.title)
      setSummary(data.summary)
      setBody(data.bodyMarkdown)
      if (data.category) setCategory(data.category)
      setBreaking(Boolean(data.breaking))
      if (data.tags?.length) {
        setTags((prev) => mergeUniqueTags(prev, data.tags ?? []))
      }
      if (data.suggestedPublishedAt) {
        try {
          const d = parseISO(
            data.suggestedPublishedAt.length <= 10
              ? `${data.suggestedPublishedAt}T12:00:00`
              : data.suggestedPublishedAt
          )
          if (!Number.isNaN(d.getTime())) {
            setPublishedAtLocal(format(d, "yyyy-MM-dd'T'HH:mm"))
          }
        } catch {
          /* ignore */
        }
      }
      toast.success("Generated")
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const publishMutation = useMutation({
    mutationFn: async (): Promise<ChangelogEntry> => {
      const window = repoForm.getValues()
      const parsed = parseGithubRepoInput(window.repoUrl)

      if (!title.trim() || !summary.trim() || !body.trim()) {
        throw new Error("Title, summary, and body required")
      }
      const publishedAt = new Date(publishedAtLocal)
      if (Number.isNaN(publishedAt.getTime())) {
        throw new Error("Invalid date")
      }

      const source = parsed
        ? {
            owner: parsed.owner,
            repo: parsed.repo,
            branch: window.branch.trim() || undefined,
            since: formatISO(startOfDay(window.dateFrom)),
            until: formatISO(endOfDay(window.dateTo)),
            commitShas: [...selected],
          }
        : null

      const res = await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          body: body.trim(),
          publishedAt: publishedAt.toISOString(),
          category: category.trim() || null,
          breaking,
          tags: tags.length > 0 ? tags : null,
          source,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? res.statusText)
      }
      return res.json() as Promise<ChangelogEntry>
    },
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.list(),
      })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(entry.slug),
      })

      resetRepoWindow(repoWindowDefaults)
      setCommits([])
      setSelected(new Set())
      setTitle("")
      setSummary("")
      setBody("")
      setPublishedAtLocal(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
      setCategory("")
      setBreaking(false)
      setTags([])
      setTagInput("")
      setCommitSelectionError(null)
      setDraftAdditionalContext("")

      toast.success("Added to changelog", {
        description: entry.title,
        action: {
          label: "View",
          onClick: () => {
            router.push(`/changelog/${entry.slug}`)
          },
        },
      })
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const selectAll = () => {
    setCommitSelectionError(null)
    setSelected(new Set(commits.map((c) => c.sha)))
  }

  const selectNone = () => {
    setSelected(new Set())
  }

  return (
    <div className="flex h-svh max-h-svh flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
        <div
          className={cn(
            changelogBreadcrumbRowClassName,
            "mb-3 shrink-0 sm:mb-4"
          )}
        >
          <ChangelogBreadcrumbs subPage="Create" />
        </div>

        <header className="mb-3 shrink-0 sm:mb-4">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Create
          </h1>
        </header>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1.08fr)_minmax(0,1fr)] gap-x-0 gap-y-3 overflow-hidden sm:gap-y-4 lg:grid-cols-[minmax(0,0.42fr)_auto_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch lg:gap-y-0">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:h-[calc(100svh-8.5rem)] lg:max-h-[calc(100svh-8.5rem)]">
            <div className="flex min-h-0 flex-1 flex-col px-2 sm:px-3">
              <div className="pb-3">
                <div className="mb-2 flex min-h-9 flex-row flex-wrap items-center border-b border-border/40 pb-2">
                  <h2 className="font-heading text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Source
                  </h2>
                </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex flex-row items-start gap-2 sm:col-span-2 sm:gap-3">
                    <Controller
                      name="repoUrl"
                      control={repoControl}
                      render={({ field, fieldState }) => (
                        <div className="min-w-0 flex-1 space-y-1">
                          <Label htmlFor="repoUrl">URL</Label>
                          <Input
                            id="repoUrl"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="https://github.com/org/repo"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.error ? (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </div>
                      )}
                    />
                    <Controller
                      name="branch"
                      control={repoControl}
                      render={({ field, fieldState }) => (
                        <div className="w-[min(9rem,28vw)] shrink-0 space-y-1 sm:w-[min(10rem,32%)]">
                          <Label htmlFor="branch">Branch</Label>
                          <Input
                            id="branch"
                            placeholder="main"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.error ? (
                            <p className="text-sm text-destructive" role="alert">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    name="dateFrom"
                    control={repoControl}
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <Label htmlFor="date-from">From</Label>
                        <Popover>
                          <PopoverTrigger
                            id="date-from"
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                aria-invalid={fieldState.invalid}
                                className={cn(
                                  "w-full justify-start font-normal",
                                  fieldState.invalid && "border-destructive"
                                )}
                              >
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Pick date"}
                              </Button>
                            }
                          />
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(d) => {
                                field.onChange(d ?? field.value)
                              }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        {fieldState.error ? (
                          <p className="text-sm text-destructive" role="alert">
                            {fieldState.error.message}
                          </p>
                        ) : null}
                      </div>
                    )}
                  />
                  <Controller
                    name="dateTo"
                    control={repoControl}
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <Label htmlFor="date-to">To</Label>
                        <Popover>
                          <PopoverTrigger
                            id="date-to"
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                aria-invalid={fieldState.invalid}
                                className={cn(
                                  "w-full justify-start font-normal",
                                  fieldState.invalid && "border-destructive"
                                )}
                              >
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Pick date"}
                              </Button>
                            }
                          />
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(d) => {
                                field.onChange(d ?? field.value)
                              }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        {fieldState.error ? (
                          <p className="text-sm text-destructive" role="alert">
                            {fieldState.error.message}
                          </p>
                        ) : null}
                      </div>
                    )}
                  />
                  <div className="w-full sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 w-full"
                      disabled={loadCommits.isPending}
                      onClick={handleRepoSubmit(
                        (values) => void loadCommits.mutateAsync(values)
                      )}
                    >
                      {loadCommits.isPending ? (
                        <>
                          <Spinner className="size-4" />
                          Loading…
                        </>
                      ) : (
                        "Fetch commits"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table scrolls alone; AI context + Generate stay anchored below */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border/40">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col px-1 sm:px-1.5">
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
                        Not loaded
                      </span>
                    )}
                    {commitSelectionError ? (
                      <span className="text-xs text-destructive" role="alert">
                        {commitSelectionError}
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
                        onClick={selectAll}
                      >
                        All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={selectNone}
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
                        No commits here yet
                      </p>
                      <p className="max-w-70 text-xs leading-relaxed text-muted-foreground">
                        Add your repo URL and branch, pick a date window, then tap{" "}
                        <span className="font-medium text-foreground/85">
                          Fetch commits
                        </span>{" "}
                        to load history and select what goes into the draft.
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
                          <TableHead className="w-19 whitespace-nowrap">
                            Date
                          </TableHead>
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
                                onCheckedChange={(v) =>
                                  toggleSha(c.sha, v === true)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  )}
                </div>

                <div className="shrink-0 space-y-2 border-t border-border/40 pt-3 pb-1">
                  <div className="space-y-1">
                    <Label htmlFor="draft-additional-context">
                      Additional context for AI
                    </Label>
                    <Textarea
                      id="draft-additional-context"
                      rows={3}
                      placeholder="Audience, tone, product areas to emphasize, known caveats…"
                      value={draftAdditionalContext}
                      onChange={(e) => setDraftAdditionalContext(e.target.value)}
                      className="min-h-[72px] resize-y text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={
                      commits.length === 0 ||
                      draftMutation.isPending ||
                      selected.size === 0
                    }
                    onClick={handleRepoSubmit(() => {
                      if (selected.size === 0) {
                        setCommitSelectionError("Select commits")
                        return
                      }
                      setCommitSelectionError(null)
                      void draftMutation.mutateAsync()
                    })}
                  >
                    {draftMutation.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Generating…
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none hidden min-h-0 shrink-0 px-2.5 lg:flex lg:flex-col lg:items-center lg:justify-stretch"
          >
            <div className="min-h-0 w-px flex-1 bg-border/60" />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-h-0">
            <div className="mb-2 flex min-h-9 shrink-0 flex-row flex-wrap items-center border-b border-border/40 pb-2">
              <h2 className="font-heading text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Compose
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 [-webkit-overflow-scrolling:touch] sm:px-3">
              <div className="space-y-3 pb-1">
                    <div className="space-y-1">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="summary">Summary</Label>
                      <Textarea
                        id="summary"
                        className="min-h-[80px]"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="body">Body</Label>
                      <Textarea
                        id="body"
                        className="max-h-[min(34vh,280px)] min-h-[min(30vh,220px)] resize-y overflow-y-auto font-mono text-sm"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="publishedAt">Release date</Label>
                        <Input
                          id="publishedAt"
                          type="datetime-local"
                          value={publishedAtLocal}
                          onChange={(e) => setPublishedAtLocal(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="newTag">Tags</Label>
                      <div className="flex min-h-9 items-center gap-2">
                        <div className="relative min-h-8 min-w-0 flex-1">
                          <div
                            className={cn(
                              "pointer-events-none absolute inset-y-0 left-0 z-1 w-10 bg-linear-to-r from-background via-background/85 to-transparent transition-opacity duration-200",
                              !tagsScrollFade.left && "opacity-0"
                            )}
                            aria-hidden
                          />
                          <div
                            className={cn(
                              "pointer-events-none absolute inset-y-0 right-0 z-1 w-12 bg-linear-to-l from-background via-background/85 to-transparent backdrop-blur-[0.5px] transition-opacity duration-200",
                              !tagsScrollFade.right && "opacity-0"
                            )}
                            aria-hidden
                          />
                          <div
                            ref={tagsScrollRef}
                            onScroll={updateTagsScrollFade}
                            className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                            {DEFAULT_CHANGELOG_TAGS.map((label) => {
                              const active = tags.some(
                                (t) => t.toLowerCase() === label.toLowerCase()
                              )
                              return (
                                <Button
                                  key={label}
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  aria-pressed={active}
                                  className={cn(
                                    "h-7 shrink-0 rounded-full px-3 text-xs transition-[color,background-color,border-color,box-shadow]",
                                    active
                                      ? "border-primary/45 bg-primary/10 font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 hover:bg-primary/[0.14] dark:border-primary/40 dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:hover:bg-primary/22"
                                      : "font-normal text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                                  )}
                                  onClick={() => toggleSuggestedTag(label)}
                                >
                                  {label}
                                </Button>
                              )
                            })}
                            {customTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className={cn(
                                  "h-7 shrink-0 gap-1 border-primary/40 bg-primary/10 px-2.5 py-0 pe-1 leading-none font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-primary/35 dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                                )}
                              >
                                <span className="max-w-48 truncate">{tag}</span>
                                <button
                                  type="button"
                                  className="rounded-full p-0.5 text-primary/55 transition-colors hover:bg-primary/15 hover:text-primary"
                                  aria-label={`Remove tag ${tag}`}
                                  onClick={() => removeTag(tag)}
                                >
                                  <XIcon
                                    className="size-3.5"
                                    weight="bold"
                                    aria-hidden
                                  />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Input
                            id="newTag"
                            placeholder="Add tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addTagsFromInput()
                              }
                            }}
                            className="h-8 w-[min(11rem,40vw)] sm:w-44"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 shrink-0 px-2.5"
                            onClick={addTagsFromInput}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={breaking}
                        onCheckedChange={(v) => setBreaking(v === true)}
                      />
                      Breaking
                    </label>
                <Separator className="my-1 bg-border/60" />
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                    disabled={publishMutation.isPending}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye aria-hidden className="size-4 shrink-0" weight="regular" />
                    Preview
                  </Button>
                  <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="flex max-h-[min(92vh,880px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden border bg-popover p-0 shadow-lg sm:w-full sm:max-w-3xl">
                      <DialogTitle className="sr-only">
                        Changelog entry preview
                      </DialogTitle>
                      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">
                        {(() => {
                          const { label: dateLabel, dateTime } =
                            previewDateFromLocalInput(publishedAtLocal)
                          const trimmedCategory = category.trim()
                          const displayTitle = title.trim() || "(No title)"
                          const displaySummary = summary.trim() || "No summary yet."
                          return (
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
                                  {breaking ? (
                                    <Badge variant="destructive">Breaking</Badge>
                                  ) : null}
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
                          )
                        })()}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    disabled={publishMutation.isPending}
                    onClick={() => void publishMutation.mutateAsync()}
                    className={cn(
                      "w-full sm:w-auto sm:min-w-40",
                      publishMutation.isPending && "gap-2"
                    )}
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Adding…
                      </>
                    ) : (
                      "Add entry"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
