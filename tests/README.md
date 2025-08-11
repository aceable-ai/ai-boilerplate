# Playwright Testing Standards

> **Generated**: August 2025 | **Based on**: Runs page test debugging session

## 🎯 Golden Rules

### 1. **NEVER use `getByText()` - ALWAYS use `data-testid`**
```typescript
// ❌ WRONG - Fragile, breaks when text changes
await expect(page.getByText('Processing Research Threads')).toBeVisible();

// ✅ CORRECT - Robust, semantic
await expect(page.getByTestId('status-text')).toContainText('Processing Research Threads');
```

### 2. **Component Standards - Add testids PROACTIVELY**
Every component MUST have data-testids for all user-visible content:

```typescript
// ✅ Required patterns
<div data-testid="component-name">
  <h1 data-testid="title">Title</h1>
  <span data-testid="status-text">{status}</span>
  <span data-testid="progress-percentage">{percentage}%</span>
  <button data-testid="action-button">Action</button>
</div>
```

### 3. **Component Reuse - Use Scoped Selection**
When the same component appears multiple times, use scoped selection instead of renaming testids:

```typescript
// ❌ WRONG - Causes "strict mode violation" with duplicate testids
await expect(page.getByTestId('thread-details-title')).toBeVisible();
// Error: resolved to 2 elements (JobProgress + JobRunList both have ThreadDetails)

// ✅ CORRECT - Scope selection within parent containers
const progressCard = page.getByTestId('job-progress-card');
await expect(progressCard.getByTestId('thread-details-title')).toBeVisible();

const runsList = page.getByTestId('task-runs-section');  
await expect(runsList.getByTestId('thread-details-title')).toBeVisible();
```

**When to use scoping vs unique testids:**
- **Scoping**: Same component used in different contexts (`ThreadDetails` in progress vs run list)
- **Unique testids**: Different instances in lists (`data-testid="run-${id}"`, `data-testid="vertical-${vertical.id}"`)

```typescript
// ✅ Dynamic testids for list items
{runs.map(run => (
  <div key={run.id} data-testid={`job-run-${run.id}`}>
    <h3 data-testid={`run-title-${run.id}`}>Run #{run.id}</h3>
  </div>
))}
```

### 4. **Fixture Standards - Match API Response Formats**
```typescript
// ✅ API Response format (with wrapper)
{
  "success": true,
  "data": {
    "activeJob": { ... },
    "jobs": [ ... ]
  }
}

// ✅ Component-specific format  
{
  "jobs": [
    {
      "metadata": {
        "verticals": [{ "id": "...", "displayName": "..." }],
        "productTypes": { "vertical_id": [{ "id": "...", "displayName": "..." }] }
      }
    }
  ]
}
```

## 📁 Fixture Organization

### Structure
```
tests/fixtures/
├── job-history/          # /api/projects/{id}/job-history responses
├── job-runs/            # /api/projects/{id}/job-runs responses  
└── index.ts             # Typed exports + scenarios
```

### Naming Convention
- `{scenario}-{state}.json` - e.g., `job-processing.json`
- `empty-{resource}.json` - e.g., `empty-project.json`
- `multiple-{resource}.json` - e.g., `multiple-runs.json`

### Complete Scenarios
Use `scenarios` from index.ts for complete user flows:
```typescript
// ✅ Complete scenario with all required data
await page.route('/api/projects/*/job-history', (route) => {
  route.fulfill({ json: scenarios.processingRun.jobHistory });
});
await page.route('/api/projects/*/job-runs', (route) => {
  route.fulfill({ json: scenarios.processingRun.jobRuns });
});
```

## 🚨 Common Pitfalls & Solutions

### Duplicate TestId Violations
```typescript
// ❌ PROBLEM - Multiple components use same testid
Error: strict mode violation: getByTestId('thread-details-title') resolved to 2 elements

// ✅ SOLUTION 1 - Scoped selection (preferred)
const progressCard = page.getByTestId('job-progress-card');
await expect(progressCard.getByTestId('thread-details-title')).toBeVisible();

// ✅ SOLUTION 2 - Unique testids when scoping isn't feasible  
<ThreadDetails context="progress" /> // → data-testid="progress-thread-details-title"
<ThreadDetails context="run-list" /> // → data-testid="run-list-thread-details-title"
```

### API Endpoint Mismatches
```typescript
// ❌ WRONG - Component calls different endpoint
await page.route('/api/jobs/*/threads', ...);  // Test mocks this
// But component calls: '/api/background-jobs/*/threads'

// ✅ CORRECT - Match actual component calls
await page.route('/api/background-jobs/*/threads', ...);
```

### Data Structure Mismatches
```typescript
// ❌ WRONG - Using job-history data for job-runs endpoint
route.fulfill({ json: { jobs: jobHistory.data.jobs } }); // Missing metadata!

// ✅ CORRECT - Use proper job-runs fixtures
route.fulfill({ json: scenarios.processingRun.jobRuns });
```

### Polling Test Logic
```typescript
// ❌ WRONG - Hardcoded values that don't match mock progression
await expect(page.getByText('58%')).toBeVisible(); // But polling updates to 75%!

// ✅ CORRECT - Expect final state from polling logic
await expect(page.getByTestId('progress-percentage')).toContainText('75%');
```

## 🔧 Test Development Workflow

1. **Component First** - Add data-testids to components BEFORE writing tests
2. **API Research** - Check actual endpoints components call (not assumptions)
3. **Fixture Validation** - Ensure fixtures match actual API response structure
4. **Scenario Testing** - Use complete scenarios, not piecemeal mocking
5. **Value Verification** - Check fixture data matches test expectations

## 📊 Fixture Maintenance

### When APIs Change
1. Update fixture structure to match new API format
2. Update scenarios in `index.ts`
3. Update component data access if needed
4. Update test assertions to match new structure

### Type Safety
```typescript
// ✅ Define interfaces for fixtures
export interface JobHistoryFixture {
  success: boolean;
  data: { activeJob: any; jobs: any[] };
}

export interface JobRunsFixture {
  jobs: Array<{ metadata: { type: string; status: string } }>;
}
```

---

**Key Takeaway**: Playwright tests should be as deterministic and robust as unit tests. Use data-testids, match actual API contracts, and maintain fixture integrity.