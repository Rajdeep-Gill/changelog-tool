"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { ChangelogTimeline } from "@/components/changelog/changelog-timeline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useChangelogEntries } from "@/features/changelog/api/use-changelog-entries"
import { normalizeChangelogListSearchQuery } from "@/lib/changelog/normalize-list-search-query"

import { ChangelogIndexSkeleton } from "./changelog-index-skeleton"

export function ChangelogIndexClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const normalizedSearch = normalizeChangelogListSearchQuery(
    searchParams.get("q") ?? ""
  )

  const [draft, setDraft] = useState(() => searchParams.get("q") ?? "")

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useChangelogEntries(normalizedSearch)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages]
  )

  useEffect(() => {
    const next = searchParams.get("q") ?? ""
    startTransition(() => {
      setDraft(next)
    })
  }, [searchParams])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const normalized = normalizeChangelogListSearchQuery(draft)
      const urlNorm = normalizeChangelogListSearchQuery(
        searchParams.get("q") ?? ""
      )
      if (normalized === urlNorm) return

      const next = new URLSearchParams()
      if (normalized) next.set("q", normalized)
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => window.clearTimeout(id)
  }, [draft, pathname, router, searchParams])

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

  const searchActive = normalizedSearch.length > 0

  if (isPending && entries.length === 0) {
    return <ChangelogIndexSkeleton />
  }

  return (
    <>
      <header className="mb-10 sm:mb-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,1fr)_min(18rem,100%)] md:items-center md:gap-x-8 md:gap-y-3">
        <h1 className="font-heading row-start-1 text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:col-start-1 md:self-center">
          Changelog
        </h1>
        <p className="row-start-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:col-span-2 md:row-start-2">
          New features, fixes, and other updates to the platform. Click through
          for full release notes.
        </p>
        <div className="relative row-start-3 w-full md:col-start-2 md:row-start-1 md:w-full md:justify-self-end">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 z-1 size-[1.125rem] -translate-y-1/2 text-muted-foreground/80"
            aria-hidden
          />
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search title, summary, notes…"
            className="h-9 rounded-lg border-border/80 bg-background pl-10 pr-3 shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:shadow-md md:min-w-[12rem]"
            aria-label="Search changelog by title, summary, or body"
          />
        </div>
      </header>

      {isError ? (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Could not load changelog</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : null}

      {!isError && entries.length === 0 && searchActive ? (
        <p className="text-sm text-muted-foreground">
          No entries match your search.
        </p>
      ) : null}

      {!isError && !(searchActive && entries.length === 0) ? (
        <ChangelogTimeline entries={entries} />
      ) : null}

      {hasNextPage ? (
        <Skeleton ref={sentinelRef} className="h-10 w-full rounded-lg" />
      ) : null}
    </>
  )
}
