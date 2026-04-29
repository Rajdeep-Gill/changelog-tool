import { Badge } from "@/components/ui/badge"
import type { ChangelogEntry } from "@/lib/changelog/types"
import { cn } from "@/lib/utils"

type EntryTagsProps = {
  tags: ChangelogEntry["tags"]
  className?: string
}

export function EntryTags({ tags, className }: EntryTagsProps) {
  if (!tags?.length) return null
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="font-normal">
          {tag}
        </Badge>
      ))}
    </div>
  )
}
