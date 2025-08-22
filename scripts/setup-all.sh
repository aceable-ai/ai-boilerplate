#!/bin/bash

# Comprehensive Development Setup Script
# Created: 2025-08-22
# Purpose: Complete development environment setup in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}🔸 $1${NC}"
    echo "════════════════════════════════════════"
}

print_step() {
    echo ""
    echo -e "${YELLOW}📋 Step $1${NC}"
}

echo "🚀 Complete Development Environment Setup"
echo "This will set up everything needed for development"
echo ""

# Step 1: Node.js and NVM Setup
print_step "1/6: Node.js Environment"

if [[ -f ".nvmrc" ]]; then
    NVMRC_VERSION=$(cat .nvmrc | tr -d '\n')
    print_info "Found .nvmrc specifying Node.js $NVMRC_VERSION"
else
    NVMRC_VERSION="22"
    print_warning "No .nvmrc found, defaulting to Node.js $NVMRC_VERSION"
fi

# Check if Node.js meets requirements
NODE_OK=false
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if printf '%s\n%s\n' "22.0.0" "$NODE_VERSION" | sort -V -C; then
        print_success "Node.js $NODE_VERSION meets requirements"
        NODE_OK=true
    else
        print_warning "Node.js $NODE_VERSION found, but >= 22.0.0 required"
    fi
else
    print_warning "Node.js not found"
fi

# Install NVM and correct Node version if needed
if [[ "$NODE_OK" = false ]]; then
    print_info "Installing NVM and Node.js $NVMRC_VERSION..."
    
    # Install NVM if not present
    if ! command -v nvm &> /dev/null && [[ ! -d "$HOME/.nvm" ]]; then
        print_info "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    
    # Source NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if command -v nvm &> /dev/null; then
        print_info "Installing and using Node.js $NVMRC_VERSION..."
        nvm install "$NVMRC_VERSION"
        nvm use "$NVMRC_VERSION"
        print_success "Node.js $NVMRC_VERSION installed and activated"
    else
        print_error "NVM installation failed. Please restart terminal and re-run this script"
        exit 1
    fi
else
    print_success "Node.js environment ready"
fi

# Step 2: Install Project Dependencies
print_step "2/6: Project Dependencies"

if [[ -f "package.json" ]]; then
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing npm dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
else
    print_error "package.json not found - are you in the repo root?"
    exit 1
fi

# Step 3: GitHub CLI Setup
print_step "3/6: GitHub CLI"

NEEDS_GH_AUTH=false
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n1)
    print_success "$GH_VERSION already installed"
    
    if ! gh auth status &> /dev/null; then
        print_info "GitHub CLI installed but not authenticated"
        NEEDS_GH_AUTH=true
    else
        GH_USER=$(gh api user --jq '.login' 2>/dev/null)
        print_success "Already authenticated as: $GH_USER"
    fi
else
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        # AI agent slash command - prompt AI agent to install
        echo ""
        echo "AI_REQUEST: GitHub CLI not found. Would you like to install it?"
        echo "If yes, run: npm run task-gh-setup"
        echo "Then continue with: npm run task-setup-all"
        exit 4  # Exit code for AI agent to handle GitHub CLI installation
    else
        # Interactive - ask user
        echo ""
        print_info "GitHub CLI not found. Would you like to install it? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Installing GitHub CLI..."
            ./scripts/setup-github-cli.sh
            print_success "GitHub CLI installed"
            NEEDS_GH_AUTH=true
        else
            print_warning "Skipping GitHub CLI installation"
        fi
    fi
fi

# Step 4: Vercel CLI Setup
print_step "4/6: Vercel CLI"

NEEDS_VERCEL_AUTH=false
if command -v vercel &> /dev/null; then
    VERCEL_VERSION=$(vercel --version)
    print_success "Vercel CLI $VERCEL_VERSION already installed"
    
    if ! vercel whoami &> /dev/null; then
        print_info "Vercel CLI installed but not authenticated"
        NEEDS_VERCEL_AUTH=true
    else
        VERCEL_USER=$(vercel whoami 2>/dev/null)
        print_success "Already authenticated as: $VERCEL_USER"
    fi
else
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        # AI agent slash command - prompt AI agent to install
        echo ""
        echo "AI_REQUEST: Vercel CLI not found. Would you like to install it?"
        echo "If yes, run: npm run task-setup-all"
        echo "Then continue with: npm run task-setup-all"
        exit 5  # Exit code for AI agent to handle Vercel CLI installation
    else
        # Interactive - ask user
        echo ""
        print_info "Vercel CLI not found. Would you like to install it? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Installing Vercel CLI..."
            npm install -g vercel
            print_success "Vercel CLI installed"
            NEEDS_VERCEL_AUTH=true
        else
            print_warning "Skipping Vercel CLI installation"
        fi
    fi
fi

# Step 5: Environment Configuration
print_step "5/6: Environment Variables"

NEEDS_ENV_SETUP=false
if [[ ! -f ".env.development.local" ]]; then
    print_info "Environment variables not configured"
    NEEDS_ENV_SETUP=true
else
    print_success "Environment variables already configured"
    
    # Validate required environment variables
    ENV_ISSUES=0
    if ! grep -q "DATABASE_URL" ".env.development.local"; then
        print_warning "DATABASE_URL missing from environment"
        ((ENV_ISSUES++))
    fi

    if ! grep -q "OPENAI_API_KEY" ".env.development.local"; then
        print_warning "OPENAI_API_KEY missing from environment"
        ((ENV_ISSUES++))
    fi

    if ! grep -q "CLERK" ".env.development.local"; then
        print_warning "Clerk authentication keys missing from environment"
        ((ENV_ISSUES++))
    fi

    if [[ $ENV_ISSUES -eq 0 ]]; then
        print_success "All required environment variables present"
    else
        print_info "Some environment variables may need updating"
        NEEDS_ENV_SETUP=true
    fi
fi

# Step 6: Neon CLI Setup
print_step "6/6: Database CLI (Optional)"

NEEDS_NEON_AUTH=false
if command -v neonctl &> /dev/null; then
    print_success "Neon CLI already installed"
    
    if ! neonctl projects list &> /dev/null; then
        print_info "Neon CLI installed but not authenticated"
        NEEDS_NEON_AUTH=true
    else
        print_success "Neon CLI authenticated"
    fi
else
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        # AI agent slash command - prompt AI agent to install
        echo ""
        echo "AI_REQUEST: Neon CLI not found (optional for database management). Install it?"
        echo "If yes, run: npm install -g neonctl"
        # Don't exit - this is optional
        print_info "Neon CLI installation skipped (optional)"
    else
        # Interactive - ask user
        echo ""
        print_info "Neon CLI not found. Install it for database management? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Installing Neon CLI..."
            npm install -g neonctl
            print_success "Neon CLI installed"
            NEEDS_NEON_AUTH=true
        else
            print_info "Neon CLI installation skipped (optional)"
        fi
    fi
fi

# Final verification
print_section "Setup Complete!"

print_success "Tool installation complete!"
echo ""

# Check if authentication is needed
AUTH_NEEDED=false
if [[ "$NEEDS_GH_AUTH" = true ]] || [[ "$NEEDS_VERCEL_AUTH" = true ]] || [[ "$NEEDS_ENV_SETUP" = true ]] || [[ "$NEEDS_NEON_AUTH" = true ]]; then
    AUTH_NEEDED=true
fi

if [[ "$AUTH_NEEDED" = true ]]; then
    print_section "🔐 Authentication Required"
    print_info "Some services need authentication before you can develop:"
    echo ""
    
    if [[ "$NEEDS_GH_AUTH" = true ]]; then
        echo "  🐙 GitHub CLI - for creating PRs and managing repos"
    fi
    
    if [[ "$NEEDS_VERCEL_AUTH" = true ]] || [[ "$NEEDS_ENV_SETUP" = true ]]; then
        echo "  ▲ Vercel CLI - for deployment and environment variables"
    fi
    
    if [[ "$NEEDS_NEON_AUTH" = true ]]; then
        echo "  🗄️  Neon CLI - for database management (optional)"
    fi
    
    echo ""
    
    # Prompt user if they want to authenticate now
    if [[ -z "$AI_SLASH_COMMAND" ]]; then
        print_info "Would you like to authenticate now? This will run the authentication setup. (y/N)"
        read -r auth_response
        
        if [[ "$auth_response" =~ ^[Yy]$ ]]; then
            print_info "Starting authentication setup..."
            ./scripts/setup-auth.sh
            AUTH_SETUP_CODE=$?
            
            if [[ $AUTH_SETUP_CODE -eq 0 ]]; then
                print_success "Authentication completed successfully!"
            else
                print_warning "Authentication completed with some issues - check output above"
            fi
        else
            print_info "Skipping authentication. You can run it later with:"
            echo "  npm run task-auth"
        fi
    else
        print_info "To authenticate all services at once:"
        echo "  npm run task-auth"
    fi
    
    echo ""
    print_info "Or authenticate individually:"
    if [[ "$NEEDS_GH_AUTH" = true ]]; then
        echo "  gh auth login                            # GitHub"
    fi
    if [[ "$NEEDS_VERCEL_AUTH" = true ]] || [[ "$NEEDS_ENV_SETUP" = true ]]; then
        echo "  vercel login                             # Vercel"
        echo "  vercel link                              # Link project"
        echo "  vercel env pull .env.development.local   # Environment variables"
    fi
    if [[ "$NEEDS_NEON_AUTH" = true ]]; then
        echo "  neonctl auth                             # Neon database"
    fi
    echo ""
else
    print_success "All services are authenticated and ready!"
    echo ""
    print_info "You can start developing:"
    echo "  npm run dev          # Start development server"
    echo "  npm run db:studio    # Open database admin"
    echo "  npm run task-check-prerequisites  # Verify setup anytime"
    echo ""
fi

# Run final check
print_info "Running final verification..."
npm run task-check-prerequisites

FINAL_CHECK_CODE=$?
echo ""

if [[ $FINAL_CHECK_CODE -eq 0 ]]; then
    print_success "🎉 Everything is ready! Happy coding!"
elif [[ "$AUTH_NEEDED" = true ]]; then
    print_info "🔐 Tools installed successfully! Run 'npm run task-auth' to complete setup."
else
    print_warning "Some issues remain - check the output above"
fi