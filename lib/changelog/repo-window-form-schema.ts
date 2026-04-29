import { z } from "zod"

import { parseGithubRepoInput } from "@/lib/changelog/parse-github-repo-url"

export const invalidGithubRepoUrlMessage =
  "Enter a valid GitHub repository URL (e.g. https://github.com/octokit/rest.js)"

export const repoWindowFormSchema = z
  .object({
    repoUrl: z
      .string()
      .trim()
      .min(1, "Enter a GitHub repository URL")
      .refine((v) => parseGithubRepoInput(v) !== null, {
        message: invalidGithubRepoUrlMessage,
      }),
    branch: z.string(),
    dateFrom: z.date("Choose a start date"),
    dateTo: z.date("Choose an end date"),
  })
  .refine((d) => d.dateFrom.getTime() <= d.dateTo.getTime(), {
    message: "Start date must be before or equal to end date",
    path: ["dateTo"],
  })

export type RepoWindowFormValues = z.infer<typeof repoWindowFormSchema>
