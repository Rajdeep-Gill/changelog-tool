import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"

import { changelogQueryKeys } from "@/features/changelog/api/query-keys"
import { normalizeChangelogListSearchQuery } from "@/lib/changelog/normalize-list-search-query"
import { listChangelogEntriesPage } from "@/lib/server/changelog-repository"
import { ChangelogIndexClient } from "./changelog-index-client"
import { ChangelogIndexSkeleton } from "./changelog-index-skeleton"

const PAGE_SIZE = 20

function decodeListCursor(cursor: string | null) {
  if (!cursor) return null
  try {
    const parsed = JSON.parse(atob(cursor)) as Partial<{
      publishedAt: string
      slug: string
    }>
    if (
      typeof parsed?.publishedAt !== "string" ||
      typeof parsed?.slug !== "string"
    ) {
      return null
    }
    const publishedAt = new Date(parsed.publishedAt)
    if (Number.isNaN(publishedAt.getTime())) {
      return null
    }
    return { publishedAt, slug: parsed.slug }
  } catch {
    return null
  }
}

type ChangelogPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>
}

export default async function ChangelogPage({
  searchParams,
}: ChangelogPageProps) {
  const params = searchParams ? await searchParams : {}
  const qRaw =
    typeof params.q === "string"
      ? params.q
      : Array.isArray(params.q)
        ? (params.q[0] ?? "")
        : ""
  const listSearch = normalizeChangelogListSearchQuery(qRaw)

  const queryClient = new QueryClient()
  await queryClient.prefetchInfiniteQuery({
    queryKey: changelogQueryKeys.list(listSearch),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const decodedCursor = pageParam ? decodeListCursor(pageParam) : null
      if (pageParam && !decodedCursor) {
        throw new Error("Invalid cursor")
      }
      return listChangelogEntriesPage({
        limit: PAGE_SIZE,
        cursor: decodedCursor,
        search: listSearch.length > 0 ? listSearch : null,
      }).then((page) => ({
        items: page.items,
        nextCursor: page.nextCursor
          ? btoa(
              JSON.stringify({
                publishedAt: page.nextCursor.publishedAt.toISOString(),
                slug: page.nextCursor.slug,
              })
            )
          : null,
      }))
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ChangelogIndexSkeleton />}>
        <ChangelogIndexClient />
      </Suspense>
    </HydrationBoundary>
  )
}
