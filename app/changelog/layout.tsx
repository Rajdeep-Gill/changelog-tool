import { ChangelogActiveBreadcrumbs } from "@/components/changelog/changelog-active-breadcrumbs"

type ChangelogLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function ChangelogLayout({ children }: ChangelogLayoutProps) {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex min-h-8 w-full flex-wrap items-center">
          <ChangelogActiveBreadcrumbs />
        </div>
        {children}
      </div>
    </div>
  )
}
