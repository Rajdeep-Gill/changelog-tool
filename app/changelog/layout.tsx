import { Newsreader } from "next/font/google"

import { cn } from "@/lib/utils"

const changelogDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-changelog-display",
  display: "swap",
})

export default function ChangelogLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div
      className={cn(
        changelogDisplay.variable,
        "[--font-heading:var(--font-changelog-display)]"
      )}
    >
      {children}
    </div>
  )
}
