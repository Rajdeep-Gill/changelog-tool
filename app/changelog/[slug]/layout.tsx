import type { ReactNode } from "react"

import { ChangelogEntryLayoutFooter } from "./changelog-entry-layout-footer"

type ChangelogEntryLayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function ChangelogEntryLayout({
  children,
  params,
}: ChangelogEntryLayoutProps) {
  const { slug } = await params

  return (
    <>
      {children}
      <ChangelogEntryLayoutFooter slug={slug} />
    </>
  )
}
