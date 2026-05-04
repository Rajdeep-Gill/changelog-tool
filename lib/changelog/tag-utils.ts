export function normalizeTagLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ")
}

export function mergeUniqueTags(existing: string[], additions: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of [...existing, ...additions]) {
    const n = normalizeTagLabel(t)
    if (!n) continue
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
  }
  return out
}
