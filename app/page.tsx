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
          Track product changes over time. Browse the sample changelog or wire your own API when
          you&apos;re ready.
        </p>
        <Button
          nativeButton={false}
          className="mt-6"
          render={<Link href="/changelog" />}
        >
          Open changelog
        </Button>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Press <kbd>d</kbd> to toggle dark mode
        </p>
      </div>
    </div>
  )
}
