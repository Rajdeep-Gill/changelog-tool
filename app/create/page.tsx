import { CreateChangelogForm } from "./create-changelog-form"

export default function CreatePage() {
  return (
    <CreateChangelogForm defaultRepoString={process.env.GITHUB_DEFAULT_REPO ?? ""} />
  )
}
