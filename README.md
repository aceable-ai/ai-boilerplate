# AI Boilerplate

A production-ready Next.js starter for vibe coding with Claude, Codex, or Cursor. Includes auth, database, AI, and one-command Railway deployment — all wired up so you can skip setup and build.

---

## Prerequisites

Before you start, make sure these are installed:

| Tool | Check | Install |
|------|-------|---------|
| **nvm** | `nvm --version` | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh \| bash` |
| **Node.js** | `node --version` | `nvm install && nvm use` |
| **git** | `git --version` | macOS: `xcode-select --install` |
| **GitHub CLI** | `gh auth status` | `npm run setup:gh` (after step 2 below) |
| **Railway CLI** | `railway --version` | `npm install -g @railway/cli` |

---

## Setup

**1. Create your project from this template**

```bash
gh repo create my-app-name --template aceable/ai-boilerplate --clone --public
cd my-app-name
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in each value. You'll need accounts for:
- [Neon](https://neon.tech) — free Postgres database
- [Clerk](https://clerk.com) — free auth
- [OpenAI](https://platform.openai.com) — API key for AI features

**4. Push the database schema**

```bash
npm run db:push
```

**5. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003). You're running.

---

## Deploy to Railway

```bash
# Login and link to a new Railway project
railway login
railway init

# Set your env vars in the Railway dashboard, then deploy
railway up
```

Railway auto-deploys on every push to `main` once linked. Migrations run automatically on deploy.

---

## Database Commands

```bash
npm run db:push      # sync schema changes to dev DB
npm run db:studio    # open visual DB browser
npm run db:generate  # generate versioned migration files
npm run db:migrate   # apply migrations to production
```

---

## Learn More

See [AGENTS.md](AGENTS.md) for the full stack, coding standards, AI workflow, and project structure — your AI assistant reads it automatically.
