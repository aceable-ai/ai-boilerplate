# AI Workflow Standards

How to work effectively in this repo when AI is driving the session.

---

## Branch & Draft PR — Start Every Feature This Way

**Before writing a single line of code:**

```bash
# 1. Start from latest main
git checkout main && git pull origin main

# 2. Create a focused branch
git checkout -b feature/short-description   # or bugfix/, hotfix/

# 3. Make one initial commit (can be a stub) and open a draft PR immediately
git commit --allow-empty -m "feat(scope): initial scaffold"
git push -u origin HEAD
gh pr create --draft --title "feat(scope): short description" --body "## Summary\n\n## Test plan\n- [ ] "
```

Opening a draft PR early:
- Makes work visible before it's done
- Lets you track progress and link to a ticket
- Triggers CI on every push from the start
- Prevents the "I'll just push it to main real quick" temptation

**Never push directly to `main`.** All changes go through a PR — no exceptions.

When work is ready: `gh pr ready` to convert draft → ready for review.

---

## Atomic Commits

**Rule:** One logical change per commit. Commit whenever the build passes and the change is coherent.

```bash
# Good: focused, atomic
git commit -m "feat(auth): add Clerk middleware to protect API routes"
git commit -m "test(auth): add middleware redirect tests"

# Bad: bundled
git commit -m "auth stuff + fixed a bug + updated docs"
```

**When to commit:**
- After each working slice — don't batch up a day of work
- Before switching concerns — don't mix refactor with feature work
- Before running experiments — preserve the last known good state

**Keep PRs small and focused.** One feature or fix per PR. If a PR touches more than 3-4 files unrelated to the same concern, consider splitting it.

---

## Test With Every Change

Tests are written in the same commit as the code — not as a follow-up.

```bash
npm run test          # Jest unit tests — run before every commit
npm run test:e2e      # Playwright — run before marking work done
npm run test:watch    # Keep running during active development
```

**Rules:**
- If you add a function → add a unit test in the same commit
- If you add a component → add `data-testid` attributes
- If you fix a bug → add a regression test that would have caught it
- Red tests block the next task. Fix before continuing.

See [E2E Testing](testing-e2e.md) for Playwright conventions and `data-testid` standards.

---

## Agent Teams

For tasks with independent sub-problems, spawn parallel sub-agents instead of serializing work.

**Parallelize when:**
- Research and scaffolding are independent — run simultaneously
- Writing tests and writing implementation are independent — run simultaneously
- Multiple files need similar changes — fan out, then merge

**Example decomposition:**
```
Task: Add user profile page

Sub-agent 1: Research existing user schema + Clerk user object shape
Sub-agent 2: Scaffold the page component structure
Sub-agent 3: Write Playwright test spec for the page

→ Merge results, wire together, commit
```

**Don't parallelize when:**
- Agent B needs Agent A's output to start
- Changes touch the same files (merge conflicts)
- Order matters for correctness

---

## Scratch Files

Exploratory code, debug scripts, and spikes live in `.scratch/` — never in `src/`.

**Convention:**
```
.scratch/
├── auth/
│   └── test-clerk-webhook.ts
├── db/
│   └── seed-experiment.ts
└── perf/
    └── query-benchmark.ts
```

**Rules:**
- Namespace by feature: `.scratch/<feature>/<file>.ts`
- Never import from `.scratch/` in production code
- Never commit scratch files (gitignored)
- Clean up with `npm run scratch:clean`

---

## Retro — Continuous Improvement

After every feature or session, take 2 minutes:

**Ask:**
1. What was confusing or hard to find?
2. What decision did I have to re-derive that should be documented?
3. What pattern kept appearing that isn't captured anywhere?
4. Did anything in the docs mislead me or send me in the wrong direction?

**Act:**
- Confusing setup step → update `docs/DEVELOPMENT.md`
- Recurring code pattern → add to `docs/development-standards.md`
- AI kept making the same wrong assumption → add a `// Why:` comment or update AGENTS.md
- A doc became outdated → fix it now, not later

**Keep AGENTS.md under 200 lines.** If it grows, move detail here and link it.

---

## 80/20 Documentation

Before adding to any doc, ask: *"Is this the 20% of content that creates 80% of value?"*

| Where | Use for |
|-------|---------|
| AGENTS.md | Things every AI session needs — setup, commands, non-negotiable rules |
| `docs/` | Reference material that's occasionally useful |
| Inline `// Why:` comment | Non-obvious decisions close to the code |
| `.scratch/` | Temporary analysis and notes |

**Don't create new docs** for one-off context. A well-placed comment outlives a forgotten markdown file.
