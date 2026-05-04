"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useDeleteChangelog } from "@/features/changelog/api/use-delete-changelog"
import { useUpdateChangelog } from "@/features/changelog/api/use-update-changelog"
import { useChangelogEntry } from "@/features/changelog/api/use-changelog-entry"
import {
  changelogComposeFormSchema,
  type ChangelogComposeFormValues,
  getDefaultComposeFormValues,
} from "@/lib/changelog/changelog-compose-form-schema"
import { toastEntryDeleted, toastEntrySaved } from "@/lib/changelog/changelog-toasts"
import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import {
  changelogBreadcrumbRowClassName,
  changelogPageHeaderSectionClassName,
  editMainColumnClassName,
} from "@/components/changelog/layout-classes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ChangelogEntryForm } from "@/components/changelog/changelog-entry-form"
import { formatPublishedAtLocal } from "@/lib/changelog/published-at-local"

type EditChangelogFormProps = {
  slug: string
}

export function EditChangelogForm({ slug }: EditChangelogFormProps) {
  const router = useRouter()
  const entryQuery = useChangelogEntry(slug)
  const [slugInput, setSlugInput] = React.useState(slug)

  const composeForm = useForm<ChangelogComposeFormValues>({
    resolver: standardSchemaResolver(changelogComposeFormSchema),
    defaultValues: getDefaultComposeFormValues(),
  })
  const { reset } = composeForm

  const initialValues = React.useMemo<Partial<ChangelogComposeFormValues> | null>(() => {
    const entry = entryQuery.data
    if (!entry) return null
    return {
      title: entry.title,
      summary: entry.summary,
      body: entry.body,
      publishedAtLocal:
        formatPublishedAtLocal(entry.publishedAt) ??
        getDefaultComposeFormValues().publishedAtLocal,
      category: entry.category ?? "",
      breaking: Boolean(entry.breaking),
      tags: entry.tags ?? [],
      tagInput: "",
      draftAdditionalContext: "",
    }
  }, [entryQuery.data])

  React.useEffect(() => {
    const entry = entryQuery.data
    if (!entry) return
    setSlugInput(entry.slug)
  }, [entryQuery.data])

  React.useEffect(() => {
    if (!initialValues) return
    reset({ ...getDefaultComposeFormValues(), ...initialValues })
  }, [slug, initialValues, reset])

  const saveMutation = useUpdateChangelog({
    onSuccess: (entry) => {
      if (entry.slug !== slug) {
        router.replace(`/edit/${encodeURIComponent(entry.slug)}`)
      }
      toastEntrySaved(router, entry)
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

  const deleteMutation = useDeleteChangelog({
    onSuccess: () => {
      toastEntryDeleted(router)
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

  const handleDelete = () => {
    if (
      !window.confirm(
        "Delete this changelog entry permanently? This cannot be undone."
      )
    ) {
      return
    }
    void deleteMutation.mutateAsync({ param: { slug } })
  }

  return (
    <div className="min-h-svh bg-background pb-16">
      <div className={editMainColumnClassName}>
        <div className={changelogBreadcrumbRowClassName}>
          <ChangelogBreadcrumbs
            priorSubPage={{ label: "Edit", href: "/edit" }}
            entryTitle={entryQuery.isPending ? "…" : (entryQuery.data?.title?.trim() || "Untitled")}
          />
        </div>

        {entryQuery.isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3 max-w-md rounded-md" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : entryQuery.isError ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Could not load entry</AlertTitle>
            <AlertDescription>
              {entryQuery.error?.message ?? "Unknown error"}
            </AlertDescription>
          </Alert>
        ) : entryQuery.data === null ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Not found</AlertTitle>
            <AlertDescription>
              No changelog entry matches this URL.&nbsp;
              <Link href="/edit" className="font-medium underline underline-offset-4">
                Back to edit list
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <header className={changelogPageHeaderSectionClassName}>
              <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Edit entry
              </h1>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
                Update publication details below, or remove the entry from the changelog.
              </p>
            </header>

            <div className="space-y-4">
              <ChangelogEntryForm
                mode="edit"
                composeForm={composeForm}
                submitPending={saveMutation.isPending || deleteMutation.isPending}
                renderPreCompose={({ composeTitle }) => (
                  <div className="space-y-1">
                    <Label htmlFor="edit-slug">URL slug</Label>
                    <Input
                      id="edit-slug"
                      spellCheck={false}
                      autoComplete="off"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      className="font-mono text-sm"
                    />
                    {composeTitle.trim() ? (
                      <p className="text-sm text-muted-foreground">
                        Editing <span className="font-medium">{composeTitle.trim()}</span>
                      </p>
                    ) : null}
                  </div>
                )}
                onSubmit={async ({ normalized, publishedAt }) => {
                  const newSlugTrim = slugInput.trim()
                  if (!newSlugTrim) {
                    toast.error("Slug is required")
                    return
                  }

                  await saveMutation.mutateAsync({
                    param: { slug },
                    json: {
                      title: normalized.title,
                      summary: normalized.summary,
                      body: normalized.body,
                      publishedAt,
                      slug: newSlugTrim,
                      category: normalized.category,
                      breaking: normalized.breaking,
                      tags: normalized.tags,
                    },
                  })
                }}
                leadingActionSlot={
                  <>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteMutation.isPending || saveMutation.isPending}
                      onClick={handleDelete}
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <Spinner className="size-4" />
                          Deleting…
                        </>
                      ) : (
                        "Delete entry"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href="/edit" />}
                    >
                      Back to list
                    </Button>
                  </>
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
