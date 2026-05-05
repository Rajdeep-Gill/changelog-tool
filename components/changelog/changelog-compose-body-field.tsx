"use client"

import * as React from "react"
import { Editor, defaultValueCtx, rootCtx } from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { Milkdown, useEditor } from "@milkdown/react"
import { nord } from "@milkdown/theme-nord"

import { cn } from "@/lib/utils"

type ChangelogComposeBodyFieldProps = {
  initialMarkdown: string
  className?: string
  id?: string
  "aria-invalid"?: boolean
}

export function ChangelogComposeBodyField({
  initialMarkdown,
  className,
  id,
  "aria-invalid": ariaInvalid,
}: ChangelogComposeBodyFieldProps) {
  useEditor(
    (root) =>
      Editor.make()
        .config(nord)
        .config((ctx) => {
          ctx.set(rootCtx, root)
          ctx.set(defaultValueCtx, initialMarkdown)
        })
        .use(commonmark),
    []
  )

  return (
    <div
      id={id}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-1 flex-col rounded-md border border-input bg-background text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30 dark:border-input/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-inset focus-within:ring-ring/50",
        ariaInvalid && "border-destructive",
        "*:data-milkdown-root:flex *:data-milkdown-root:min-h-0 *:data-milkdown-root:min-w-0 *:data-milkdown-root:w-full *:data-milkdown-root:flex-1 *:data-milkdown-root:flex-col",
        "[&_.milkdown]:flex [&_.milkdown]:min-h-0 [&_.milkdown]:w-full [&_.milkdown]:min-w-0 [&_.milkdown]:flex-1 [&_.milkdown]:flex-col [&_.milkdown]:overflow-auto [&_.milkdown]:[scrollbar-gutter:stable]",
        "[&_.ProseMirror]:box-border [&_.ProseMirror]:min-h-full [&_.ProseMirror]:w-full [&_.ProseMirror]:max-w-none [&_.ProseMirror]:min-w-0 [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none sm:[&_.ProseMirror]:px-4 sm:[&_.ProseMirror]:py-3.5",
        className
      )}
      data-slot="changelog-compose-body"
    >
      <Milkdown />
    </div>
  )
}
