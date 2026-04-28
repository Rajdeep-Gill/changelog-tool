import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { format, parseISO } from "date-fns"

import { getAllEntries, getEntryBySlug, getStaticSlugs } from "@/lib/changelog"

import { ChangelogEntryView } from "./changelog-entry-view"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getStaticSlugs()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = getEntryBySlug(slug)
  if (!entry) {
    return { title: "Not found" }
  }
  return {
    title: `${entry.title} · Changelog`,
    description: entry.summary,
  }
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params
  const entry = getEntryBySlug(slug)
  if (!entry) notFound()

  const related = getAllEntries().filter((e) => e.slug !== slug).slice(0, 3)

  return (
    <ChangelogEntryView
      entry={entry}
      related={related}
      formattedDate={format(parseISO(entry.publishedAt), "MMMM d, yyyy")}
    />
  )
}
