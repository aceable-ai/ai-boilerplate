# Development Setup

## Prerequisites

- Node.js 24.x (see `.nvmrc`) — install via `nvm install && nvm use`
- npm 10.x+

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env.local

# 3. Push schema to your database
npm run db:push

# 4. Start the development server
npm run dev
```

The application will be available at http://localhost:3003

## Database

This project uses **Neon Postgres** with **Drizzle ORM**.

### Database Commands
```bash
npm run db:push        # Push schema changes to database (development)
npm run db:generate    # Generate migration files (production)
npm run db:studio      # Open database admin interface
```

### Database Branching Workflow (Neon)
Each developer can work with their own Neon branch to avoid conflicts:

1. Install Neon CLI: `npm install -g neonctl && neonctl auth`
2. Create branch: `npm run db:branch:create your-name-dev`
3. Copy the new branch's `DATABASE_URL` into `.env.local`
4. Run `npm run db:push` to apply schema

> **`NEON_PROJECT_ID`** is required for branch commands. Find it in the Neon dashboard and add it to `.env.local`.

### Migration Workflow (Production)
1. `npm run db:generate` — generate versioned SQL files in `drizzle/`
2. Review the generated SQL
3. `npm run db:migrate` — apply to production (runs automatically on Railway deploy)

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL=postgresql://user:pass@host/db   # Neon connection string
OPENAI_API_KEY=sk-...                         # OpenAI API key
NEXT_PUBLIC_APP_URL=http://localhost:3003      # App URL
NEON_PROJECT_ID=your-neon-project-id          # For Neon CLI branch commands
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Clerk public key
CLERK_SECRET_KEY=sk_test_...                  # Clerk secret key
```

## Troubleshooting

### Database Connection Issues
1. Check `DATABASE_URL` in `.env.local`
2. Verify connection: `npm run db:studio`
3. Re-pull env vars from your deployment platform (Vercel/Railway)

### Schema Changes Not Reflecting
1. `npm run db:push`
2. Restart: `npm run dev`

## Development Workflow

1. **Feature Development** — work on personal Neon branch
2. **Schema Changes** — use `npm run db:push` during development
3. **Before PR** — generate migrations with `npm run db:generate`
4. **Code Review** — review both code AND generated SQL
5. **Production** — migrations applied on deploy via Railway/Vercel

## Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Auth**: Clerk
- **Database**: Neon Postgres + Drizzle ORM + Zod validation
- **AI**: Vercel AI SDK (OpenAI-compatible)
- **Deployment**: Railway (primary) or Vercel
- **Styling**: Tailwind CSS v4 + Radix UI
