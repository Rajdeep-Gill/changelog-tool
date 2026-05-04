"use client"

import { InferResponseType } from "hono"
import { useQuery } from "@tanstack/react-query"

import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type ResponseType = InferResponseType<
  (typeof client.api.changelog)[":slug"]["$get"],
  200
>

async function fetchChangelogEntry(
  slug: string
): Promise<ResponseType | null> {
  const response = await client.api.changelog[":slug"].$get({
    param: { slug },
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error("Could not load this changelog entry.")
  }
  return response.json()
}

export function useChangelogEntry(slug: string) {
  return useQuery({
    queryKey: changelogQueryKeys.detail(slug),
    queryFn: () => fetchChangelogEntry(slug),
    enabled: Boolean(slug),
  })
}
