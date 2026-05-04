# Changelog tool

AI-assisted changelog writer and a minimal public changelog site. Pick a GitHub repo and date range, select commits, generate a structured draft with Gemini, edit, and publish. Visitors browse entries at `/changelog`.

## Quick start

Prerequisites: **Node.js** (current LTS is fine), **pnpm** (see `packageManager` in [`package.json`](package.json)), and accounts for **Neon** (or any Postgres URL Drizzle can use), **GitHub** (personal access token), and **Google AI Studio** (Gemini API key).

```bash
pnpm install
```

Create `.env.local` in the project root (Next.js loads it in dev). See [Environment variables](#environment-variables).

Apply the database schema (Postgres must exist and `DATABASE_URL` must point at it):

```bash
pnpm db:push
```

Optional sample data for the public timeline:

```bash
pnpm db:seed
```

Run the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Create** to build entries from GitHub + AI, **Changelog** for the public list, **Edit** to revise published entries.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`, `pnpm db:studio`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (for publish/list) | Postgres connection string (e.g. Neon). |
| `GITHUB_TOKEN` | Yes (for commits) | GitHub PAT with `repo` (or public `read` scope) for the repos you query. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes (for AI draft) | From [Google AI Studio](https://aistudio.google.com/). Aliases: `GEMINI_API_KEY`, `GOOGLE_AI_API_KEY`. |
| `GEMINI_MODEL` | No | Model id (default `gemini-2.5-flash`). |
| `GITHUB_DEFAULT_REPO` | No | Optional default repo URL string prefilled on the create page. |

## Repository structure (quick map)

```text
app/
  api/[[...route]]/     # Hono API entry + grouped route modules (changelog, edit, github, gemini)
  changelog/            # Public changelog list + entry pages
  create/               # Create flow UI (repo source, commit picker, draft + publish)
  edit/                 # Edit flow UI (load entry, update/delete)
components/
  changelog/            # Reusable changelog UI building blocks
  ui/                   # shadcn/ui primitives
features/
  changelog/api/        # TanStack Query hooks for changelog endpoints
  github/api/           # TanStack Query hooks for GitHub commit endpoints
  shared/               # Shared API error helpers
db/
  drizzle.ts            # Drizzle client setup
  schema.ts             # Drizzle table/schema definitions
lib/
  changelog/            # Form schemas, payload builders, normalization/date helpers
  server/               # Server-side integrations (repo, github, gemini draft logic)
  hono.ts               # Typed Hono RPC client for frontend hooks
```

## Backend libraries and how things work

### Core backend stack

- **Hono** (`hono`, `hono/vercel`): API routing under `app/api/[[...route]]`, mounted at `/api`.
- **Drizzle ORM** (`drizzle-orm`): typed DB queries and repository methods.
- **Postgres (Neon)**: persistence for published changelog entries.
- **Vercel AI SDK** (`ai`) + **Google provider** (`@ai-sdk/google`): structured Gemini draft generation.
- **Zod**: request and generation schema validation.

### Runtime flow (end-to-end)

1. **Create page** gathers repo URL + branch + date window, then calls `/api/github/...` to fetch commits.
2. Selected commit SHAs + optional context are sent to `/api/changelog/draft`.
3. The server formats commit data and calls Gemini via AI SDK for structured draft output.
4. Draft is applied to the compose form (title/summary/body/tags/date), user edits as needed.
5. Publish sends form data to `/api/changelog`; backend validates and inserts with Drizzle.
6. Public pages query changelog entries and render timeline/detail views.
7. Edit page loads an entry by slug, then uses `/api/edit/:slug` to update or delete.

### Frontend data layer

- **TanStack Query** handles client-side fetching/mutations and cache invalidation.
- Frontend API calls use a **typed Hono client** (`lib/hono.ts`) so request/response types match server routes for full end-to-end type safety.

## Product and technical choices

**Why this shape:** Maintainers care about two things: seeing what landed in git over a window, and turning that into **end-user-facing** notes. The create flow fetches commits server-side via the GitHub API, lets you **curate** SHAs (noise control vs. dumping every commit), then calls an LLM with structured output (title, summary, markdown body, tags, etc.) so the result is predictable and easy to edit before publish.

**Stack:** **Next.js** (App Router) keeps API routes and UI in one deployable app. **Neon + Drizzle** fit a small changelog table without running Postgres yourself. **Vercel AI SDK** + **`@ai-sdk/google`** give `generateObject` with a Zod schema so the model returns typed fields instead of raw markdown parsing. **TanStack Query** handles client fetching; **shadcn/ui** + Tailwind keep the UI minimal and consistent with a docs-style changelog.

