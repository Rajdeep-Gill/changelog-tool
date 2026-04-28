"use client"

import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

type ChangelogBreadcrumbsProps = {
  /** Set on entry pages; index leaves this empty so "Changelog" is the current crumb. */
  entryTitle?: string
  className?: string
}

export function ChangelogBreadcrumbs({
  entryTitle,
  className,
}: ChangelogBreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList
        className={cn(
          "gap-1.5 wrap-break-word text-[0.9375rem] leading-snug text-muted-foreground"
        )}
      >
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {entryTitle ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/changelog" />}>
                Changelog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-48 truncate sm:max-w-xl">
                {entryTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>Changelog</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
