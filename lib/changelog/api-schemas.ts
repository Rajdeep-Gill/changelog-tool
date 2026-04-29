import { z } from "zod"

export const changelogEntryResponseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  publishedAt: z.string(),
  summary: z.string(),
  body: z.string(),
  category: z.string().optional(),
  breaking: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export type ChangelogEntryResponse = z.infer<typeof changelogEntryResponseSchema>

export const createChangelogBodySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  publishedAt: z
    .string()
    .min(1)
    .refine((s) => !Number.isNaN(Date.parse(s)), "Expected ISO 8601 date"),
  slug: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  breaking: z.boolean().optional(),
  tags: z.array(z.string()).optional().nullable(),
  source: z
    .object({
      owner: z.string().optional(),
      repo: z.string().optional(),
      branch: z.string().optional(),
      since: z.string().optional(),
      until: z.string().optional(),
      commitShas: z.array(z.string()).optional(),
    })
    .strict()
    .optional()
    .nullable(),
})

export const patchChangelogBodySchema = createChangelogBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })

export const githubCommitsQuerySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  since: z.string().min(1),
  until: z.string().min(1),
  sha: z.string().min(1).optional(),
})

export const githubCommitItemSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  message: z.string(),
  subject: z.string(),
  body: z.string().optional(),
  authorDate: z.string(),
  htmlUrl: z.string(),
  authorLogin: z.string().nullable(),
})

export const changelogDraftBodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1).optional(),
  since: z.string().min(1),
  until: z.string().min(1),
  commitShas: z.array(z.string().min(1)).min(1).max(80),
  additionalContext: z.string().max(8000).optional(),
})

export const changelogDraftResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bodyMarkdown: z.string(),
  suggestedPublishedAt: z.string().optional(),
  category: z.string().optional(),
  breaking: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})
