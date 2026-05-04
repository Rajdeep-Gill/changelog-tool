"use client"

import * as React from "react"
import { toast } from "sonner"
import type { UseFormHandleSubmit, UseFormReturn } from "react-hook-form"

import { useChangelogDraft } from "@/features/changelog/api/use-changelog-draft"
import { useRepoCommits } from "@/features/github/api/use-repo-commits"
import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { applyDraftToCompose } from "@/lib/changelog/apply-draft-to-compose"
import { buildRepoSourceWindow } from "@/lib/changelog/repo-source-payload"
import type { RepoWindowFormValues } from "@/lib/changelog/repo-window-form-schema"
import { type GithubCommitRow } from "@/components/changelog/repo-commits-picker"

type UseCreateDraftWorkflowArgs = {
  composeForm: UseFormReturn<ChangelogComposeFormValues>
  getRepoValues: () => RepoWindowFormValues
  handleRepoSubmit: UseFormHandleSubmit<RepoWindowFormValues>
}

export function useCreateDraftWorkflow({
  composeForm,
  getRepoValues,
  handleRepoSubmit,
}: UseCreateDraftWorkflowArgs) {
  const [commits, setCommits] = React.useState<GithubCommitRow[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set())
  const [commitSelectionError, setCommitSelectionError] = React.useState<
    string | null
  >(null)

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

  const resetSelectionAfterPublish = React.useCallback(() => {
    setCommits([])
    setSelected(new Set())
    setCommitSelectionError(null)
  }, [])

  const onGenerateDraft = handleRepoSubmit(async () => {
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
    const ctx = composeForm.getValues("draftAdditionalContext").trim()

    const data = await draftMutation.mutateAsync({
      owner: sourceWindow.owner,
      repo: sourceWindow.repo,
      branch: sourceWindow.branch,
      since: sourceWindow.since,
      until: sourceWindow.until,
      commitShas: shas,
      ...(ctx ? { additionalContext: ctx } : {}),
    })

    applyDraftToCompose(composeForm, data)
    toast.success("Generated")
  })

  return {
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
  }
}
