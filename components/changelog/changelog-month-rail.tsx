"use client"

import { useCallback, useEffect, useState } from "react"

import { changelogMonthSectionId } from "@/components/changelog/group-by-month"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type ChangelogMonthSection = {
  monthKey: string
  label: string
}

type ChangelogMonthRailProps = {
  sections: ChangelogMonthSection[]
  className?: string
}

const SPY_RATIO = 0.32

function useActiveMonthKey(sections: ChangelogMonthSection[]) {
  const [activeKey, setActiveKey] = useState<string | null>(
    () => sections[0]?.monthKey ?? null
  )

  const recalc = useCallback(() => {
    if (sections.length === 0) return
    const line = window.innerHeight * SPY_RATIO
    let current = sections[0].monthKey

    for (const s of sections) {
      const el = document.getElementById(changelogMonthSectionId(s.monthKey))
      if (!el) continue
      if (el.getBoundingClientRect().top <= line) {
        current = s.monthKey
      }
    }

    const last = sections[sections.length - 1]
    const lastEl = last
      ? document.getElementById(changelogMonthSectionId(last.monthKey))
      : null
    if (lastEl) {
      const { bottom } = lastEl.getBoundingClientRect()
      if (bottom <= window.innerHeight * 0.92 && bottom > 0) {
        current = last.monthKey
      }
    }

    setActiveKey(current)
  }, [sections])

  useEffect(() => {
    recalc()
    window.addEventListener("scroll", recalc, { passive: true })
    window.addEventListener("resize", recalc)
    return () => {
      window.removeEventListener("scroll", recalc)
      window.removeEventListener("resize", recalc)
    }
  }, [recalc])

  return activeKey
}

function scrollToMonth(monthKey: string) {
  const id = changelogMonthSectionId(monthKey)
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function ChangelogMonthRail({
  sections,
  className,
}: ChangelogMonthRailProps) {
  const activeKey = useActiveMonthKey(sections)

  if (sections.length === 0) return null

  return (
    <nav
      aria-label="Jump to month"
      className={cn(
        "pointer-events-none fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex lg:pointer-events-auto xl:right-6",
        className
      )}
    >
      {sections.map((section) => {
        const isActive = section.monthKey === activeKey
        return (
          <Tooltip key={section.monthKey}>
            <TooltipTrigger
              aria-current={isActive ? "location" : undefined}
              aria-label={`Jump to ${section.label}`}
              className={cn(
                "pointer-events-auto rounded-full border-0 bg-transparent p-0 transition-[height,width,background-color,box-shadow] duration-200 ease-out",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              )}
              onClick={() => scrollToMonth(section.monthKey)}
            >
              <span
                className={cn(
                  "block rounded-full bg-muted-foreground/25 transition-all duration-200 ease-out",
                  "hover:bg-primary/60 hover:ring-2 hover:ring-primary/35",
                  isActive
                    ? "h-14 w-1.5 bg-primary shadow-md ring-2 ring-primary/25"
                    : "h-9 w-1 hover:h-11 hover:w-1.5"
                )}
              />
            </TooltipTrigger>
            <TooltipContent
              align="center"
              className="max-w-[14rem] text-left"
              side="left"
              sideOffset={10}
            >
              <span className="font-medium">{section.label}</span>
              <span className="mt-0.5 block text-[0.65rem] leading-snug text-background/80">
                Click or tap to scroll to this month
              </span>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
