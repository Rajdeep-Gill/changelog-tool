"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useCreateChangelog } from "@/features/changelog/api/use-create-changelog"
import {
  changelogComposeFormSchema,
  type ChangelogComposeFormValues,
  getDefaultComposeFormValues,
} from "@/lib/changelog/changelog-compose-form-schema"
import { buildCreateSource } from "@/lib/changelog/repo-source-payload"
import {
  type RepoWindowFormValues,
  repoWindowFormSchema,
} from "@/lib/changelog/repo-window-form-schema"
import { toastEntryCreated } from "@/lib/changelog/changelog-toasts"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { changelogBreadcrumbRowClassName } from "@/components/changelog/layout-classes"
import { ChangelogEntryForm } from "@/components/changelog/changelog-entry-form"
import { CreateChangelogDraftPanel } from "./create-changelog-draft-panel"
import { CreateRepoSourceForm } from "./create-repo-source-form"
import { useCreateDraftWorkflow } from "./use-create-draft-workflow"
import { cn } from "@/lib/utils"

export function CreateChangelogForm() {
  const router = useRouter()

  const repoWindowDefaults = React.useMemo((): RepoWindowFormValues => {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - 14)
    return {
      repoUrl: "",
      branch: "main",
      dateFrom,
      dateTo: new Date(),
    }
  }, [])

  const repoForm = useForm<RepoWindowFormValues>({
    resolver: standardSchemaResolver(repoWindowFormSchema),
    defaultValues: repoWindowDefaults,
  })
  const composeForm = useForm<ChangelogComposeFormValues>({
    resolver: standardSchemaResolver(changelogComposeFormSchema),
    defaultValues: getDefaultComposeFormValues(),
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

  const {
    commits,
    selected,
    commitSelectionError,
    loadCommits,
    draftMutation,
    toggleSha,
    selectAll,
    selectNone,
    onGenerateDraft,
    resetSelectionAfterPublish,
  } = useCreateDraftWorkflow({
    composeForm,
    getRepoValues,
    handleRepoSubmit,
  })

  const publishMutation = useCreateChangelog({
    onSuccess: (entry) => {
      resetRepoWindow(repoWindowDefaults)
      resetSelectionAfterPublish()
      toastEntryCreated(router, entry)
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

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

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-border/40">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col px-1 sm:px-1.5">
                  <CreateChangelogDraftPanel
                    commits={commits}
                    selected={selected}
                    loadError={loadCommits.error?.message ?? null}
                    draftError={draftMutation.error?.message ?? null}
                    commitSelectionError={commitSelectionError}
                    onToggleSha={toggleSha}
                    onSelectAll={selectAll}
                    onSelectNone={selectNone}
                    composeControl={composeForm.control}
                    generateDraftDisabled={
                      commits.length === 0 ||
                      draftMutation.isPending ||
                      selected.size === 0
                    }
                    draftMutationPending={draftMutation.isPending}
                    onGenerateDraft={onGenerateDraft}
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

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:h-[calc(100svh-8.5rem)] lg:max-h-[calc(100svh-8.5rem)]">
            <div className="flex min-h-0 flex-1 flex-col px-2 sm:px-3">
              <ChangelogEntryForm
                mode="create"
                composeForm={composeForm}
                submitPending={publishMutation.isPending}
                onSubmit={async ({ normalized, publishedAt }) => {
                  const source = buildCreateSource(getRepoValues, selected)

                  await publishMutation.mutateAsync({
                    title: normalized.title,
                    summary: normalized.summary,
                    body: normalized.body,
                    publishedAt,
                    category: normalized.category,
                    breaking: normalized.breaking,
                    tags: normalized.tags,
                    source,
                  })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
