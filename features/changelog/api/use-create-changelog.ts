"use client"

import type { UseMutationOptions } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type ResponseType = InferResponseType<
  (typeof client.api.changelog)["$post"],
  201
>
type RequestJson = InferRequestType<
  (typeof client.api.changelog)["$post"]
>["json"]

export function useCreateChangelog(
  opts?: Omit<
    UseMutationOptions<ResponseType, Error, RequestJson, unknown>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient()
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = opts ?? {}

  return useMutation({
    mutationFn: async (json) => {
      const response = await client.api.changelog.$post({ json })
      if (!response.ok) {
        throw new Error("Could not add this changelog entry.")
      }
      return response.json()
    },
    ...rest,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: changelogQueryKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(data.slug),
      })
      userOnSuccess?.(data, variables, context, mutation)
    },
    onError: (err, vars, ctx, mutation) => {
      userOnError?.(err, vars, ctx, mutation)
    },
  })
}
