# End-to-End Testing with Playwright

> **Testing Framework**: Playwright | **Authentication**: Bypassed in test environment | **Target Elements**: `data-testid` attributes

## Quick Start

```bash
# Install dependencies (if not already installed)
npm install

# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug
```

## Authentication Bypass

### How It Works
- **Environment Variable**: `PLAYWRIGHT_TESTING=true` is automatically set during test execution
- **Middleware Check**: Authentication is bypassed only in development environment when this variable is set
- **Security**: Production environments ignore this variable entirely

### Implementation Details
```typescript
// src/middleware.ts
if (process.env.NODE_ENV === 'development' && process.env.PLAYWRIGHT_TESTING === 'true') {
  console.log(`[MIDDLEWARE] Bypassing auth for Playwright testing: ${request.nextUrl.pathname}`);
  return; // Skip authentication
}
```

## Test Structure

### Directory Layout
```
tests/
├── global-setup.ts      # Environment setup
├── auth/               # Authentication-related tests
├── projects/           # Project management tests
├── jobs/               # Background job/task tests
└── api/               # API endpoint tests
```

### Essential Test Patterns

#### 1. Component Testing with data-testid
```typescript
import { test, expect } from '@playwright/test';

test('should load project dashboard', async ({ page }) => {
  await page.goto('/projects/test-project-id');
  
  // Use data-testid attributes for reliable element selection
  await expect(page.getByTestId('project-header')).toBeVisible();
  await expect(page.getByTestId('task-runs-section')).toBeVisible();
});
```

#### 2. Form Interactions
```typescript
test('should create new background job', async ({ page }) => {
  await page.goto('/projects/test-project-id/setup');
  
  // Fill form using data-testid
  await page.getByTestId('job-type-input').fill('Data Import');
  await page.getByTestId('start-job-button').click();
  
  // Verify result
  await expect(page.getByTestId('success-message')).toBeVisible();
});
```

#### 3. API Endpoint Testing
```typescript
test('should fetch job history', async ({ request }) => {
  const response = await request.get('/api/projects/test-id/job-history');
  
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.jobs).toBeDefined();
  expect(Array.isArray(data.jobs)).toBeTruthy();
});
```

#### 4. Loading States and Error Handling
```typescript
test('should handle loading states', async ({ page }) => {
  await page.goto('/projects/test-project-id/runs');
  
  // Verify loading skeleton appears first
  await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  
  // Then verify content loads
  await expect(page.getByTestId('job-progress')).toBeVisible();
  await expect(page.getByTestId('loading-skeleton')).not.toBeVisible();
});
```

## Best Practices

### 1. Use data-testid for Element Selection
```typescript
// ✅ GOOD: Reliable and semantic
await page.getByTestId('submit-button').click();

// ❌ AVOID: Fragile and implementation-dependent  
await page.locator('button.bg-blue-500.px-4').click();
```

### 2. Test User Flows, Not Implementation
```typescript
// ✅ GOOD: Tests user behavior
test('user can complete job setup workflow', async ({ page }) => {
  await page.goto('/projects/new');
  await page.getByTestId('project-name-input').fill('Test Project');
  await page.getByTestId('create-project-button').click();
  await expect(page.getByTestId('setup-wizard')).toBeVisible();
});

// ❌ AVOID: Tests internal implementation
test('should call createProject API', async ({ page }) => {
  // Testing API calls directly instead of user experience
});
```

### 3. Handle Async Operations
```typescript
test('should wait for job completion', async ({ page }) => {
  await page.goto('/projects/test-id/runs');
  
  // Start job
  await page.getByTestId('start-job-button').click();
  
  // Wait for completion (with timeout)
  await expect(page.getByTestId('job-completed-status'))
    .toBeVisible({ timeout: 30000 });
});
```

### 4. Clean Test Data
```typescript
test.beforeEach(async ({ page }) => {
  // Clean slate for each test
  await page.goto('/api/test/cleanup');
});

test.afterEach(async ({ page }) => {
  // Cleanup after test
  await page.goto('/api/test/cleanup');
});
```

## Configuration

### playwright.config.ts Key Settings
```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
  },
  
  // Authentication bypass setup
  globalSetup: require.resolve('./tests/global-setup.ts'),
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Debugging Tests

### Visual Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Step through tests interactively
npm run test:e2e:debug
```

### Trace Viewer
```bash
# Generate trace files
npx playwright test --trace on

# View trace in browser
npx playwright show-trace trace.zip
```

### Console Logs
```typescript
test('debug test', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('/projects/test-id');
});
```

## Common Test Scenarios

### 1. Project Creation Flow
```typescript
test('complete project creation workflow', async ({ page }) => {
  await page.goto('/projects/new');
  
  // Fill project details
  await page.getByTestId('project-name-input').fill('E2E Test Project');
  await page.getByTestId('project-description-input').fill('Test description');
  await page.getByTestId('create-button').click();
  
  // Verify project created
  await expect(page.getByTestId('project-created-message')).toBeVisible();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
});
```

### 2. Background Job Execution
```typescript
test('should execute background job successfully', async ({ page }) => {
  await page.goto('/projects/test-id/setup');
  
  // Configure job parameters
  await page.getByTestId('job-type-input').fill('Data Import');
  await page.getByTestId('start-job-button').click();
  
  // Monitor progress
  await expect(page.getByTestId('job-progress')).toBeVisible();
  await expect(page.getByTestId('progress-bar')).toBeVisible();
});
```

### 3. Error State Handling
```typescript
test('should handle API errors gracefully', async ({ page, request }) => {
  // Mock API failure
  await page.route('/api/projects/*/job-history', route => 
    route.fulfill({ status: 500, body: 'Server Error' })
  );
  
  await page.goto('/projects/test-id/runs');
  
  // Verify error handling
  await expect(page.getByTestId('error-message')).toBeVisible();
  await expect(page.getByTestId('retry-button')).toBeVisible();
});
```

## Performance Testing

### Load Time Assertions
```typescript
test('should load within performance budgets', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/projects/test-id');
  await page.getByTestId('main-content').waitFor();
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 second budget
});
```

### Network Monitoring
```typescript
test('should minimize API calls', async ({ page }) => {
  const apiCalls = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push(request.url());
    }
  });
  
  await page.goto('/projects/test-id/runs');
  await page.waitForLoadState('networkidle');
  
  // Verify optimized API usage
  expect(apiCalls.length).toBeLessThanOrEqual(2);
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: development
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Common Issues

**1. Authentication Bypass Not Working**
- Verify `NODE_ENV=development` in your environment
- Check that `PLAYWRIGHT_TESTING=true` is set in global-setup.ts
- Ensure middleware logs show "Bypassing auth for Playwright testing"

**2. Tests Timing Out**
- Increase timeout for slow operations: `{ timeout: 30000 }`
- Use `waitForLoadState('networkidle')` for heavy pages
- Check for unresolved promises in your application

**3. Element Not Found**
- Verify `data-testid` attributes exist in your components
- Use `page.getByTestId()` instead of generic selectors
- Wait for elements: `await page.getByTestId('element').waitFor()`

**4. Flaky Tests**
- Add proper wait conditions before assertions
- Clean test data between runs
- Use `test.beforeEach()` and `test.afterEach()` for setup/cleanup

---

## Next Steps

1. **Write Your First Test**: Create a simple test for your most critical user flow
2. **Add data-testid Attributes**: Ensure all interactive elements have proper test IDs
3. **Set Up CI Pipeline**: Integrate E2E tests into your deployment process
4. **Monitor Test Coverage**: Track which user flows are tested vs. manual

For questions or advanced scenarios, refer to the [Playwright Documentation](https://playwright.dev/docs/intro).