import { notFound } from "next/navigation"

import { getChangelogEntryBySlug } from "@/lib/server/changelog-repository"

import { ChangelogEntryView } from "./changelog-entry-view"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = await getChangelogEntryBySlug(slug)

  if (!entry) {
    notFound()
  }

  return <ChangelogEntryView entry={entry} />
}
