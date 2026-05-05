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
  /**
   * Inserted as a link between Changelog and `entryTitle` when both are set
   * (e.g. Edit list when editing a changelog entry).
   */
  priorSubPage?: { label: string; href: string }
  /**
   * Crumb after Changelog (Changelog stays a link). e.g. `/create` uses "Create".
   * Ignored when `entryTitle` is set.
   */
  subPage?: string
  className?: string
}

export function ChangelogBreadcrumbs({
  entryTitle,
  priorSubPage,
  subPage,
  className,
}: ChangelogBreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
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
            {priorSubPage ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href={priorSubPage.href} />}>
                    {priorSubPage.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-48 truncate sm:max-w-xl">
                {entryTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : subPage ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/changelog" />}>
                Changelog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {subPage}
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
