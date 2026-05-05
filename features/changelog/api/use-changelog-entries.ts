"use client"

import { InferResponseType } from "hono"
import {
  infiniteQueryOptions,
  useInfiniteQuery,
} from "@tanstack/react-query"

import { normalizeChangelogListSearchQuery } from "@/lib/changelog/normalize-list-search-query"
import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type ResponseType = InferResponseType<
  (typeof client.api.changelog)["$get"],
  200
>

const PAGE_SIZE = 20

async function fetchChangelogListPage(
  cursor: string | null,
  searchQuery: string
): Promise<ResponseType> {
  const q = normalizeChangelogListSearchQuery(searchQuery)
  const response = await client.api.changelog.$get({
    query: {
      limit: String(PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
      ...(q ? { q } : {}),
    },
  })
  if (!response.ok) {
    throw new Error("Could not load changelog entries.")
  }
  return response.json()
}

export function changelogEntriesQueryOptions(searchQuery = "") {
  return infiniteQueryOptions({
    queryKey: changelogQueryKeys.list(searchQuery),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchChangelogListPage(pageParam, searchQuery),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useChangelogEntries(searchQuery = "") {
  return useInfiniteQuery(changelogEntriesQueryOptions(searchQuery))
}
