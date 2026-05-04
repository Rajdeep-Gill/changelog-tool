"use client"

import { InferResponseType } from "hono"
import {
  infiniteQueryOptions,
  useInfiniteQuery,
} from "@tanstack/react-query"

import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type ResponseType = InferResponseType<
  (typeof client.api.changelog)["$get"],
  200
>

const PAGE_SIZE = 20

async function fetchChangelogListPage(
  cursor: string | null
): Promise<ResponseType> {
  const response = await client.api.changelog.$get({
    query: {
      limit: String(PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    },
  })
  if (!response.ok) {
    throw new Error("Could not load changelog entries.")
  }
  return response.json()
}

export function changelogEntriesQueryOptions() {
  return infiniteQueryOptions({
    queryKey: changelogQueryKeys.list(),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchChangelogListPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useChangelogEntries() {
  return useInfiniteQuery(changelogEntriesQueryOptions())
}
