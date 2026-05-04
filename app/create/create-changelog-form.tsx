"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { format, parseISO } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useChangelogDraft } from "@/features/changelog/api/use-changelog-draft"
import { useCreateChangelog } from "@/features/changelog/api/use-create-changelog"
import { useRepoCommits } from "@/features/github/api/use-repo-commits"
import {
  changelogComposeFormSchema,
  type ChangelogComposeFormValues,
  getDefaultComposeFormValues,
} from "@/lib/changelog/changelog-compose-form-schema"
import { parseGithubRepoInput } from "@/lib/changelog/parse-github-repo-url"
import {
  buildRepoSourceWindow,
  toLocalDateTimeIso,
} from "@/lib/changelog/repo-source-payload"
import {
  type RepoWindowFormValues,
  repoWindowFormSchema,
} from "@/lib/changelog/repo-window-form-schema"
import { mergeUniqueTags } from "@/lib/changelog/tag-utils"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { type GithubCommitRow } from "@/components/changelog/repo-commits-picker"
import { changelogBreadcrumbRowClassName } from "@/components/changelog/layout-classes"
import { CreateChangelogComposePanel } from "./create-changelog-compose-panel"
import { CreateChangelogDraftPanel } from "./create-changelog-draft-panel"
import { CreateRepoSourceForm } from "./create-repo-source-form"
import { cn } from "@/lib/utils"

type CreateChangelogFormProps = {
  defaultRepoString?: string
}

const DRAFT_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm"

function toPublishedAtLocalValue(value?: string | null): string | null {
  if (!value) return null
  try {
    const parsed = parseISO(value.length <= 10 ? `${value}T12:00:00` : value)
    if (Number.isNaN(parsed.getTime())) return null
    return format(parsed, DRAFT_DATE_FORMAT)
  } catch {
    return null
  }
}

export function CreateChangelogForm({
  defaultRepoString = "",
}: CreateChangelogFormProps) {
  const router = useRouter()

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
    getValues: getRepoValues,
  } = repoForm

  React.useEffect(() => {
    resetRepoWindow(repoWindowDefaults)
  }, [repoWindowDefaults, resetRepoWindow])

  const [commits, setCommits] = React.useState<GithubCommitRow[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())

  const composeForm = useForm<ChangelogComposeFormValues>({
    resolver: standardSchemaResolver(changelogComposeFormSchema),
    defaultValues: getDefaultComposeFormValues(),
  })
  const {
    control: composeControl,
    reset: resetComposeForm,
    setValue,
    getValues,
    handleSubmit: handleComposeSubmit,
  } = composeForm

  const [commitSelectionError, setCommitSelectionError] = React.useState<
    string | null
  >(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

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

  const loadCommits = useRepoCommits({
    onSuccess: (list) => {
      setCommits(list as GithubCommitRow[])
      setSelected(new Set())
      toast.success(`${list.length} commits`)
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

  const draftMutation = useChangelogDraft({
    onSuccess: (data) => {
      const updates: Partial<ChangelogComposeFormValues> = {
        title: data.title,
        summary: data.summary,
        body: data.bodyMarkdown,
        breaking: Boolean(data.breaking),
      }
      if (data.category) updates.category = data.category
      const publishedAtLocal = toPublishedAtLocalValue(data.suggestedPublishedAt)
      if (publishedAtLocal) updates.publishedAtLocal = publishedAtLocal
      Object.entries(updates).forEach(([key, value]) => {
        setValue(key as keyof ChangelogComposeFormValues, value)
      })

      if (data.tags?.length) {
        setValue("tags", mergeUniqueTags(getValues("tags"), data.tags ?? []))
      }
      toast.success("Generated")
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

  const publishMutation = useCreateChangelog({
    onSuccess: (entry) => {
      resetRepoWindow(repoWindowDefaults)
      resetComposeForm(getDefaultComposeFormValues())
      setCommits([])
      setSelected(new Set())
      setCommitSelectionError(null)

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
    onError: (e) => {
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
              <CreateRepoSourceForm
                repoControl={repoControl}
                handleRepoSubmit={handleRepoSubmit}
                fetchCommits={loadCommits}
              />

              {/* Commits picker + AI context stay below source; picker scrolls alone */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border/40">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col px-1 sm:px-1.5">
                  <CreateChangelogDraftPanel
                    commits={commits}
                    selected={selected}
                    loadError={loadCommits.error?.message ?? null}
                    commitSelectionError={commitSelectionError}
                    onToggleSha={toggleSha}
                    onSelectAll={selectAll}
                    onSelectNone={selectNone}
                    composeControl={composeControl}
                    generateDraftDisabled={
                      commits.length === 0 ||
                      draftMutation.isPending ||
                      selected.size === 0
                    }
                    draftMutationPending={draftMutation.isPending}
                    onGenerateDraft={handleRepoSubmit(() => {
                      if (selected.size === 0) {
                        setCommitSelectionError("Select commits")
                        return
                      }
                      setCommitSelectionError(null)
                      const sourceWindow = buildRepoSourceWindow(getRepoValues())
                      if (!sourceWindow) {
                        toast.error("Enter a valid GitHub repository URL")
                        return
                      }
                      const shas = [...selected]
                      const ctx = getValues("draftAdditionalContext").trim()
                      void draftMutation.mutateAsync({
                        owner: sourceWindow.owner,
                        repo: sourceWindow.repo,
                        branch: sourceWindow.branch,
                        since: sourceWindow.since,
                        until: sourceWindow.until,
                        commitShas: shas,
                        ...(ctx ? { additionalContext: ctx } : {}),
                      })
                    })}
                  />
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

          <CreateChangelogComposePanel
            composeForm={composeForm}
            previewOpen={previewOpen}
            onPreviewOpenChange={setPreviewOpen}
            submitPending={publishMutation.isPending}
            onSubmitEntry={handleComposeSubmit((values) => {
              const sourceWindow = buildRepoSourceWindow(getRepoValues())
              const publishedAt = toLocalDateTimeIso(values.publishedAtLocal)
              if (!publishedAt) {
                toast.error("Choose a valid release date")
                return
              }
              const source = sourceWindow
                ? {
                    owner: sourceWindow.owner,
                    repo: sourceWindow.repo,
                    branch: sourceWindow.branch,
                    since: sourceWindow.since,
                    until: sourceWindow.until,
                    commitShas: [...selected],
                  }
                : null

              void publishMutation.mutateAsync({
                title: values.title,
                summary: values.summary,
                body: values.body,
                publishedAt,
                category: values.category.trim() || null,
                breaking: values.breaking,
                tags: values.tags.length > 0 ? values.tags : null,
                source,
              })
            })}
          />
        </div>
      </div>
    </div>
  )
}
