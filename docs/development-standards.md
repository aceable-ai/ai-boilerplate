# Development Standards

Project-specific conventions only. React/Next.js/TypeScript patterns are covered by the installed skills.

## Single Source of Truth
App name/description live in `src/lib/config.ts` — consumed by `layout.tsx` and `header.tsx`. Never hardcode the app name elsewhere.

## API Routes
Use `withErrorHandling` from `src/lib/ai-response.ts`. Do not write manual try/catch in every route:

```typescript
import { apiSuccess, withErrorHandling } from '@/lib/ai-response';

async function handlePOST(request: NextRequest) {
  const data = mySchema.parse(await request.json()); // ZodError auto-caught
  return apiSuccess(await doSomething(data));
}

export const POST = withErrorHandling(handlePOST);
```
