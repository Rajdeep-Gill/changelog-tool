import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          Changelog tool
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Track product changes over time. Browse published entries or draft new ones from GitHub
          commits.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href="/changelog" />}
          >
            Open changelog
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/create" />}
          >
            Create
          </Button>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/edit" />}
          >
            Edit
          </Button>
        </div>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Press <kbd>d</kbd> to toggle dark mode
        </p>
      </div>
    </div>
  )
}
