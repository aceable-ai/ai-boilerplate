# AGENTS.md – Engineering & AI Standards

> Canonical config for Claude Code, OpenAI Codex, Cursor, and other AI assistants.
> Both Claude Code and OpenAI Codex read this file natively. Version: 2026.1

---

## First-Time Setup

Guide the user through these tools in order before anything else:

| Tool | Check | Install |
|------|-------|---------|
| **nvm** | `nvm --version` | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh \| bash` |
| **Node.js** | `node --version` (must match `.nvmrc`) | `nvm install && nvm use` |
| **git** | `git --version` | macOS: `xcode-select --install` · Linux: `sudo apt install git` |
| **GitHub CLI** | `gh auth status` | `npm run setup:gh` |

Then: `npm install` → `cp .env.example .env.local` → fill credentials → `npm run db:push` → `npm run dev`

---

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 · Drizzle ORM · Neon Postgres · Clerk Auth · Vercel AI SDK · Railway or Vercel deployment

---

## Commands

**Dev:**
```bash
npm run dev          # port 3003, Turbopack
npm run build
npm run lint:all     # ESLint + tsc together
```

**Database:**
```bash
npm run db:push      # sync schema to dev DB
npm run db:studio    # visual DB browser
npm run db:generate  # generate migration files
npm run db:migrate   # apply to production
```

**Setup / validation:**
```bash
npm run check        # validate prerequisites
npm run setup        # full first-time setup
npm run setup:gh     # GitHub CLI only
npm run scratch:clean
```

---

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
├── components/
│   ├── ui/           # Base components (Button, Input, Dialog…)
│   └── features/     # Feature components
├── lib/              # Utilities, config, AI helpers
│   └── config.ts     # APP_NAME and app-level constants (single source of truth)
├── hooks/            # Custom React hooks
├── middleware.ts      # Clerk auth — protects all routes
└── types/
.scratch/             # Ephemeral experiments — gitignored, never committed
```

---

## Workflow — How We Work

These are non-negotiable behaviors. Follow them in every session.

### Branch & Draft PR First
- Every piece of work starts with a branch from latest `main` and an immediate draft PR.
- `git checkout -b feature/name` → stub commit → `gh pr create --draft`
- Never push directly to `main`. When done: `gh pr ready`.

### Atomic Commits
- One logical change per commit. If it needs two sentences to describe, split it.
- Commit every time the build passes and the change is coherent — before pivoting.
- Format: `type(scope): short description` (`feat`, `fix`, `chore`, `refactor`, `test`, `docs`)
- Keep PRs small and focused — one feature or fix per PR.

### Test With Every Change
- Write or update tests **in the same commit** as the code change. Tests are not optional follow-ups.
- Run `npm run test` before moving on. Red tests block the next step — fix before continuing.
- Add `data-testid` to every interactive component. See [E2E Testing](docs/testing-e2e.md).

### Agent Teams
- Decompose tasks into independent sub-problems and run sub-agents in parallel — don't serialize what can be parallelized.
- Examples: research + scaffold simultaneously, write tests + write implementation simultaneously.
- See [AI Workflow](docs/ai-workflow.md) for patterns.

### Scratch Files
- All exploratory code, spikes, and debug scripts → `.scratch/<namespace>/<file>.ts`
- Never create scratch files in `src/`. Never commit scratch files.
- `npm run scratch:clean` wipes all scratch files.

### Retro — Improve as You Go
- After completing any feature or session: ask "what was confusing? what slowed things down?"
- If something was hard to find → update the relevant doc.
- If a pattern kept recurring → add it to `docs/development-standards.md`.
- Keep this file under 200 lines. If AGENTS.md grows, move detail to a doc and link it.

### 80/20 Documentation
- Before adding anything here: "Does every AI session need this, or just occasionally?"
- Occasional reference → goes in `docs/`, linked from here.
- One-off context → inline `// Why:` comment in code.

---

## Docs

| Doc | What's in it |
|-----|-------------|
| [AI Workflow](docs/ai-workflow.md) | Commit discipline, testing, agent teams, retro detail |
| [Development Standards](docs/development-standards.md) | Project-specific patterns: withErrorHandling, config.ts |
| [E2E Testing](docs/testing-e2e.md) | Auth bypass setup, data-testid conventions |
| [Development Setup](docs/DEVELOPMENT.md) | DB workflow, env vars, Neon branching |

---

## Skills & Extensions

```bash
npx skills add aceable/acewares   # tickets, review, retro, Playwright, wiki
# Browse more: https://skills.sh/
```

Skills install into `.agents/skills/` and are symlinked to `.claude/skills/` via `npm install`.
