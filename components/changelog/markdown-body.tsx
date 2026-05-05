"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ShikiHighlighter, { isInlineCode } from "react-shiki"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { normalizeMarkdownHtmlBreaks } from "@/lib/changelog/normalize-markdown-html-breaks"
import { cn } from "@/lib/utils"

const shikiDualTheme = {
  light: "github-light",
  dark: "github-dark",
} as const

type MarkdownCodeBlockProps = {
  code: string
  language: string
  defaultColor: "light" | "dark"
}

function MarkdownCodeBlock({
  code,
  language,
  defaultColor,
}: MarkdownCodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div
      className={cn(
        "group/code relative my-4 overflow-hidden rounded-lg border border-border",
        "[--line-numbers-foreground:var(--muted-foreground)]",
      )}
    >
      <div className="pointer-events-none absolute top-2 right-2 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="pointer-events-auto border border-border/60 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-primary" weight="bold" />
          ) : (
            <CopySimpleIcon className="size-3.5" />
          )}
        </Button>
      </div>
      <ShikiHighlighter
        as="div"
        language={language}
        theme={shikiDualTheme}
        defaultColor={defaultColor}
        showLanguage={false}
        showLineNumbers
        addDefaultStyles={false}
        className={cn(
          "not-prose font-mono text-[0.8125rem] leading-relaxed",
          /* Single surface: Shiki theme background on the inner pre */
          "[&_pre]:m-0 [&_pre]:max-w-none [&_pre]:rounded-none [&_pre]:border-0",
          "[&_pre]:py-3 [&_pre]:pl-4 [&_pre]:pr-12 [&_pre]:overflow-x-auto",
          "[&_code]:block [&_code]:bg-transparent",
        )}
      >
        {code}
      </ShikiHighlighter>
    </div>
  )
}

function createMarkdownComponents(
  defaultColor: "light" | "dark",
): Components {
  return {
    h1: ({ className, ...props }) => (
      <h1
        className={`mt-8 mb-3 text-2xl font-medium tracking-tight text-foreground first:mt-0 ${className ?? ""}`}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={`mt-8 mb-3 text-lg font-medium tracking-tight text-foreground first:mt-0 ${className ?? ""}`}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={`mt-6 mb-2 text-base font-medium text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={`my-3 text-[0.9375rem] leading-relaxed text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    a: ({ className, href, children, ...props }) => {
      if (href?.startsWith("/")) {
        return (
          <Link
            href={href}
            className={`text-primary underline underline-offset-4 hover:text-primary/80 ${className ?? ""}`}
            {...props}
          >
            {children}
          </Link>
        )
      }
      return (
        <a
          href={href}
          className={`text-primary underline underline-offset-4 hover:text-primary/80 ${className ?? ""}`}
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },
    ul: ({ className, ...props }) => (
      <ul
        className={`my-3 list-disc space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={`my-3 list-decimal space-y-1.5 pl-5 text-[0.9375rem] leading-relaxed text-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={`leading-relaxed ${className ?? ""}`} {...props} />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={`my-4 border-l-2 border-primary/40 pl-4 text-[0.9375rem] text-muted-foreground ${className ?? ""}`}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr className={`my-8 border-border ${className ?? ""}`} {...props} />
    ),
    code: ({ className, children, node, ...props }) => {
      const text = String(children).replace(/\n$/, "")

      if (node && isInlineCode(node)) {
        return (
          <code
            className={`rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground ${className ?? ""}`}
            {...props}
          >
            {children}
          </code>
        )
      }

      const match = className?.match(/language-(\S+)/)
      const language = match?.[1] ?? "text"

      return (
        <MarkdownCodeBlock
          code={text}
          language={language}
          defaultColor={defaultColor}
        />
      )
    },
    pre: ({ children }) => <>{children}</>,
    table: ({ className, ...props }) => (
      <div className="my-4 overflow-x-auto">
        <table className={`w-full border-collapse text-left text-sm ${className ?? ""}`} {...props} />
      </div>
    ),
    thead: ({ className, ...props }) => (
      <thead className={`border-b border-border ${className ?? ""}`} {...props} />
    ),
    tbody: ({ className, ...props }) => (
      <tbody className={`divide-y divide-border ${className ?? ""}`} {...props} />
    ),
    tr: ({ className, ...props }) => <tr className={`${className ?? ""}`} {...props} />,
    th: ({ className, ...props }) => (
      <th
        className={`px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase ${className ?? ""}`}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td className={`px-3 py-2 align-top text-[0.9375rem] ${className ?? ""}`} {...props} />
    ),
  }
}

type MarkdownBodyProps = {
  children: string
  className?: string
}

export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  const { resolvedTheme } = useTheme()
  const defaultColor = resolvedTheme === "dark" ? "dark" : "light"
  const components = React.useMemo(
    () => createMarkdownComponents(defaultColor),
    [defaultColor],
  )
  const source = normalizeMarkdownHtmlBreaks(children)

  return (
    <article className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </article>
  )
}
