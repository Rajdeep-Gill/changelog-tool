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

## Product and technical choices

**Why this shape:** Maintainers care about two things: seeing what landed in git over a window, and turning that into **end-user-facing** notes. The create flow fetches commits server-side via the GitHub API, lets you **curate** SHAs (noise control vs. dumping every commit), then calls an LLM with structured output (title, summary, markdown body, tags, etc.) so the result is predictable and easy to edit before publish.

**Stack:** **Next.js** (App Router) keeps API routes and UI in one deployable app. **Neon + Drizzle** fit a small changelog table without running Postgres yourself. **Vercel AI SDK** + **`@ai-sdk/google`** give `generateObject` with a Zod schema so the model returns typed fields instead of raw markdown parsing. **TanStack Query** handles client fetching; **shadcn/ui** + Tailwind keep the UI minimal and consistent with a docs-style changelog.

## AI tools used to build this

Disclosure per assignment: **Google Gemini** (via AI SDK) powers draft generation. **Cursor** (and similar editor assistance) was used for implementation support. Mention the same in any hiring email if they ask what tools you used.

## Security note

Create, draft, and edit APIs are **not authenticated** in this repo—fine for local demos. Add auth before exposing publicly.

## Submission checklist (Greptile-style brief)

When you submit:

1. Push the project to **GitHub** and send the **repository link**.
2. Record a **~30 second** screen capture showing: open app → fetch commits → generate draft → publish → view on public changelog (or your happiest path).
3. Email **daksh@greptile.com** with the link and recording.

**Likely follow-up date:** *[Add the date you plan to send this so reviewers know when to check in.]*
