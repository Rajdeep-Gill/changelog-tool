import type { ChangelogEntry } from "./types"

export const sampleChangelogEntries: ChangelogEntry[] = [
  {
    slug: "orchestrated-webhooks-v2",
    title: "Orchestrated webhooks v2",
    publishedAt: "2026-04-18T10:00:00.000Z",
    summary:
      "Delivery retries are now jittered and signed with a dedicated signing secret per endpoint.",
    category: "API",
    breaking: false,
    tags: ["webhooks", "reliability"],
    body: `
## Summary

Webhook deliveries now use **exponential backoff with jitter** to reduce thundering herds during incidents. Each endpoint can opt into a **per-endpoint signing secret**.

## What changed

- Retry schedule: \`1m → 5m → 30m → 2h → 8h\` (max 5 attempts)
- New header: \`X-Changelog-Signature-Version: v2\`

### Configuration

\`\`\`json
{
  "endpoint": "https://api.example.com/hooks",
  "signingSecretRef": "whsec_prod_01"
}
\`\`\`

## Migration

| Action | Before | After |
| --- | --- | --- |
| Verify signature | Shared project secret | Endpoint secret + version header |
| Dashboard | Single “Webhooks” page | Per-environment keys |

No code changes are required if you already verify **v1** signatures; v2 is opt-in per endpoint.
`,
  },
  {
    slug: "billing-meter-validation",
    title: "Stricter validation for billing meter values",
    publishedAt: "2026-04-02T14:30:00.000Z",
    summary:
      "Meter events with more than 15 significant digits are rejected with a clear validation error.",
    category: "Billing",
    breaking: true,
    body: `
## Overview

We now reject absurdly precise floating values that cannot be represented safely in our ledger.

### Error shape

\`\`\`
POST /v1/meter_events
→ 422 Unprocessable Entity

{
  "error": {
    "code": "meter_value_too_precise",
    "message": "Use at most 15 significant digits"
  }
}
\`\`\`

## Recommended fix

Round to **15 significant digits** before submit, or send quantities as **integers in micro-units**:

- Good: \`1523000000\` (micro-USD)
- Bad: \`1.5230000000000001\`
`,
  },
  {
    slug: "export-api-parquet",
    title: "Export API: Parquet and column selection",
    publishedAt: "2026-02-11T09:00:00.000Z",
    summary:
      "Exports can target Parquet with an explicit column list; defaults remain CSV for backward compatibility.",
    category: "Data",
    breaking: false,
    body: `
## Highlights

1. **Format** query: \`?format=parquet\`
2. **Columns** query: \`?columns=id,created_at,amount_cents\`

### Example

\`\`\`bash
curl -G "https://api.example.com/v1/exports/jobs" \\
  --data-urlencode "format=parquet" \\
  --data-urlencode "columns=user_id,event_type,timestamp"
\`\`\`

> **Note:** Parquet exports may take slightly longer to start while we spin up a columnar writer.

### Status checklist

- [x] Parquet writer
- [x] Column allowlist
- [ ] Cross-region copy (planned)
`,
  },
  {
    slug: "dashboard-audit-log-ui",
    title: "Dashboard: audit log filters and export",
    publishedAt: "2026-01-22T16:00:00.000Z",
    summary:
      "Filter audit events by actor, resource type, and time range; export matches as CSV from the UI.",
    category: "Dashboard",
    breaking: false,
    body: `
## For operators

The **Audit log** page now supports:

- **Actor** — user, service account, or system
- **Resource** — type + id prefix match
- **Time range** — presets + custom

### Privacy

Exports include only fields you already see in the table; **no raw payloads** unless you have the \`audit:read-content\` permission.
`,
  },
  {
    slug: "cli-v3-config-paths",
    title: "CLI v3: unified config paths",
    publishedAt: "2025-12-05T11:00:00.000Z",
    summary:
      "The CLI reads \`~/.config/changelog-tool/config.toml\` first, with a fallback to the legacy env-only mode.",
    category: "DX",
    breaking: false,
    body: `
## Config resolution

\`\`\`
1. $CHANGELOG_TOOL_CONFIG (file path)
2. ~/.config/changelog-tool/config.toml
3. ./changelog-tool.toml (repo-local)
4. Environment variables only (legacy)
\`\`\`

## Minimal TOML

\`\`\`toml
[api]
key = "sk_live_..."

[defaults]
project = "acme-prod"
\`\`\`

~~Legacy \`CHANGELOG_TOOL_API_KEY\`-only mode is deprecated.~~ It still works; prefer a config file when you can.
`,
  },
  {
    slug: "incident-status-page-embed",
    title: "Status page embed for incidents",
    publishedAt: "2025-11-19T13:45:00.000Z",
    summary:
      "Publish a read-only incident stream on your own site with a single script tag and optional theme tokens.",
    category: "Reliability",
    breaking: false,
    body: `
## Quick start

\`\`\`html
<script
  src="https://status.example.com/embed.js"
  data-project="proj_123"
  async
></script>
\`\`\`

### Theming

Pass CSS variables on a wrapper:

\`\`\`html
<div style="--changelog-font: system-ui; --changelog-accent: #4f46e5;">
  <div id="changelog-status-root"></div>
</div>
\`\`\`
`,
  },
]
