"use client"

import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { ChangelogTimeline } from "@/components/changelog/changelog-timeline"
import {
  changelogBreadcrumbRowClassName,
  changelogMainColumnClassName,
  changelogPageHeaderSectionClassName,
} from "@/components/changelog/layout-classes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useChangelogEntries } from "@/hooks/use-changelog-queries"

export function ChangelogIndexClient() {
  const { data: entries = [], isPending, isError, error } = useChangelogEntries()

  return (
    <div className="min-h-svh bg-background">
      <div className={changelogMainColumnClassName}>
        <div className={changelogBreadcrumbRowClassName}>
          <ChangelogBreadcrumbs />
        </div>

        <header className={changelogPageHeaderSectionClassName}>
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            New features, fixes, and other updates to the platform. Click through for full
            release notes.
          </p>
        </header>

        {isError ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Could not load changelog</AlertTitle>
            <AlertDescription>{error?.message ?? "Unknown error"}</AlertDescription>
          </Alert>
        ) : null}

        {isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <ChangelogTimeline entries={entries} />
        )}
      </div>
    </div>
  )
}
