import { notFound } from "next/navigation"

import {
  getChangelogEntryBySlug,
  listChangelogEntries,
} from "@/lib/server/changelog-repository"

import { ChangelogEntryView } from "./changelog-entry-view"

type PageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const entries = await listChangelogEntries()
  return entries.map((entry) => ({ slug: entry.slug }))
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = await getChangelogEntryBySlug(slug)

  if (!entry) {
    notFound()
  }

  return <ChangelogEntryView entry={entry} />
}
