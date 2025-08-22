# ESLint Configuration for Next.js 15 (2025 Best Practices)

## Overview

This project uses the modern ESLint flat config format with TypeScript-ESLint v8+ for strict type checking while maintaining practical compatibility with Next.js and React patterns.

## Configuration Philosophy

### ✅ Strict Where It Matters
- **No `any` types** - Full type safety required
- **No floating promises** - All async operations must be handled
- **No unused variables** - Keep code clean
- **Type-aware linting** - Catch bugs at build time

### 🎯 Practical for React/Next.js
- Template literals can contain any type (common in className)
- Void returns allowed in event handlers
- Deprecated APIs are warnings, not errors
- React hooks exhaustive deps are warnings (sometimes intentionally omitted)

## Key Rules Explained

### TypeScript Strict Rules (Errors)
```typescript
// ❌ BAD - Will error
const data: any = fetchData();  // no-explicit-any
async function process() {
  fetchData();  // no-floating-promises - must await or handle
}

// ✅ GOOD
const data: UserData = fetchData();
async function process() {
  await fetchData();
}
```

### React Pattern Allowances
```typescript
// ✅ These common patterns are allowed:

// Template literals with any type (no restrict-template-expressions)
className={`btn ${isActive} ${count}`}

// Void returns in handlers (no confusing-void-expression)
onClick={() => setState(true)}

// Intentional dependency omissions (warning only)
useEffect(() => {
  // One-time setup
}, []); // Warning, not error
```

## Migration Guide

### From Old ESLint Config
If migrating from `.eslintrc`:
1. Remove `.eslintrc.*` files
2. Install new dependencies:
```bash
npm install --save-dev @eslint/js typescript-eslint @eslint/eslintrc
```

### Fixing Common Issues

#### ElementRef Deprecated
```typescript
// ❌ OLD
type Ref = React.ElementRef<typeof Component>

// ✅ NEW
type Ref = React.ComponentRef<typeof Component>
```

#### Template Expressions
```typescript
// If you re-enable restrict-template-expressions:
// ❌ BAD
className={`count-${count}`}  // count is number

// ✅ GOOD
className={`count-${String(count)}`}
```

#### Missing Dependencies
```typescript
// For intentional omissions, add a comment:
useEffect(() => {
  doSomething(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]); // Intentionally not including doSomething
```

## Running Lint

```bash
# Check for issues
npm run lint

# Auto-fix what's possible
npm run lint:fix

# Type check only
npm run type-check
```

## Customizing Rules

Edit `eslint.config.mjs` to adjust strictness:

### Make Stricter
```javascript
'@typescript-eslint/restrict-template-expressions': 'error',
'react-hooks/exhaustive-deps': 'error',
```

### Make More Lenient
```javascript
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/no-unused-vars': 'off',
```

## VS Code Integration

Add to `.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.experimental.useFlatConfig": true
}
```

## Philosophy

The goal is to catch real bugs while allowing idiomatic React/Next.js code. We're strict about:
- Type safety
- Async handling
- Code cleanliness

But flexible about:
- React patterns
- Template literals
- Deprecated API migrations

This balances code quality with developer productivity.