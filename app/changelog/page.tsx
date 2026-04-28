import { ChangelogBreadcrumbs } from "@/components/changelog/changelog-breadcrumbs"
import { ChangelogMonthRail } from "@/components/changelog/changelog-month-rail"
import { ChangelogTimeline } from "@/components/changelog/changelog-timeline"
import { getChangelogMonthSections } from "@/components/changelog/group-by-month"
import {
  changelogBreadcrumbRowClassName,
  changelogMainColumnClassName,
  changelogPageHeaderSectionClassName,
} from "@/components/changelog/layout-classes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getAllEntries } from "@/lib/changelog"

export default function ChangelogPage() {
  const entries = getAllEntries()
  const monthSections = getChangelogMonthSections(entries)

  return (
    <TooltipProvider delay={400}>
      <div className="min-h-svh bg-background">
        <div className={changelogMainColumnClassName}>
          <div className={changelogBreadcrumbRowClassName}>
            <ChangelogBreadcrumbs />
          </div>

          <header className={changelogPageHeaderSectionClassName}>
            <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Changelog
            </h1>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
              New features, fixes, and other updates to the platform. Click through for full
              release notes.
            </p>
          </header>

          <ChangelogTimeline entries={entries} />
        </div>

        <ChangelogMonthRail sections={monthSections} />
      </div>
    </TooltipProvider>
  )
}
