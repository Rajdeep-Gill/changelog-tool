"use client"

import * as React from "react"
import { XIcon } from "@phosphor-icons/react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import { DEFAULT_CHANGELOG_TAGS } from "@/lib/changelog/default-tags"
import type { ChangelogComposeFormValues } from "@/lib/changelog/changelog-compose-form-schema"
import { mergeUniqueTags, normalizeTagLabel } from "@/lib/changelog/tag-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ComposeTagsFieldProps = {
  composeForm: UseFormReturn<ChangelogComposeFormValues>
}

export function ComposeTagsField({ composeForm }: ComposeTagsFieldProps) {
  const { control, getValues, setValue } = composeForm
  const tags = useWatch({ control, name: "tags" }) ?? []

  const tagsScrollRef = React.useRef<HTMLDivElement>(null)
  const [tagsScrollFade, setTagsScrollFade] = React.useState({
    left: false,
    right: false,
  })

  const presetTagKeySet = React.useMemo(
    () => new Set(DEFAULT_CHANGELOG_TAGS.map((t) => t.toLowerCase())),
    []
  )

  const customTags = React.useMemo(
    () => tags.filter((t) => !presetTagKeySet.has(t.toLowerCase())),
    [tags, presetTagKeySet]
  )

  const updateTagsScrollFade = React.useCallback(() => {
    const el = tagsScrollRef.current
    if (!el) {
      setTagsScrollFade({ left: false, right: false })
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = el
    const overflow = scrollWidth - clientWidth
    const eps = 4
    setTagsScrollFade({
      left: scrollLeft > eps,
      right: overflow > eps && scrollLeft < overflow - eps,
    })
  }, [])

  React.useLayoutEffect(() => {
    updateTagsScrollFade()
    const el = tagsScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      updateTagsScrollFade()
    })
    ro.observe(el)
    window.addEventListener("resize", updateTagsScrollFade)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", updateTagsScrollFade)
    }
  }, [updateTagsScrollFade, tags, customTags])

  const addTagsFromInput = () => {
    const ti = normalizeTagLabel(getValues("tagInput"))
    if (!ti) return
    setValue("tags", mergeUniqueTags(getValues("tags"), [ti]), {
      shouldDirty: true,
    })
    setValue("tagInput", "")
  }

  const toggleSuggestedTag = (label: string) => {
    const key = label.toLowerCase()
    const prev = getValues("tags")
    const has = prev.some((t) => t.toLowerCase() === key)
    setValue(
      "tags",
      has
        ? prev.filter((t) => t.toLowerCase() !== key)
        : mergeUniqueTags(prev, [label]),
      { shouldDirty: true }
    )
  }

  const removeTag = (label: string) => {
    const key = label.toLowerCase()
    const prev = getValues("tags")
    setValue(
      "tags",
      prev.filter((t) => t.toLowerCase() !== key),
      { shouldDirty: true }
    )
  }

  return (
    <Field>
      <FieldLabel htmlFor="newTag">Tags</FieldLabel>
      <div className="flex min-h-9 items-center gap-2">
        <div className="relative min-h-8 min-w-0 flex-1">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-1 w-10 bg-linear-to-r from-background via-background/85 to-transparent transition-opacity duration-200",
              !tagsScrollFade.left && "opacity-0"
            )}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-1 w-12 bg-linear-to-l from-background via-background/85 to-transparent backdrop-blur-[0.5px] transition-opacity duration-200",
              !tagsScrollFade.right && "opacity-0"
            )}
            aria-hidden
          />
          <div
            ref={tagsScrollRef}
            onScroll={updateTagsScrollFade}
            className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {DEFAULT_CHANGELOG_TAGS.map((label) => {
              const active = tags.some(
                (t) => t.toLowerCase() === label.toLowerCase()
              )
              return (
                <Button
                  key={label}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={active}
                  className={cn(
                    "h-7 shrink-0 rounded-full px-3 text-xs transition-[color,background-color,border-color,box-shadow]",
                    active
                      ? "border-primary/45 bg-primary/10 font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 hover:bg-primary/[0.14] dark:border-primary/40 dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:hover:bg-primary/22"
                      : "font-normal text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                  )}
                  onClick={() => toggleSuggestedTag(label)}
                >
                  {label}
                </Button>
              )
            })}
            {customTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "h-7 shrink-0 gap-1 border-primary/40 bg-primary/10 px-2.5 py-0 pe-1 leading-none font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-primary/35 dark:bg-primary/15 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                )}
              >
                <span className="max-w-48 truncate">{tag}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-primary/55 transition-colors hover:bg-primary/15 hover:text-primary"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => removeTag(tag)}
                >
                  <XIcon className="size-3.5" weight="bold" aria-hidden />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <Controller
          name="tagInput"
          control={control}
          render={({ field }) => (
            <div className="flex shrink-0 items-center gap-1.5">
              <Input
                id="newTag"
                placeholder="Add tag"
                className="h-8 w-[min(11rem,40vw)] sm:w-44"
                {...field}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTagsFromInput()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 shrink-0 px-2.5"
                onClick={addTagsFromInput}
              >
                Add
              </Button>
            </div>
          )}
        />
      </div>
    </Field>
  )
}
