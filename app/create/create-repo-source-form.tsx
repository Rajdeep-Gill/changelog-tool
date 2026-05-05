"use client"

import { format } from "date-fns"
import { CalendarBlankIcon } from "@phosphor-icons/react"
import {
  Controller,
  useFormState,
  useWatch,
  type Control,
  type SubmitHandler,
  type UseFormHandleSubmit,
  type UseFormSetValue,
} from "react-hook-form"
import { type DateRange } from "react-day-picker"

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
  setRepoValue: UseFormSetValue<RepoWindowFormValues>
  handleRepoSubmit: UseFormHandleSubmit<RepoWindowFormValues>
  fetchCommits: Pick<UseRepoCommitsResult, "isPending" | "mutateAsync">
}

export function CreateRepoSourceForm({
  repoControl,
  setRepoValue,
  handleRepoSubmit,
  fetchCommits,
}: CreateRepoSourceFormProps) {
  const dateFrom = useWatch({ control: repoControl, name: "dateFrom" })
  const dateTo = useWatch({ control: repoControl, name: "dateTo" })
  const { errors } = useFormState({
    control: repoControl,
    name: ["dateFrom", "dateTo"],
  })
  const rangeError = errors.dateFrom?.message ?? errors.dateTo?.message
  const rangeInvalid = Boolean(errors.dateFrom ?? errors.dateTo)

  const selectedRange: DateRange | undefined =
    dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined

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
        <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Label htmlFor="repo-date-range" className="col-span-full">
            Date range
          </Label>
          <div className="flex min-w-0 flex-col gap-2">
            <Popover>
              <PopoverTrigger
                id="repo-date-range"
                render={
                  <Button
                    type="button"
                    variant="outline"
                    aria-invalid={rangeInvalid}
                    className={cn(
                      "h-8 w-full justify-start gap-2 px-2.5 font-normal text-xs",
                      rangeInvalid && "border-destructive"
                    )}
                  >
                    {selectedRange?.from ? (
                      selectedRange.to ? (
                        <>
                          {format(selectedRange.from, "LLL dd, y")} -{" "}
                          {format(selectedRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(selectedRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span className="text-muted-foreground">Pick dates</span>
                    )}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={selectedRange?.from}
                  selected={selectedRange}
                  onSelect={(range) => {
                    if (!range?.from) return
                    setRepoValue("dateFrom", range.from, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    if (range.to) {
                      setRepoValue("dateTo", range.to, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    } else {
                      setRepoValue("dateTo", range.from, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {rangeError ? (
              <p className="text-sm text-destructive" role="alert">
                {rangeError}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 w-full self-start sm:w-auto sm:min-w-22"
            disabled={fetchCommits.isPending}
          >
            {fetchCommits.isPending ? (
              <>
                <Spinner className="size-4" />
                Loading…
              </>
            ) : (
              "Fetch"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
