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

## Railway Deployment

`railway.json` is committed and handles everything — no manual config needed.

**First-time setup:**
1. Create a Railway project and connect your GitHub repo
2. Add these env vars in the Railway dashboard (Settings → Variables):
   ```
   DATABASE_URL          # from Neon dashboard (production branch connection string)
   NEON_PROJECT_ID       # from Neon dashboard
   NEXT_PUBLIC_APP_URL   # your Railway public domain, e.g. https://myapp.up.railway.app
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   OPENAI_API_KEY
   ```
3. Push to `main` — Railway auto-deploys and runs `db:migrate` before starting

`railway.json` notes:
- `--production=false` on install ensures devDeps (TypeScript, ESLint) are available for the build step
- `db:migrate` runs at startup so schema is always in sync before traffic hits
- Railway injects `$PORT` automatically — no hardcoding needed

## Troubleshooting

**DB connection errors** — check `DATABASE_URL` in `.env.local`, then `npm run db:studio` to verify connectivity.

**Schema changes not reflecting** — run `npm run db:push`, then restart `npm run dev`.

**Auth not working** — verify all four Clerk env vars are set and match the environment (test keys for dev, live keys for prod).
