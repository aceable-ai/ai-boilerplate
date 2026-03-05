# AI Boilerplate

## Start here — paste this into your AI assistant

> Copy the prompt below into **Claude, ChatGPT, Codex, Cursor**, or any AI coding assistant. It will walk you through everything step by step.

```
You are guiding me through setting up my first project from the Aceable AI Boilerplate.
I may be completely new to coding.

FIRST, ask me:
1. Are you on a Mac or Windows? (If Windows, help me figure out if I have WSL installed
   and recommend it if not — it makes everything easier.)
2. How comfortable are you with the command line? (beginner / intermediate / advanced)

Then walk me through this process ONE STEP AT A TIME, waiting for me to confirm each
step works before moving on. Adjust your explanations to my comfort level — beginners
need terms like "Terminal", "repo", and "environment variable" explained in plain English.

THE GOAL — get all of this done in order:
1. Open a terminal (help me find the right app for my OS)
2. Make sure prerequisites are installed: git, Homebrew (Mac/WSL), nvm, Node.js v20+,
   and GitHub CLI. Check each one and help me install anything missing.
3. Pick a repo name using format: {team}-{initials}-{project}
   Teams: eng (Engineering), mkt (Marketing), prd (Product), fin (Finance)
   Examples: eng-kn-invoice-tool, mkt-jd-landing-pages, prd-al-roadmap-viz
4. Create the repo:
   gh repo create aceable-ai/{name} --template aceable-ai/ai-boilerplate --clone --private
   (If permission error, tell me to ask in #engineering on Slack)
5. npm install
6. cp .env.example .env.local
7. Ask me: "Do you need any of these right now, or do you just want to get the app running first?"
   - Database (Neon Postgres) — needed if storing data
   - AI features (OpenAI) — needed if using AI/chat features
   Clerk auth works automatically in dev mode — no setup needed to start.
   If I say "just get it running", skip to step 8. The app works without a database
   or OpenAI key — those can be added later when I need them.
   If I want them now, walk me through each one at a time (sign up, where to click,
   what to copy into .env.local).
8. If I set up a database in step 7: npm run db:push
   If I skipped it, skip this too.
9. npm run dev — confirm I can open http://localhost:3003

If anything fails, help me debug patiently. Start now.
```

---

## What you'll get

A production-ready Next.js app with auth, database, AI, and one-command Railway deployment — all wired up so you can skip setup and start building.

---

## Prerequisites

These must be installed and working before setup. The prompt above will guide you through checking each one.

| Tool | Check | Install |
|------|-------|---------|
| **git** | `git --version` | macOS: `xcode-select --install` |
| **Homebrew** | `brew --version` | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| **nvm** | `nvm --version` | `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh \| bash` |
| **Node.js** | `node --version` | `nvm install 20` |
| **GitHub CLI** | `gh auth status` | `brew install gh` then `gh auth login` |
| **Railway CLI** | `railway --version` | `npm install -g @railway/cli` |

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
