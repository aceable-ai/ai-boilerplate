# Development Setup

## Prerequisites

### 1. Node.js and npm
- Node.js 20.x+ LTS
- npm 10.x+

### 2. Vercel CLI
```bash
npm install -g vercel
```

### 3. Neon CLI (optional, for database branching)
```bash
npm install -g neonctl
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup Vercel and pull environment variables
npm run setup

# 3. Start the development server
npm run dev
```

The application will be available at http://localhost:3003

## Database

This project uses **Neon Postgres** with **Drizzle ORM**.

### Database Commands
```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files (production)
npm run db:generate

# Open database admin interface
npm run db:studio

# Create personal database branch
npm run db:branch:create your-name-dev
```

### Database Branching Workflow
Each developer should work with their own database branch:

1. **Create branch**: `npm run db:branch:create kevin-dev`
2. **Update .env.development.local** with your branch URL
3. **Push schema**: `npm run db:push`
4. **Develop**: Make changes and test
5. **Generate migrations**: `npm run db:generate` before PR

## Environment Variables

Required variables in `.env.development.local`:
```bash
DATABASE_URL=postgresql://user:pass@host/db  # Neon connection string
OPENAI_API_KEY=sk-...                        # OpenAI API key
NEXT_PUBLIC_APP_URL=http://localhost:3003    # App URL
NEON_PROJECT_ID=your-neon-project-id        # For CLI operations (find in Neon dashboard)
```

## Troubleshooting

### "Module not found: mongoose" Error
This means the Mongoose migration is incomplete. All models should use Drizzle now.

### Database Connection Issues
1. Check your `DATABASE_URL` in `.env.development.local`
2. Verify you can connect: `npm run db:studio`
3. Try pulling fresh env vars: `vercel env pull .env.development.local`

### Schema Changes Not Reflecting
1. Push schema changes: `npm run db:push`
2. Restart development server: `npm run dev`

## Development Workflow

1. **Feature Development**: Work on personal DB branch
2. **Schema Changes**: Use `npm run db:push` for development
3. **Before PR**: Generate migrations with `npm run db:generate`
4. **Code Review**: Review both code AND migration SQL files
5. **Production**: Migrations applied automatically on deploy

## Stack Overview

- **Frontend**: Next.js 15 (App Router)
- **Database**: Neon Postgres
- **ORM**: Drizzle with Zod validation
- **AI**: Vercel AI SDK with OpenAI
- **Deployment**: Vercel
- **Styling**: Tailwind CSS