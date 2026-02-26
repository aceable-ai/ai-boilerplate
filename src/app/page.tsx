import { BookOpen, Database, Layers, Rocket, Settings, Zap } from 'lucide-react';
import Link from 'next/link';

const Page = () => {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold flex gap-2 items-center mb-2">
          <Zap className="text-primary" /> AI Boilerplate
        </h1>
        <p className="text-muted-foreground">
          A Next.js 15 starter with Clerk auth, Tailwind, Neon Postgres, Drizzle ORM, and the Vercel AI SDK — ready for your first feature.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex gap-2 items-center mb-3">
          <Rocket className="h-5 w-5" /> Getting Started
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Set your project name in{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">src/app/layout.tsx</code> and{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">src/components/header.tsx</code>
          </li>
          <li>
            Copy{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.example</code> to{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.local</code> and fill in your credentials
          </li>
          <li>
            Run{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">npm run db:push</code> to apply the initial schema
          </li>
          <li>Delete or replace this page and start building your features</li>
        </ol>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex gap-2 items-center mb-3">
          <Layers className="h-5 w-5" /> Tech Stack
        </h2>
        <ul className="space-y-1.5 text-sm">
          <li>
            <a href="https://nextjs.org/docs" className="text-primary font-medium">Next.js 15</a>
            {' '}&mdash; App Router, Server Components, Turbopack
          </li>
          <li>
            <a href="https://clerk.com/docs" className="text-primary font-medium">Clerk</a>
            {' '}&mdash; Authentication and user management
          </li>
          <li>
            <a href="https://neon.tech/docs" className="text-primary font-medium">Neon Postgres</a>
            {' '}+{' '}
            <a href="https://orm.drizzle.team/docs/overview" className="text-primary font-medium">Drizzle ORM</a>
            {' '}&mdash; Serverless database with type-safe queries
          </li>
          <li>
            <a href="https://sdk.vercel.ai/docs" className="text-primary font-medium">Vercel AI SDK</a>
            {' '}&mdash; Streaming, structured outputs, multi-provider
          </li>
          <li>
            <a href="https://tailwindcss.com/docs" className="text-primary font-medium">Tailwind CSS</a>
            {' '}+{' '}
            <a href="https://www.radix-ui.com/themes/docs" className="text-primary font-medium">Radix UI</a>
            {' '}&mdash; Styling and accessible components
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex gap-2 items-center mb-3">
          <Database className="h-5 w-5" /> Database Commands
        </h2>
        <ul className="space-y-1.5 text-sm font-mono">
          <li><code className="bg-muted px-1.5 py-0.5 rounded">npm run db:push</code> — push schema changes to your database</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">npm run db:studio</code> — open the Drizzle Studio UI</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">npm run db:generate</code> — generate migration files for production</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex gap-2 items-center mb-3">
          <Settings className="h-5 w-5" /> Claude Code Slash Commands
        </h2>
        <ul className="space-y-1.5 text-sm font-mono">
          <li><code className="bg-muted px-1.5 py-0.5 rounded">/dev</code> — start the development server</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">/lint</code> — run ESLint and TypeScript checks</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">/build</code> — production build</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">/db-push</code> — push schema changes</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex gap-2 items-center mb-3">
          <BookOpen className="h-5 w-5" /> Docs
        </h2>
        <ul className="space-y-1.5 text-sm">
          <li><Link href="/api/README.md" className="text-primary">API Routes</Link> — <code className="bg-muted px-1 py-0.5 rounded text-xs">src/app/api/README.md</code></li>
          <li>Engineering standards — <code className="bg-muted px-1 py-0.5 rounded text-xs">AGENT.md</code></li>
          <li>Development setup — <code className="bg-muted px-1 py-0.5 rounded text-xs">docs/DEVELOPMENT.md</code></li>
        </ul>
      </div>
    </div>
  );
};

export default Page;
