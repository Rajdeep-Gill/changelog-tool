"use client"

import { useEffect, useMemo, useRef } from "react"

import { ChangelogTimeline } from "@/components/changelog/changelog-timeline"
import { useChangelogEntries } from "@/features/changelog/api/use-changelog-entries"

export function ChangelogIndexClient() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChangelogEntries()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const entries = useMemo(
    () => data.pages.flatMap((page) => page.items),
    [data.pages]
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

  return (
    <>
      <header className="mb-10 sm:mb-12">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Changelog
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          New features, fixes, and other updates to the platform. Click through
          for full release notes.
        </p>
      </header>

      <ChangelogTimeline entries={entries} />
      {hasNextPage ? (
        <div ref={sentinelRef} className="py-6 text-center text-sm text-muted-foreground">
          {isFetchingNextPage ? "Loading more updates..." : "Scroll to load more"}
        </div>
      ) : null}
    </>
  )
}
