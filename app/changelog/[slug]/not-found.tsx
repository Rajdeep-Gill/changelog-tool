import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[240px] gap-2">
      <h2 className="text-2xl font-bold">Could not find the requested changelog entry</h2>
      <p className="text-sm text-muted-foreground">Please return home or find another entry below.</p>
      <Button nativeButton={false} render={<Link href="/changelog" />} variant="outline">Return to changelog</Button>
    </div>
  )
}
