#!/bin/bash

echo $NVM_DIR
# Prerequisites Checker
# Created: 2025-08-22
# Purpose: Validate all development prerequisites before starting work

set -e  # Exit on error

echo "🔍 Checking development prerequisites..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
ISSUES_FOUND=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((ISSUES_FOUND++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ISSUES_FOUND++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}🔸 $1${NC}"
    echo "────────────────────────────────────────"
}

# Helper function for NVM installation
install_nvm() {
    echo ""
    print_info "Installing NVM (Node Version Manager)..."
    
    # Download and install NVM
    if curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash; then
        print_success "NVM installed successfully"
        
        # Source NVM to make it available in current session
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        if [[ -f ".nvmrc" ]]; then
            NVMRC_VERSION=$(cat .nvmrc)
            print_info "Installing Node.js $NVMRC_VERSION from .nvmrc..."
            nvm install "$NVMRC_VERSION"
            nvm use "$NVMRC_VERSION"
            print_success "Node.js $NVMRC_VERSION installed and activated"
        else
            print_info "Installing latest Node.js LTS..."
            nvm install --lts
            nvm use --lts
        fi
        
        print_info "Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
        return 0
    else
        print_error "Failed to install NVM"
        return 1
    fi
}

# Check Node.js version
print_section "Node.js Environment"

# Check for .nvmrc file
if [[ -f ".nvmrc" ]]; then
    NVMRC_VERSION=$(cat .nvmrc | tr -d '\n')
    print_info "Found .nvmrc specifying Node.js $NVMRC_VERSION"
else
    NVMRC_VERSION="22.0.0"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="22.0.0"
    
    if printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
        print_success "Node.js $NODE_VERSION (>= $REQUIRED_VERSION required)"
        
        # Check if using correct version from .nvmrc
        if [[ -f ".nvmrc" ]] && [[ "$NODE_VERSION" != "$NVMRC_VERSION"* ]]; then
            print_warning "Node.js $NODE_VERSION active, but .nvmrc specifies $NVMRC_VERSION"
            
            if command -v nvm &> /dev/null; then
                print_info "Run: nvm use"
            else
                print_info "Consider using NVM for Node version management"
            fi
        fi
    else
        print_error "Node.js $NODE_VERSION found, but >= $REQUIRED_VERSION required"
        
        # Check if this is a non-interactive environment (Claude slash command)
        if [[ -t 0 ]] && [[ -z "$CI" ]] && [[ -z "$AI_SLASH_COMMAND" ]]; then
            # Interactive terminal - prompt for NVM installation
            echo ""
            echo -e "${YELLOW}Would you like to install NVM to manage Node.js versions? (y/N)${NC}"
            read -r response
            
            if [[ "$response" =~ ^[Yy]$ ]]; then
                install_nvm
            else
                print_info "Manual installation options:"
                print_info "1. Install NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
                print_info "2. Install Node.js directly: https://nodejs.org/"
            fi
        elif [[ -n "$AI_SLASH_COMMAND" ]]; then
            # Claude slash command - ask Claude to handle NVM installation
            print_info "🤖 Running via AI agent slash command"
            echo ""
            echo "AI_REQUEST: Please install NVM and Node.js $NVMRC_VERSION, then continue with this script."
            echo "Commands needed:"
            echo "1. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
            echo "2. source ~/.bashrc (or ~/.zshrc)" 
            echo "3. nvm install $NVMRC_VERSION"
            echo "4. nvm use $NVMRC_VERSION"
            echo "5. Re-run: npm run task-check-prerequisites"
            echo ""
            print_info "Waiting for Claude to complete NVM installation..."
            exit 2  # Exit with code 2 to indicate Claude should handle this
        else
            # Other non-interactive environments
            print_info "Detected non-interactive environment"
            print_info "To fix Node.js version, you can:"
            print_info "1. Install NVM and Node.js $NVMRC_VERSION:"
            echo -e "${BLUE}   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash${NC}"
            echo -e "${BLUE}   source ~/.bashrc  # or ~/.zshrc${NC}"
            echo -e "${BLUE}   nvm install $NVMRC_VERSION${NC}"
            echo -e "${BLUE}   nvm use $NVMRC_VERSION${NC}"
            print_info "2. Or install Node.js directly from: https://nodejs.org/"
        fi
    fi
else
    print_error "Node.js not found"
    
    # Check if this is a non-interactive environment
    if [[ -t 0 ]] && [[ -z "$CI" ]] && [[ -z "$AI_SLASH_COMMAND" ]]; then
        # Interactive terminal - prompt for NVM installation
        echo ""
        echo -e "${YELLOW}Would you like to install NVM and Node.js? (y/N)${NC}"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            install_nvm
        else
            print_info "Manual installation options:"
            print_info "1. Install NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
            print_info "2. Install Node.js directly: https://nodejs.org/"
        fi
    elif [[ -n "$AI_SLASH_COMMAND" ]]; then
        # Claude slash command - ask Claude to handle NVM installation
        print_info "🤖 Running via AI agent slash command"
        echo ""
        echo "AI_REQUEST: Please install NVM and Node.js from .nvmrc, then continue with this script."
        echo "Commands needed:"
        echo "1. curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo "2. source ~/.bashrc (or ~/.zshrc)"
        if [[ -f ".nvmrc" ]]; then
            echo "3. nvm install"
            echo "4. nvm use"
        else
            echo "3. nvm install --lts"
            echo "4. nvm use --lts"
        fi
        echo "5. Re-run: npm run task-check-prerequisites"
        echo ""
        print_info "Waiting for Claude to complete NVM installation..."
        exit 2  # Exit with code 2 to indicate Claude should handle this
    else
        # Other non-interactive environments
        print_info "To install Node.js, you can:"
        print_info "1. Install NVM and Node.js:"
        echo -e "${BLUE}   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash${NC}"
        echo -e "${BLUE}   source ~/.bashrc  # or ~/.zshrc${NC}"
        if [[ -f ".nvmrc" ]]; then
            echo -e "${BLUE}   nvm install${NC}"
            echo -e "${BLUE}   nvm use${NC}"
        else
            echo -e "${BLUE}   nvm install --lts${NC}"
            echo -e "${BLUE}   nvm use --lts${NC}"
        fi
        print_info "2. Or install directly: https://nodejs.org/"
    fi
fi

# Check for NVM and handle lazy loading
if command -v nvm &> /dev/null; then
    print_success "NVM available for Node version management"
elif [[ -n "$NVM_DIR" && -d "$NVM_DIR" ]]; then
    # Try to trigger lazy loading by calling nvm (which should load it)
    if nvm --version &> /dev/null 2>&1; then
        print_success "NVM lazy-loaded and available for Node version management"
    else
        # Check if we're using zsh with lazy loading configured
        if [[ "$SHELL" == */zsh ]] && [[ -f "$HOME/.zshrc" ]] && grep -q "nvm.*lazy" "$HOME/.zshrc"; then
            print_info "NVM lazy loading detected in ~/.zshrc - will load automatically when needed"
        elif [[ "$SHELL" == */zsh ]]; then
            print_info "NVM installed but not loaded - restart terminal or run: source ~/.zshrc"
        else
            print_info "NVM installed but not loaded - restart terminal or run: source ~/.bashrc"
        fi
    fi
elif [[ -d "$HOME/.nvm" ]]; then
    # Check if we're using zsh with lazy loading configured
    if [[ "$SHELL" == */zsh ]] && [[ -f "$HOME/.zshrc" ]] && grep -q "nvm.*lazy" "$HOME/.zshrc"; then
        print_info "NVM lazy loading detected in ~/.zshrc - will load automatically when needed"
    elif [[ "$SHELL" == */zsh ]]; then
        print_info "NVM installed but not loaded - restart terminal or run: source ~/.zshrc"
    else
        print_info "NVM installed but not loaded - restart terminal or run: source ~/.bashrc"
    fi
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION"
else
    print_error "npm not found (usually comes with Node.js)"
fi

# Check package.json and node_modules
print_section "Project Dependencies"
if [[ -f "package.json" ]]; then
    print_success "package.json found"
else
    print_error "package.json not found - are you in the repo root?"
fi

if [[ -d "node_modules" ]]; then
    print_success "node_modules directory exists"
else
    print_warning "node_modules not found - run 'npm install'"
fi

# Check lock file
if [[ -f "package-lock.json" ]]; then
    print_success "package-lock.json found"
else
    print_warning "package-lock.json missing - dependencies may be inconsistent"
fi

# Check CLI tools
print_section "Required CLI Tools"

# Vercel CLI
if command -v vercel &> /dev/null; then
    VERCEL_VERSION=$(vercel --version)
    print_success "Vercel CLI $VERCEL_VERSION"
    
    # Check Vercel authentication
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami 2>/dev/null)
        print_success "Authenticated with Vercel as: $VERCEL_USER"
    else
        print_warning "Vercel CLI not authenticated"
        
        # Check if this is a Claude slash command
        if [[ -n "$AI_SLASH_COMMAND" ]]; then
            echo ""
            echo "AI_PROMPT: Would you like to authenticate with Vercel now?"
            echo "AI_ACTION_IF_YES: vercel login"
            echo ""
        # Check if this is an interactive environment
        elif [[ -t 0 ]] && [[ -z "$CI" ]]; then
            echo ""
            echo -e "${YELLOW}Would you like to authenticate with Vercel now? (y/N)${NC}"
            read -r response
            
            if [[ "$response" =~ ^[Yy]$ ]]; then
                echo ""
                print_info "Running 'vercel login'..."
                vercel login
                
                # Re-check authentication after login
                if vercel whoami &> /dev/null; then
                    VERCEL_USER=$(vercel whoami 2>/dev/null)
                    print_success "Now authenticated with Vercel as: $VERCEL_USER"
                    ((ISSUES_FOUND--))  # Reduce issues count since this was fixed
                else
                    print_error "Authentication completed but verification still failed"
                fi
            else
                print_info "Run 'vercel login' manually to authenticate"
            fi
        else
            print_info "Run 'vercel login' to authenticate"
        fi
    fi
else
    print_error "Vercel CLI not found - run 'npm run task-setup-all'"
fi

# GitHub CLI  
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n1)
    print_success "$GH_VERSION"
    
    # Check GitHub authentication
    if gh auth status &> /dev/null; then
        GH_USER=$(gh api user --jq '.login' 2>/dev/null)
        print_success "Authenticated with GitHub as: $GH_USER"
    else
        print_warning "GitHub CLI not authenticated"
        
        # Check if this is a Claude slash command
        if [[ -n "$AI_SLASH_COMMAND" ]]; then
            echo ""
            echo "AI_PROMPT: Would you like to authenticate with GitHub now?"
            echo "AI_ACTION_IF_YES: ./scripts/setup-github-cli.sh"
            echo ""
        # Check if this is an interactive environment
        elif [[ -t 0 ]] && [[ -z "$CI" ]]; then
            echo ""
            echo -e "${YELLOW}Would you like to run the GitHub CLI setup script? (y/N)${NC}"
            read -r response
            
            if [[ "$response" =~ ^[Yy]$ ]]; then
                echo ""
                print_info "Running GitHub CLI setup script..."
                ./scripts/setup-github-cli.sh
                
                # Re-check authentication after setup
                if gh auth status &> /dev/null; then
                    GH_USER=$(gh api user --jq '.login' 2>/dev/null)
                    print_success "Now authenticated with GitHub as: $GH_USER"
                    ((ISSUES_FOUND--))  # Reduce issues count since this was fixed
                else
                    print_error "Setup completed but authentication still failed"
                fi
            else
                print_info "Run 'npm run task-gh-setup' manually to authenticate"
            fi
        else
            print_info "Run 'npm run task-gh-setup' to authenticate"
        fi
    fi
else
    print_error "GitHub CLI not found - run 'npm run task-gh-setup'"
fi

# Neon CLI
if command -v neonctl &> /dev/null; then
    print_success "Neon CLI installed"
    
    # Check Neon authentication
    if neonctl projects list &> /dev/null; then
        print_success "Authenticated with Neon"
    else
        print_warning "Neon CLI not authenticated - run 'neonctl auth'"
    fi
else
    print_warning "Neon CLI not found - install with 'npm install -g neonctl'"
    print_info "Required for database branching workflow"
fi

# Check environment files
print_section "Environment Configuration"

ENV_FILES=(".env.local" ".env.development.local" ".env")
ENV_FOUND=false

for env_file in "${ENV_FILES[@]}"; do
    if [[ -f "$env_file" ]]; then
        print_success "Environment file: $env_file"
        ENV_FOUND=true
        
        # Check for required environment variables
        if grep -q "DATABASE_URL" "$env_file"; then
            print_success "DATABASE_URL configured in $env_file"
        else
            print_warning "DATABASE_URL missing from $env_file"
        fi
        
        if grep -q "OPENAI_API_KEY" "$env_file"; then
            print_success "OPENAI_API_KEY configured in $env_file"
        else
            print_warning "OPENAI_API_KEY missing from $env_file"
        fi
        
        if grep -q "CLERK" "$env_file"; then
            print_success "Clerk authentication keys configured in $env_file"
        else
            print_warning "Clerk authentication keys missing from $env_file"
        fi
        
        break
    fi
done

if [[ "$ENV_FOUND" = false ]]; then
    print_error "No environment file found"
    print_info "Run 'vercel env pull .env.development.local' after Vercel setup"
fi

# Check Vercel project linking
print_section "Project Configuration"

if [[ -f ".vercel/project.json" ]]; then
    print_success "Project linked to Vercel"
else
    print_warning "Project not linked to Vercel - run 'vercel link'"
fi

if [[ -d ".git" ]]; then
    print_success "Git repository initialized"
    
    # Check git configuration
    if git config user.name &> /dev/null && git config user.email &> /dev/null; then
        GIT_USER=$(git config user.name)
        GIT_EMAIL=$(git config user.email)
        print_success "Git configured: $GIT_USER <$GIT_EMAIL>"
    else
        print_warning "Git user not configured"
        print_info "Run: git config --global user.name 'Your Name'"
        print_info "Run: git config --global user.email 'your.email@example.com'"
    fi
else
    print_error "Not a git repository"
fi

# Check development tools
print_section "Development Tools"

# TypeScript
if command -v tsc &> /dev/null || [[ -f "node_modules/.bin/tsc" ]]; then
    print_success "TypeScript available"
else
    print_warning "TypeScript not found - should be in devDependencies"
fi

# Playwright (for testing)
if [[ -f "node_modules/.bin/playwright" ]] || command -v playwright &> /dev/null; then
    print_success "Playwright testing framework available"
else
    print_warning "Playwright not found - run 'npm install' or 'npx playwright install'"
fi

# Check port availability
print_section "Port Availability"

if command -v lsof &> /dev/null; then
    if lsof -i :3003 &> /dev/null; then
        print_warning "Port 3003 is in use (development server port)"
    else
        print_success "Port 3003 available for development server"
    fi
else
    print_info "Cannot check port availability (lsof not available)"
fi

# Database connection test (if environment is set up)
print_section "Database Connectivity"

if [[ -f ".env.development.local" ]] && grep -q "DATABASE_URL" ".env.development.local"; then
    print_info "Testing database connection..."
    
    # Simple connection test using Node.js if possible
    if command -v node &> /dev/null && [[ -f "node_modules/@neondatabase/serverless/package.json" ]]; then
        DB_TEST_RESULT=$(node -e "
            const { neon } = require('@neondatabase/serverless');
            require('dotenv').config({ path: '.env.development.local' });
            
            if (process.env.DATABASE_URL) {
                const sql = neon(process.env.DATABASE_URL);
                sql\`SELECT 1\`
                    .then(() => console.log('SUCCESS'))
                    .catch((err) => console.log('ERROR: ' + err.message));
            } else {
                console.log('ERROR: DATABASE_URL not found');
            }
        " 2>/dev/null || echo "ERROR: Connection test failed")
        
        if [[ "$DB_TEST_RESULT" == "SUCCESS" ]]; then
            print_success "Database connection successful"
        else
            print_warning "Database connection failed: $DB_TEST_RESULT"
        fi
    else
        print_info "Cannot test database connection (dependencies not installed)"
    fi
else
    print_info "Skipping database test (environment not configured)"
fi

# Summary
print_section "Summary"

if [[ $ISSUES_FOUND -eq 0 ]]; then
    print_success "All prerequisites met! You're ready to develop."
    echo ""
    print_info "Quick start commands:"
    echo "  npm run dev          # Start development server"
    echo "  npm run db:studio    # Open database admin"
    echo "  npm run test:e2e     # Run end-to-end tests"
else
    echo -e "${YELLOW}⚠️  Found $ISSUES_FOUND issue(s) that should be addressed${NC}"
    echo ""
    
    # Claude slash command auto-execution
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        print_info "🤖 Claude slash command detected - auto-fixing issues..."
        echo ""
        echo "AI_REQUEST: Please run the complete setup to fix all issues:"
        echo "npm run task-setup-all"
        echo ""
        print_info "This will automatically install and configure:"
        echo "  - NVM and correct Node.js version"
        echo "  - GitHub CLI with authentication" 
        echo "  - Vercel CLI with authentication"
        echo "  - Environment variables"
        echo "  - Project dependencies"
        echo "  - Neon CLI for database management"
        echo ""
        print_info "After setup completes, the check will run again automatically."
        exit 3  # Special exit code for Claude auto-execution
    else
        # Manual setup instructions
        print_info "Quick fix options:"
        echo "  npm run task-setup-all                  # Complete automated setup"
        echo "  npm run task-check-prerequisites         # Re-run this check"
        echo ""
        print_info "Individual setup commands:"
        echo "  npm install                              # Install dependencies"
        echo "  npm run task-setup-all                   # Setup Vercel CLI"
        echo "  npm run task-gh-setup                    # Setup GitHub CLI"
        echo "  vercel env pull .env.development.local   # Get environment variables"
        echo "  neonctl auth                             # Authenticate with Neon"
        echo ""
        print_info "For complete setup guide, see: README.md"
    fi
fi

exit $ISSUES_FOUND
