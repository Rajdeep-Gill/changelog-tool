import { Skeleton } from "@/components/ui/skeleton"

export function ChangelogIndexSkeleton() {
  return (
    <>
      <header className="mb-10 sm:mb-12">
        <Skeleton className="h-9 w-[min(16rem,60vw)] max-w-[16rem]" />
        <Skeleton className="mt-5 h-18 max-w-2xl rounded-lg" />
      </header>

      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </>
  )
}
