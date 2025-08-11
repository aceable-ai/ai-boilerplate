# Development Standards

## Code Quality Principles
- **DRY**: Extract common logic into custom hooks and utilities
- **Single Responsibility**: Components do one thing well
- **Type Safety**: Strict TypeScript, no `any` types
- **Error Handling**: Graceful failures with user feedback
- **Performance**: React.memo, proper loading states
- **Accessibility**: ARIA labels, semantic HTML
- **Testing**: Unit tests for business logic, data-testid attributes

## Component Architecture
```typescript
// ✅ Good: Small, focused components
export function UserCard({ user }: { user: User }) {
  return (
    <div className="p-4 border rounded-lg" data-testid="user-card">
      <UserAvatar user={user} />
      <UserDetails user={user} />
    </div>
  );
}

// ❌ Bad: Monolithic components
export function UserDashboard() {
  // 200+ lines mixing concerns
}
```

## Git Standards
```bash
# Conventional commits
git commit -m "feat(auth): add JWT validation"
git commit -m "fix(api): handle user not found"
git commit -m "refactor: extract UserCard component"

# Branch naming
feature/user-authentication
bugfix/login-redirect-issue
hotfix/security-patch
```

## Quality Gates
```json
{
  "scripts": {
    "lint": "next lint",
    "type-check": "tsc --noEmit", 
    "test": "jest",
    "pre-commit": "npm run lint && npm run type-check"
  }
}
```