# Technology Stack

## Core Requirements
- **Node.js**: 22.x LTS (`node --version >= 22.11.0`)
- **Framework**: Next.js 15.x (App Router only)
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Deployment**: Railway

## Project Initialization
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

## Directory Structure
```
src/
├── app/                   # Next.js App Router
├── components/            # UI components
│   ├── ui/               # Base components
│   └── features/         # Feature components
├── lib/                   # Utilities, config, types
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```