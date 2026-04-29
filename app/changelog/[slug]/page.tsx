import type { Metadata } from "next"

import { getChangelogEntryBySlug } from "@/lib/server/changelog-repository"

import { ChangelogEntryClient } from "./changelog-entry-client"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const entry = await getChangelogEntryBySlug(slug)
    if (entry) {
      return {
        title: `${entry.title} · Changelog`,
        description: entry.summary,
      }
    }
  } catch {
    /* e.g. DATABASE_URL missing during static analysis */
  }
  return { title: "Changelog" }
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params
  return <ChangelogEntryClient slug={slug} />
}
