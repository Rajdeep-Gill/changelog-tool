import { EditChangelogForm } from "../edit-changelog-form"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditSlugPage(props: PageProps) {
  const { slug } = await props.params
  return <EditChangelogForm slug={slug} />
}
