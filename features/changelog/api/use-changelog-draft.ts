"use client"

import type { UseMutationOptions } from "@tanstack/react-query"
import { InferRequestType, InferResponseType } from "hono"
import { useMutation } from "@tanstack/react-query"

import { client } from "@/lib/hono"
import { getApiErrorMessage } from "@/features/shared/api-error"

type ResponseType = InferResponseType<
  (typeof client.api.changelog)["draft"]["$post"],
  200
>
type RequestJson = InferRequestType<
  (typeof client.api.changelog)["draft"]["$post"]
>["json"]

export function useChangelogDraft(
  opts?: Omit<
    UseMutationOptions<ResponseType, Error, RequestJson, unknown>,
    "mutationFn"
  >
) {
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = opts ?? {}

  return useMutation({
    mutationFn: async (json) => {
      const response = await client.api.changelog.draft.$post({ json })
      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not generate a draft."
        )
        throw new Error(message)
      }
      return response.json()
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
