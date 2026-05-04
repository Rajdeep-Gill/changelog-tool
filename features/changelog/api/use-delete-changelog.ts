"use client"

import type { UseMutationOptions } from "@tanstack/react-query"
import { InferRequestType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type RequestInput = InferRequestType<
  (typeof client.api.edit)[":slug"]["$delete"]
>

export function useDeleteChangelog(
  opts?: Omit<
    UseMutationOptions<void, Error, RequestInput, unknown>,
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
    mutationFn: async (input) => {
      const response = await client.api.edit[":slug"].$delete(input)
      if (response.status === 404) {
        throw new Error("Entry was already removed")
      }
      if (!response.ok) {
        throw new Error("Could not delete this entry.")
      }
    },
    ...rest,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: changelogQueryKeys.list() })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(variables.param.slug),
      })
      userOnSuccess?.(data, variables, context, mutation)
    },
    onError: (err, vars, ctx, mutation) => {
      userOnError?.(err, vars, ctx, mutation)
    },
  })
}
