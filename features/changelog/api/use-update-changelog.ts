"use client"

import type { UseMutationOptions } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/hono"

import { changelogQueryKeys } from "./query-keys"

type ResponseType = InferResponseType<
  (typeof client.api.edit)[":slug"]["$patch"],
  200
>
type RequestInput = InferRequestType<
  (typeof client.api.edit)[":slug"]["$patch"]
>

export function useUpdateChangelog(
  opts?: Omit<
    UseMutationOptions<ResponseType, Error, RequestInput, unknown>,
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
      const response = await client.api.edit[":slug"].$patch(input)
      if (response.status === 409) {
        throw new Error("That URL slug is already in use.")
      }
      if (!response.ok) {
        throw new Error("Could not save changes.")
      }
      return response.json()
    },
    ...rest,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: changelogQueryKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: changelogQueryKeys.detail(variables.param.slug),
      })
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
