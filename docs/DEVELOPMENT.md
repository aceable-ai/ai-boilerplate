# Development Setup

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL=postgresql://user:pass@host/db   # Neon connection string
NEON_PROJECT_ID=your-neon-project-id          # For Neon CLI branch commands
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

## Neon Database Branching

Each developer works on their own Neon branch to avoid schema conflicts:

```bash
# One-time: install Neon CLI and authenticate
npm install -g neonctl && neonctl auth

# Create your personal dev branch
npm run db:branch:create your-name-dev

# Copy the new branch's DATABASE_URL into .env.local, then:
npm run db:push
```

`NEON_PROJECT_ID` is required for branch commands — find it in the Neon dashboard.

## Migration Workflow

**Development:** `npm run db:push` — applies schema changes directly, no migration files.

**Production:**
1. `npm run db:generate` — generates versioned SQL in `drizzle/`
2. Review the SQL before proceeding
3. `npm run db:migrate` — applies to production (also runs automatically on Railway deploy)

## Troubleshooting

**DB connection errors** — check `DATABASE_URL` in `.env.local`, then `npm run db:studio` to verify connectivity.

**Schema changes not reflecting** — run `npm run db:push`, then restart `npm run dev`.

**Auth not working** — verify all four Clerk env vars are set and match the environment (test keys for dev, live keys for prod).
