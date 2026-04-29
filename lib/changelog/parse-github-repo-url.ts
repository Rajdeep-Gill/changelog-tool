export function parseGithubRepoInput(
  raw: string
): { owner: string; repo: string } | null {
  const s = raw.trim()
  if (!s) return null

  const slashForm = s.match(/^([^/]+)\/([^/]+)$/)
  if (slashForm && !s.includes("github.com")) {
    return { owner: slashForm[1], repo: slashForm[2] }
  }

  try {
    const href = s.includes("://") ? s : `https://${s}`
    const u = new URL(href)
    const host = u.hostname.replace(/^www\./, "")
    if (host !== "github.com") {
      return null
    }
    const segments = u.pathname.split("/").filter(Boolean)
    if (segments.length < 2) {
      return null
    }
    let repo = segments[1]
    if (repo.endsWith(".git")) {
      repo = repo.slice(0, -4)
    }
    return { owner: segments[0], repo }
  } catch {
    return null
  }
}
