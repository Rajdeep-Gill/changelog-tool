import { ChangelogActiveBreadcrumbs } from "@/components/changelog/changelog-active-breadcrumbs"

type ChangelogLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function ChangelogLayout({ children }: ChangelogLayoutProps) {
  return (
    <div className="min-h-vh bg-background">
      <div className="mx-auto w-full max-w-3xl md:max-w-5xl">
        <div className="md:mt-12 mt-6 mb-2 px-4 flex min-h-8 w-full flex-wrap items-center">
          <ChangelogActiveBreadcrumbs />
        </div>
        <div className="md:pb-6 pb-3 px-4">

        {children}
        </div>
      </div>
    </div>
  )
}
