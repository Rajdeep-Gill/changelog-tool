"use client"

import { format } from "date-fns"
import {
  Controller,
  type Control,
  type SubmitHandler,
  type UseFormHandleSubmit,
} from "react-hook-form"

import type { UseRepoCommitsResult } from "@/features/github/api/use-repo-commits"
import { buildRepoSourceWindow } from "@/lib/changelog/repo-source-payload"
import type { RepoWindowFormValues } from "@/lib/changelog/repo-window-form-schema"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type CreateRepoSourceFormProps = {
  repoControl: Control<RepoWindowFormValues>
  handleRepoSubmit: UseFormHandleSubmit<RepoWindowFormValues>
  fetchCommits: Pick<UseRepoCommitsResult, "isPending" | "mutateAsync">
}

export function CreateRepoSourceForm({
  repoControl,
  handleRepoSubmit,
  fetchCommits,
}: CreateRepoSourceFormProps) {
  const onSubmitFetchCommits: SubmitHandler<RepoWindowFormValues> = (values) => {
    const sourceWindow = buildRepoSourceWindow(values)
    if (!sourceWindow) return

    void fetchCommits.mutateAsync({
      query: {
        owner: sourceWindow.owner,
        repo: sourceWindow.repo,
        since: sourceWindow.since,
        until: sourceWindow.until,
        ...(sourceWindow.branch ? { sha: sourceWindow.branch } : {}),
      },
    })
  }

  return (
    <div className="pb-3">
      <div className="mb-2 flex min-h-9 flex-row flex-wrap items-center border-b border-border/40 pb-2">
        <h2 className="font-heading text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Source
        </h2>
      </div>
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={handleRepoSubmit(onSubmitFetchCommits)}
      >
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
                      {field.value ? format(field.value, "PPP") : "Pick date"}
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
                      {field.value ? format(field.value, "PPP") : "Pick date"}
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
            type="submit"
            size="sm"
            className="h-8 w-full"
            disabled={fetchCommits.isPending}
          >
            {fetchCommits.isPending ? (
              <>
                <Spinner className="size-4" />
                Loading…
              </>
            ) : (
              "Fetch commits"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
