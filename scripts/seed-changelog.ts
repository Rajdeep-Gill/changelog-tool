/**
 * Dev-only seed: inserts sample changelog rows with varied summaries.
 *
 * Usage (from repo root, DATABASE_URL set — e.g. via .env.local):
 *   pnpm db:seed
 */

import { createRequire } from "node:module"

import { subDays } from "date-fns"

import { insertChangelogEntry } from "@/lib/server/changelog-repository"

const require = createRequire(import.meta.url)
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env")

loadEnvConfig(process.cwd())

const stressTestBody = `
> **Release overview:** This note is a *kitchen-sink* changelog used only in local seeds. It is safe to ignore every claim below—it exists purely to stress typography, code blocks, and tables.

We shipped a coordinated update across the **ingestion pipeline**, **GraphQL API**, and **webhooks** layer. Highlights are summarized up front; drill into the sections for migration steps, copy-paste examples, and compatibility matrices.

---

## TL;DR

| Area | What changed | Risk |
| --- | --- | --- |
| API | Cursor-based pagination on \`GET /v1/events\` | Low |
| Workers | Exactly-once-ish delivery via idempotency keys | Medium |
| Dashboard | Realtime fan-out over **Server-Sent Events** | Low |

---

## Motivation

Customers with **>500k events/day** were seeing tail latency spike during peak UTC hours. Profiling showed three hotspots:

1. ~~Redundant JSON parsing in the edge cache~~ *(removed in this release)*
2. N+1 fetches when expanding \`actor\` on event rows
3. Webhook workers retrying without jitter, causing *thundering herds*

> **Note:** If you relied on the undocumented \`?include=legacy\` query flag, read the **Breaking changes** section below before upgrading.

---

## New: cursor pagination

List endpoints now return a **stable ordering** with an opaque \`next_cursor\`. Clients should treat cursors as opaque blobs—do not parse them.

\`\`\`typescript
type Page<T> = {
  data: T[]
  next_cursor: string | null
}

export async function fetchAllPages<T>(
  initialPath: string,
): Promise<T[]> {
  const out: T[] = []
  let cursor: string | null = null
  do {
    const qs = cursor ? \`?cursor=\${encodeURIComponent(cursor)}\` : ""
    const res = await fetch(\`\${initialPath}\${qs}\`, {
      headers: { Authorization: \`Bearer \${process.env.API_TOKEN}\` },
    })
    if (!res.ok) throw new Error(\`events: \${res.status}\`)
    const page = (await res.json()) as Page<T>
    out.push(...page.data)
    cursor = page.next_cursor
  } while (cursor)
  return out
}
\`\`\`

See also: [MDN: \`encodeURIComponent\`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

---

## Webhook delivery semantics

We now honor the \`Idempotency-Key\` header end-to-end. Duplicate deliveries within a **24-hour** window collapse to a single downstream side-effect.

\`\`\`bash
curl -sS -X POST "https://api.example.com/v1/webhooks/test" \\
  -H "Authorization: Bearer ck_live_REPLACE_ME" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{"hook": "deployment.finished", "deployment_id": "dep_01jq_xyz"}'
\`\`\`

Sample **success** payload shape:

\`\`\`json
{
  "delivered": true,
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "attempt": 1,
  "next_retry_at": null
}
\`\`\`

---

## Dashboard: live deployment stream

The deployments page subscribes to \`/stream/deployments?project_id=...\`. Event names match our public [@example/openapi](https://github.com/OAI/OpenAPI-Specification) vocabulary where possible.

### Checklist for integrators

- [x] SSE reconnection with \`Last-Event-ID\`
- [x] Heartbeats every **15s** to keep proxies happy
- [ ] GraphQL subscriptions *(still beta; not covered here)*

---

## Breaking changes

1. **Removed:** Undocumented \`?include=legacy\` on \`/v1/events\`. Use \`expand[]=actor\` instead.
2. **Stricter:** \`409 Conflict\` when creating a webhook endpoint with a **duplicate** \`url\` + \`secret_version\` pair.

---

## Further reading

- [HTTP Semantics (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110.html) — status codes we return on conflicts
- [The Twelve-Factor App: Logs](https://12factor.net/logs) — why we stdout JSON in workers

_Internal link smoke test:_ if your dev server serves it, [\`/edit\`](/edit) should resolve via \`next/link\`.

Thank you for testing the changelog renderer—**tables**, **code**, **tasks**, and **quotes** should all be visibly distinct.
`.trim()

const samples: Array<{
  title: string
  summary: string
  body: string
  daysAgo: number
  category?: string
  breaking?: boolean
  tags?: string[]
}> = [
  {
    title: "[QA] Kitchen-sink release — APIs, webhooks, and live streams",
    summary:
      "Dense markdown fixture for local testing: tables, GFM task lists, TypeScript/bash/JSON fences, external + internal links, blockquotes, strikethrough, and breaking-callouts. Not a real product release.",
    body: stressTestBody,
    daysAgo: 0,
    category: "Platform",
    breaking: true,
    tags: ["api", "webhooks", "markdown-fixture", "sse"],
  },
  {
    title: "Faster dashboard loads for large accounts",
    summary:
      "We trimmed duplicate work on the home dashboard so first paint is noticeably quicker for workspaces with many projects.",
    body: "## Performance\n\n- Parallelized billing summary fetch\n- Cached team list for 60s\n\n_No action required._",
    daysAgo: 2,
    category: "Performance",
    tags: ["dashboard"],
  },
  {
    title: "Webhook retries with exponential backoff",
    summary:
      "Outbound webhooks now retry on transient failures instead of failing immediately, reducing noise in your logs.",
    body: "## Integrations\n\nRetries: **3** attempts with backoff **1s → 4s → 16s**.",
    daysAgo: 5,
    category: "API",
    tags: ["webhooks", "integrations"],
  },
  {
    title: "Breaking: API keys must use the v2 prefix",
    summary:
      "New keys are issued as `ck_v2_…`. Existing v1 keys keep working until the sunset date announced in the docs.",
    body: "## Migration\n\n1. Create a v2 key in **Settings → API**.\n2. Rotate callers before **2026-07-01**.",
    daysAgo: 8,
    category: "API",
    breaking: true,
    tags: ["security"],
  },
  {
    title: "Inline comments on diff view",
    summary:
      "You can leave comments directly on changed lines when reviewing a deployment diff—mentions and threads included.",
    body: "## Collaboration\n\nOpen any diff → click the **+** gutter to start a thread.",
    daysAgo: 12,
    category: "Product",
    tags: ["collaboration"],
  },
  {
    title: "CSV export for usage reports",
    summary:
      "Usage → Export now offers CSV in addition to JSON for finance and ops workflows.",
    body: "## Reporting\n\n**Usage → Export → CSV** (up to 90 days per file).",
    daysAgo: 18,
    category: "Reporting",
    tags: ["export"],
  },
  {
    title: "SAML session lifetime aligned with IdP",
    summary:
      "SSO sessions now respect shorter of IdP `SessionNotOnOrAfter` and our 12h cap, cutting unexpected logouts.",
    body: "## SSO\n\nNo configuration change required for most setups.",
    daysAgo: 22,
    category: "Security",
    tags: ["sso", "enterprise"],
  },
  {
    title: "Mobile timeline supports pinch-to-zoom",
    summary:
      "The incident timeline on mobile pinch-zooms into hour-level detail without horizontal scroll fighting.",
    body: "## Mobile\n\nAvailable on **iOS Safari** and **Chrome Android**.",
    daysAgo: 28,
    category: "Mobile",
  },
  {
    title: "Postgres 16 on managed database tier",
    summary:
      "New clusters provision on Postgres 16; existing databases will move during the maintenance window you pick.",
    body: "## Infrastructure\n\nSee **status** for regional rollout order.",
    daysAgo: 35,
    category: "Infrastructure",
    tags: ["database"],
  },
  {
    title: "Copyable curl examples in API docs",
    summary:
      "Each endpoint now shows a minimal curl snippet with your test token prefilled when you are signed in.",
    body: "## Docs\n\nToggle **Show my token** in the docs chrome.",
    daysAgo: 41,
    category: "Docs",
    tags: ["api"],
  },
  {
    title: "Audit log filters by actor and resource",
    summary:
      "Filter audit events by user email, API key id, or resource id to narrow compliance reviews quickly.",
    body: "## Compliance\n\n**Organization → Audit log → Filters**",
    daysAgo: 48,
    category: "Compliance",
    tags: ["audit"],
  },
  {
    title: "Editor autosave drafts every few seconds",
    summary:
      "Long-form notes in the editor autosave as drafts so tab closes are less scary.",
    body: "## Editor\n\nDrafts live under **Docs → Drafts** for 30 days.",
    daysAgo: 55,
    category: "Product",
  },
  {
    title: "Regional failover drill completed (no customer impact)",
    summary:
      "We ran a full failover exercise in eu-west; traffic failed over in under 90s with zero user-facing errors.",
    body: "## Reliability\n\nPostmortem shared with enterprise admins.",
    daysAgo: 62,
    category: "Reliability",
    tags: ["infrastructure"],
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local and retry.")
    process.exit(1)
  }

  let n = 0
  for (const row of samples) {
    const publishedAt = subDays(new Date(), row.daysAgo)
    await insertChangelogEntry({
      title: row.title,
      summary: row.summary,
      body: row.body,
      publishedAt,
      category: row.category ?? null,
      breaking: row.breaking ?? false,
      tags: row.tags?.length ? row.tags : null,
      source: null,
    })
    n += 1
    console.log(`Inserted (${n}/${samples.length}): ${row.title}`)
  }

  console.log(`\nDone. Seeded ${n} changelog entries.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
