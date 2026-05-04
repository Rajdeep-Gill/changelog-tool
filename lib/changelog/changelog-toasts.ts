import { toast } from "sonner"

type RouterLike = {
  push: (href: string) => void
}

type ChangelogEntryToast = {
  slug: string
  title: string
}

export function toastEntryCreated(router: RouterLike, entry: ChangelogEntryToast) {
  toast.success("Added to changelog", {
    description: entry.title,
    action: {
      label: "View",
      onClick: () => {
        router.push(`/changelog/${entry.slug}`)
      },
    },
  })
}

export function toastEntrySaved(router: RouterLike, entry: ChangelogEntryToast) {
  toast.success("Saved", {
    description: entry.title,
    action: {
      label: "View",
      onClick: () => router.push(`/changelog/${entry.slug}`),
    },
  })
}

export function toastEntryDeleted(router: RouterLike) {
  toast.success("Removed from changelog")
  router.push("/edit")
}
