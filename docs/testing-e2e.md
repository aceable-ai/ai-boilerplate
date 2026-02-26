# E2E Testing

## Auth Bypass

Clerk auth is bypassed in Playwright tests via `PLAYWRIGHT_TESTING=true`, set automatically in `tests/global-setup.ts`. The middleware checks for this in development only — production ignores it.

```typescript
// src/middleware.ts
if (process.env.NODE_ENV === 'development' && process.env['PLAYWRIGHT_TESTING'] === 'true') {
  return; // skip auth
}
```

If tests are failing with auth redirects, verify `global-setup.ts` is setting the variable and `NODE_ENV=development`.

## data-testid

All element selection uses `data-testid` exclusively — no CSS selectors, no `getByText`.

```typescript
// ✅
await page.getByTestId('submit-button').click();

// ❌
await page.locator('button.bg-blue-500').click();
await page.getByText('Submit').click();
```

Add `data-testid` when building the component, not as a follow-up.
