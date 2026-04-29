import { Octokit } from "@octokit/rest"

const globalForOctokit = globalThis as unknown as {
  githubOctokit: Octokit | undefined
}

export function getOctokit(): Octokit {
  if (globalForOctokit.githubOctokit) {
    return globalForOctokit.githubOctokit
  }
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set")
  }
  const instance = new Octokit({
    auth: token,
  })
  globalForOctokit.githubOctokit = instance
  return instance
}
