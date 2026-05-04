"use client"

import type { UseMutationOptions } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation } from "@tanstack/react-query"

import { client } from "@/lib/hono"
import { getApiErrorMessage } from "@/features/shared/api-error"

type CommitsPayload = InferResponseType<
  (typeof client.api.github)["commits"]["$get"],
  200
>

type ResponseType = CommitsPayload["commits"]

type RequestInput = InferRequestType<
  (typeof client.api.github)["commits"]["$get"]
>

export function useRepoCommits(
  opts?: Omit<
    UseMutationOptions<ResponseType, Error, RequestInput, unknown>,
    "mutationFn"
  >
) {
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = opts ?? {}

  return useMutation({
    mutationFn: async (queryInput: RequestInput) => {
      const response = await client.api.github.commits.$get(queryInput)
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not load commits from GitHub."
        )
        throw new Error(message)
      }
      const payload = await response.json()
      return payload.commits
    },
    ...rest,
    onSuccess: (data, variables, context, mutation) => {
      userOnSuccess?.(data, variables, context, mutation)
    },
    onError: (err, vars, ctx, mutation) => {
      userOnError?.(err, vars, ctx, mutation)
    },
  })
}

export type UseRepoCommitsResult = ReturnType<typeof useRepoCommits>
