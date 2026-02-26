#!/bin/bash

# Prerequisites Checker
# Validates dev environment before starting work.
# Node/NVM setup is handled by AGENT.md + Claude — not this script.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ISSUES=0
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; ((ISSUES++)); }
print_error()   { echo -e "${RED}❌ $1${NC}"; ((ISSUES++)); }
print_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
section()       { echo ""; echo -e "${BLUE}── $1${NC}"; }

echo "🔍 Checking prerequisites..."

# ── Node ──────────────────────────────────────────────────────────────────────
section "Node.js"
REQUIRED=$(cat .nvmrc 2>/dev/null | tr -d '\n' || echo "24")
if command -v node &>/dev/null; then
  CURRENT=$(node --version | sed 's/v//')
  if printf '%s\n%s\n' "$REQUIRED" "$CURRENT" | sort -V -C; then
    print_success "Node.js $CURRENT"
  else
    print_error "Node.js $CURRENT — need $REQUIRED+. Run: nvm install && nvm use"
  fi
else
  print_error "Node.js not found. See AGENT.md for nvm setup."
fi

[[ -d "node_modules" ]] && print_success "node_modules present" || print_warn "Missing node_modules — run: npm install"

# ── Environment ───────────────────────────────────────────────────────────────
section "Environment"
ENV_FILE=""
for f in ".env.local" ".env.development.local"; do
  [[ -f "$f" ]] && ENV_FILE="$f" && break
done

if [[ -n "$ENV_FILE" ]]; then
  print_success "Env file: $ENV_FILE"
  grep -q "DATABASE_URL"                   "$ENV_FILE" && print_success "DATABASE_URL set"          || print_warn "DATABASE_URL missing"
  grep -q "OPENAI_API_KEY"                 "$ENV_FILE" && print_success "OPENAI_API_KEY set"        || print_warn "OPENAI_API_KEY missing"
  grep -q "CLERK_SECRET_KEY"               "$ENV_FILE" && print_success "Clerk keys set"            || print_warn "CLERK_SECRET_KEY missing"
else
  print_error "No env file — run: cp .env.example .env.local"
fi

# ── GitHub CLI ────────────────────────────────────────────────────────────────
section "GitHub CLI"
if command -v gh &>/dev/null; then
  gh auth status &>/dev/null \
    && print_success "Authenticated as: $(gh api user --jq '.login' 2>/dev/null)" \
    || print_warn "Not authenticated — run: gh auth login"
else
  print_warn "gh not found — run: npm run setup:gh"
fi

# ── Database (via drizzle-kit + neonctl) ──────────────────────────────────────
section "Database"
if command -v neonctl &>/dev/null; then
  neonctl projects list &>/dev/null \
    && print_success "Neon authenticated — DB reachable" \
    || print_warn "neonctl not authenticated — run: neonctl auth"
elif [[ -n "$ENV_FILE" ]] && grep -q "DATABASE_URL" "$ENV_FILE"; then
  # Fallback: drizzle-kit can introspect schema which proves connectivity
  if npx drizzle-kit check &>/dev/null 2>&1; then
    print_success "DB connection OK (drizzle-kit)"
  else
    print_warn "DB unreachable — check DATABASE_URL in $ENV_FILE"
  fi
else
  print_info "DB check skipped (no env file or neonctl)"
fi

# ── Port ──────────────────────────────────────────────────────────────────────
section "Port 3003"
command -v lsof &>/dev/null && {
  lsof -i :3003 &>/dev/null && print_warn "Port 3003 in use" || print_success "Port 3003 available"
}

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ $ISSUES -eq 0 ]]; then
  echo -e "${GREEN}✅ All good — ready to dev!${NC}"
else
  echo -e "${YELLOW}⚠️  $ISSUES issue(s) — see above${NC}"
fi
exit $ISSUES
