"use client"

import { useEffect, useMemo, useRef } from "react"

import { ChangelogTimeline } from "@/components/changelog/changelog-timeline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useChangelogEntries } from "@/features/changelog/api/use-changelog-entries"

import { ChangelogIndexSkeleton } from "./changelog-index-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export function ChangelogIndexClient() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useChangelogEntries()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages]
  )

  useEffect(() => {
    const target = sentinelRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        if (!hasNextPage || isFetchingNextPage) return
        void fetchNextPage()
      },
      {
        rootMargin: "240px 0px",
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isPending && entries.length === 0) {
    return <ChangelogIndexSkeleton />
  }

  return (
    <>
      <header className="mb-10 sm:mb-12 flex gap-3 flex-col">
        <h1 className="font-heading text-3xl font-medium text-foreground sm:text-4xl">
          Changelog
        </h1>
        <p className="text-sm text-muted-foreground">
          New features, fixes, and other updates to the platform. Click through
          for full release notes.
        </p>
      </header>

      {isError ? (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Could not load changelog</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : null}

      <ChangelogTimeline entries={entries} />
      {hasNextPage ? (
        <Skeleton ref={sentinelRef} className="h-10 w-full rounded-lg" />
      ) : null}
    </>
  )
}
