import { format } from "date-fns"
import { z } from "zod"

export const changelogComposeFormSchema = z.object({
  title: z.string().trim().min(1, "Title required"),
  summary: z.string().trim().min(1, "Summary required"),
  body: z.string().trim().min(1, "Body required"),
  publishedAtLocal: z
    .string()
    .min(1, "Choose a release date")
    .refine((s) => !Number.isNaN(new Date(s).getTime()), {
      message: "Invalid release date",
    }),
  category: z.string(),
  breaking: z.boolean(),
  tags: z.array(z.string()),
  tagInput: z.string(),
  draftAdditionalContext: z.string(),
})

export type ChangelogComposeFormValues = z.infer<typeof changelogComposeFormSchema>

export function getDefaultComposeFormValues(): ChangelogComposeFormValues {
  return {
    title: "",
    summary: "",
    body: "",
    publishedAtLocal: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: "",
    breaking: false,
    tags: [],
    tagInput: "",
    draftAdditionalContext: "",
  }
}
