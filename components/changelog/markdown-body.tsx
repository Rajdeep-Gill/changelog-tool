import Link from "next/link"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const markdownComponents: Components = {
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
  code: ({ className, children, ...props }) => {
    const text = String(children).replace(/\n$/, "")
    const isBlock =
      Boolean(className?.includes("language-")) || text.includes("\n")
    if (isBlock) {
      return (
        <code className={`font-mono text-[0.8125rem] ${className ?? ""}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className={`rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground ${className ?? ""}`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ className, ...props }) => (
    <pre
      className={`my-4 overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 font-mono text-[0.8125rem] leading-relaxed text-foreground ${className ?? ""}`}
      {...props}
    />
  ),
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

type MarkdownBodyProps = {
  children: string
  className?: string
}

export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  return (
    <article className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </article>
  )
}
