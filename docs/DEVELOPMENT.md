# Development Setup

## Environment Variables

See [`.env.example`](../.env.example) for the full annotated list. The file is
the canonical source — this doc mirrors the highlights.

Required in `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # build-time + dev startup
CLERK_SECRET_KEY=sk_test_...                   # runtime — server-only
```

Optional:
```bash
DATABASE_URL=postgresql://user:pass@host/db    # runtime — Neon connection string
NEON_PROJECT_ID=your-neon-project-id           # only for `npm run db:branch:*`
OPENAI_API_KEY=sk-...                          # runtime — AI SDK
```

`NEXT_PUBLIC_APP_URL` is defined by the template but not read by any shipped
code. It's a reserved slot for your app's own use (email templates, metadata
base URLs, webhook targets); set it when you add code that needs it.

### Build-time vs runtime

`NEXT_PUBLIC_*` variables are **inlined into the client bundle during
`next build`**. They must be present in the environment that runs the
build — not just the runtime environment — or the build fails. This
catches most developers out at least once:

- **Platform builds (Railway Nixpacks, Vercel):** service env vars are
  forwarded to the build automatically.
- **Docker builds:** the build container inherits only what you declare.
  You must add `ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (and any other
  `NEXT_PUBLIC_*` vars) in your Dockerfile's builder stage so your
  platform can pipe the value through via `--build-arg`.
- **CI:** see `.github/workflows/build.yml` for a placeholder-key pattern
  that lets `next build` pass on PRs without real secrets.

If `next build` fails with `@clerk/clerk-react: Missing publishableKey`,
this is the cause 95% of the time. The fix is scoping the env var to the
build stage — not disabling auth.

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

New to Railway? → https://docs.railway.com/quick-start

**First-time setup** (two equivalent paths — pick whichever fits your flow):

*Dashboard:*
1. Create a Railway project and connect your GitHub repo
2. Add these env vars under Settings → Variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   # required, build-time
   CLERK_SECRET_KEY                    # required, runtime
   DATABASE_URL                        # optional — Neon production connection string
   NEON_PROJECT_ID                     # optional — from Neon dashboard
   OPENAI_API_KEY                      # optional — if using AI features
   ```

*CLI* (the README's onboarding prompt uses this path):
```bash
railway link
railway variables --set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... --set CLERK_SECRET_KEY=sk_live_...
```

Either way, push to `main` — Railway auto-deploys and runs `db:migrate` before starting.

### Clerk domains (production instance only)

If you've upgraded Clerk to a production instance (`pk_live_...` / `sk_live_...`),
you also need to add your Railway public domain in the Clerk dashboard under
**Domains**. Without it, Clerk rejects prod sign-ins as an unauthorized origin
and every attempt fails silently.

The Clerk **development** instance accepts any domain, so this only matters
once you switch to live keys. Dev keys (`pk_test_...` / `sk_test_...`) work fine
on Railway with no domain config.

`railway.json` notes:
- `--production=false` on install ensures devDeps (TypeScript, ESLint) are available for the build step
- `db:migrate` runs at startup so schema is always in sync before traffic hits
- Railway injects `$PORT` automatically — no hardcoding needed

## Troubleshooting

**DB connection errors** — check `DATABASE_URL` in `.env.local`, then `npm run db:studio` to verify connectivity.

**Schema changes not reflecting** — run `npm run db:push`, then restart `npm run dev`.

**Auth not working** — verify both Clerk env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) are set and match the environment (test keys for dev, live keys for prod). If `next build` fails with `Missing publishableKey`, see the build-time vs runtime section above.
