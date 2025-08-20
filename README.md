# Aceable Vibing Boilerplate

## Initial Install

1. Follow [Github CLI](https://github.com/cli/cli#installation) installation
2. Create a new folder for your project in your personal drive
3. Open VSCode or Cursor in your new folder
4. Open the IDE terminal and run

```shell
    gh repo fork https://github.com/aceable/ai-boilerplate.git --clone
    mv ai-boilerplate/* ai-boilerplate/.* .
    rmdir ai-boilerplate
```

5. Run Claude, Cursor, or Copilot as usual

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Prerequisites

1. **Node.js**: This project requires Node.js 20.x+ LTS
2. **Vercel CLI**: For deployment and environment management
3. **Neon Postgres**: Database hosted on Neon

### Initial Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Install Vercel CLI globally:**
```bash
npm i -g vercel
```

3. **Login to Vercel:**
```bash
vercel login
```

4. **Link to the Vercel project:**
```bash
vercel link
```

5. **Pull environment variables from Vercel:**
```bash
vercel env pull .env.development.local
```

This will create a `.env.development.local` file with your Neon Postgres connection string and other environment variables.

### Running the Application

With Neon Postgres, no local database setup is required. Simply run:

```bash
npm run dev
```

The application will connect to your Neon database automatically using the DATABASE_URL from your environment file.

Open [http://localhost:3003](http://localhost:3003) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Database Management

This project uses **Drizzle ORM** with **Neon Postgres**. Database schema is managed through code-first migrations.

### Database Schema Workflow

```bash
# After making changes to schema files in src/db/schema/
npm run db:generate    # Generate migration files
npm run db:push        # Push schema changes directly to database (development)
npm run db:studio      # Open database admin interface
```

**Development vs Production:**
- **Development**: Use `npm run db:push` to push schema changes directly to your personal DB branch
- **Production**: Use `npm run db:generate` then `npm run db:migrate` for proper versioned migrations

### Database Branching Workflow

Each developer should work with their own database branch to avoid conflicts:

```bash
# Install Neon CLI (one-time setup)
npm install -g neonctl

# Create personal database branch
neonctl auth  # Login with Aceable credentials
npm run db:branch:create your-name-dev

# Update .env.development.local with your branch's DATABASE_URL
# Make schema changes, then push to your branch
npm run db:push
```

**Team Workflow:**
1. **Feature Development**: Work on personal DB branch with `db:push`
2. **Before PR**: Generate migrations with `db:generate` 
3. **Code Review**: Review both schema changes AND generated SQL
4. **Staging**: Test migrations on staging DB branch
5. **Production**: Apply migrations with `db:migrate`

### Schema Files
Database schemas are located in `src/db/schema/`:
- `projects.ts` - Project management tables
- `users.ts` - User accounts and profiles
- `projects.ts` - Project management tables
- `sessions.ts` - Session and authentication data
- `content.ts` - Content inventory and gaps

All schemas include Zod validation for type safety.

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: Neon Postgres connection string
- `OPENAI_API_KEY`: OpenAI API key for content generation
- `NEXT_PUBLIC_APP_URL`: Application URL (http://localhost:3003 for development)

These are automatically pulled from Vercel when you run `vercel env pull .env.development.local`.

## Deploy on Vercel

This project is configured for deployment on Vercel:

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

The application is automatically deployed on every push to the main branch.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.