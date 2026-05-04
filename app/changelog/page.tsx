import { Suspense } from "react"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { changelogQueryKeys } from "@/features/changelog/api/query-keys"
import { listChangelogEntriesPage } from "@/lib/server/changelog-repository"
import { ChangelogIndexSkeleton } from "./changelog-index-skeleton"
import { ChangelogIndexClient } from "./changelog-index-client"

const PAGE_SIZE = 20

export default async function ChangelogPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchInfiniteQuery({
    queryKey: changelogQueryKeys.list(),
    initialPageParam: null,
    queryFn: () =>
      listChangelogEntriesPage({
        limit: PAGE_SIZE,
        cursor: null,
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
      })),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ChangelogIndexSkeleton />}>
        <ChangelogIndexClient />
      </Suspense>
    </HydrationBoundary>
  )
}
