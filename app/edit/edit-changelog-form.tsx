"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, XIcon } from "@phosphor-icons/react"
import { format, parseISO } from "date-fns"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  changelogQueryKeys,
  useChangelogEntry,
} from "@/hooks/use-changelog-queries"
import { DEFAULT_CHANGELOG_TAGS } from "@/lib/changelog/default-tags"
import type { ChangelogEntry } from "@/lib/changelog/types"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { EntryTags } from "@/components/changelog/entry-tags"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import {
  changelogBreadcrumbRowClassName,
  changelogPageHeaderSectionClassName,
  editMainColumnClassName,
} from "@/components/changelog/layout-classes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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

type EditChangelogFormProps = {
  slug: string
}

export function EditChangelogForm({ slug }: EditChangelogFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const entryQuery = useChangelogEntry(slug)

  const [title, setTitle] = React.useState("")
  const [summary, setSummary] = React.useState("")
  const [body, setBody] = React.useState("")
  const [publishedAtLocal, setPublishedAtLocal] = React.useState("")
  const [slugInput, setSlugInput] = React.useState(slug)
  const [category, setCategory] = React.useState("")
  const [breaking, setBreaking] = React.useState(false)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
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

  React.useEffect(() => {
    const entry = entryQuery.data
    if (!entry) return
    setTitle(entry.title)
    setSummary(entry.summary)
    setBody(entry.body)
    setSlugInput(entry.slug)
    setCategory(entry.category ?? "")
    setBreaking(Boolean(entry.breaking))
    setTags(entry.tags ?? [])
    try {
      const d = parseISO(entry.publishedAt)
      setPublishedAtLocal(format(d, "yyyy-MM-dd'T'HH:mm"))
    } catch {
      setPublishedAtLocal(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    }
  }, [entryQuery.data])

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
    const ro = new ResizeObserver(() => updateTagsScrollFade())
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

  const removeTag = (tagLabel: string) => {
    const key = tagLabel.toLowerCase()
    setTags((prev) => prev.filter((t) => t.toLowerCase() !== key))
  }

  const saveMutation = useMutation({
    mutationFn: async (): Promise<ChangelogEntry> => {
      if (!title.trim() || !summary.trim() || !body.trim()) {
        throw new Error("Title, summary, and body are required")
      }
      const publishedAt = new Date(publishedAtLocal)
      if (Number.isNaN(publishedAt.getTime())) {
        throw new Error("Invalid release date")
      }
      const newSlugTrim = slugInput.trim()
      if (!newSlugTrim) {
        throw new Error("Slug is required")
      }
      const res = await fetch(`/api/edit/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          body: body.trim(),
          publishedAt: publishedAt.toISOString(),
          slug: newSlugTrim,
          category: category.trim() || null,
          breaking,
          tags: tags.length > 0 ? tags : null,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? res.statusText)
      }
      return res.json() as Promise<ChangelogEntry>
    },
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({ queryKey: changelogQueryKeys.list() })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(slug),
      })
      if (entry.slug !== slug) {
        void queryClient.invalidateQueries({
          queryKey: changelogQueryKeys.detail(entry.slug),
        })
        router.replace(`/edit/${encodeURIComponent(entry.slug)}`)
      }
      toast.success("Saved", {
        description: entry.title,
        action: {
          label: "View",
          onClick: () => router.push(`/changelog/${entry.slug}`),
        },
      })
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/edit/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      })
      if (res.status === 404) {
        throw new Error("Entry was already removed")
      }
      if (!res.ok && res.status !== 204) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? res.statusText)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: changelogQueryKeys.list() })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(slug),
      })
      toast.success("Removed from changelog")
      router.push("/edit")
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  const handleDelete = () => {
    if (
      !window.confirm(
        "Delete this changelog entry permanently? This cannot be undone."
      )
    ) {
      return
    }
    void deleteMutation.mutateAsync()
  }

  return (
    <div className="min-h-svh bg-background pb-16">
      <div className={editMainColumnClassName}>
        <div className={changelogBreadcrumbRowClassName}>
          <ChangelogBreadcrumbs
            priorSubPage={{ label: "Edit", href: "/edit" }}
            entryTitle={
              entryQuery.isPending
                ? "…"
                : (entryQuery.data?.title?.trim() || title.trim() || "Untitled")
            }
          />
        </div>

        {entryQuery.isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3 max-w-md rounded-md" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : entryQuery.isError ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Could not load entry</AlertTitle>
            <AlertDescription>
              {entryQuery.error?.message ?? "Unknown error"}
            </AlertDescription>
          </Alert>
        ) : entryQuery.data === null ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Not found</AlertTitle>
            <AlertDescription>
              No changelog entry matches this URL.&nbsp;
              <Link href="/edit" className="font-medium underline underline-offset-4">
                Back to edit list
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <header className={changelogPageHeaderSectionClassName}>
              <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Edit entry
              </h1>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
                Update publication details below, or remove the entry from the changelog.
              </p>
            </header>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="edit-slug">URL slug</Label>
                <Input
                  id="edit-slug"
                  spellCheck={false}
                  autoComplete="off"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-summary">Summary</Label>
                <Textarea
                  id="edit-summary"
                  className="min-h-[80px]"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-body">Body</Label>
                <Textarea
                  id="edit-body"
                  className="min-h-[min(42vh,320px)] resize-y overflow-y-auto font-mono text-sm"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-published">Release date</Label>
                  <Input
                    id="edit-published"
                    type="datetime-local"
                    value={publishedAtLocal}
                    onChange={(e) => setPublishedAtLocal(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-newTag">Tags</Label>
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
                      {customTags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className={cn(
                            "h-7 shrink-0 gap-1 border-primary/40 bg-primary/10 px-2.5 py-0 pe-1 leading-none font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-primary/35 dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                          )}
                        >
                          <span className="max-w-48 truncate">{t}</span>
                          <button
                            type="button"
                            className="rounded-full p-0.5 text-primary/55 transition-colors hover:bg-primary/15 hover:text-primary"
                            aria-label={`Remove tag ${t}`}
                            onClick={() => removeTag(t)}
                          >
                            <XIcon className="size-3.5" weight="bold" aria-hidden />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Input
                      id="edit-newTag"
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
              <Separator className="my-6 bg-border/60" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteMutation.isPending || saveMutation.isPending}
                    onClick={() => handleDelete()}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Deleting…
                      </>
                    ) : (
                      "Delete entry"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/edit" />}
                  >
                    Back to list
                  </Button>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-0 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                    disabled={deleteMutation.isPending || saveMutation.isPending}
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
                    disabled={saveMutation.isPending || deleteMutation.isPending}
                    onClick={() => void saveMutation.mutateAsync()}
                    className={cn(
                      "w-full sm:w-auto sm:min-w-40",
                      saveMutation.isPending && "gap-2"
                    )}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Spinner className="size-4" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
