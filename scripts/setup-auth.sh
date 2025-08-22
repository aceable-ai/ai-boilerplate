#!/bin/bash

# Authentication Setup Script
# Created: 2025-08-22
# Purpose: Handle GitHub CLI and Vercel CLI authentication separately

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

echo "🔐 CLI Authentication Setup"
echo "This will authenticate you with GitHub and Vercel CLIs"
echo ""

# GitHub CLI Authentication
print_section "GitHub CLI Authentication"

if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI not installed. Run 'npm run task-setup-all' first"
    exit 1
fi

if gh auth status &> /dev/null; then
    GH_USER=$(gh api user --jq '.login' 2>/dev/null)
    print_success "Already authenticated with GitHub as: $GH_USER"
else
    print_info "Authenticating with GitHub CLI..."
    echo ""
    print_info "Choose your preferred authentication method:"
    echo "  1. Browser-based (recommended)"
    echo "  2. Token-based"
    echo ""
    
    # Check if running via AI agent slash command
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        echo ""
        echo "AI_REQUEST: Please run the following command in your terminal to authenticate with GitHub:"
        echo "gh auth login"
        echo ""
        print_info "After authentication, re-run: /auth or npm run task-auth"
        exit 0
    else
        if gh auth login; then
            GH_USER=$(gh api user --jq '.login' 2>/dev/null)
            print_success "Successfully authenticated with GitHub as: $GH_USER"
        else
            print_error "GitHub authentication failed"
            exit 1
        fi
    fi
fi

# Vercel CLI Authentication
print_section "Vercel CLI Authentication"

if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not installed. Run 'npm run task-setup-all' first"
    exit 1
fi

if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami 2>/dev/null)
    print_success "Already authenticated with Vercel as: $VERCEL_USER"
else
    print_info "Authenticating with Vercel CLI..."
    echo ""
    
    # Check if running via AI agent slash command
    if [[ -n "$AI_SLASH_COMMAND" ]]; then
        echo ""
        echo "AI_REQUEST: Please run the following command in your terminal to authenticate with Vercel:"
        echo "vercel login"
        echo ""
        print_info "After authentication, re-run: /auth or npm run task-auth"
        exit 0
    else
        if vercel login; then
            VERCEL_USER=$(vercel whoami 2>/dev/null)
            print_success "Successfully authenticated with Vercel as: $VERCEL_USER"
        else
            print_error "Vercel authentication failed"
            exit 1
        fi
    fi
fi

# Project Linking (if not already linked)
print_section "Project Linking"

if [[ ! -f ".vercel/project.json" ]]; then
    print_info "Linking project to Vercel..."
    echo ""
    
    if vercel link; then
        print_success "Project successfully linked to Vercel"
    else
        print_warning "Project linking failed - you may need to do this manually"
    fi
else
    print_success "Project already linked to Vercel"
fi

# Environment Variables
print_section "Environment Variables"

if [[ ! -f ".env.development.local" ]]; then
    print_info "Pulling environment variables from Vercel..."
    
    if vercel env pull .env.development.local; then
        print_success "Environment variables configured"
    else
        print_error "Failed to pull environment variables"
        exit 1
    fi
else
    print_success "Environment variables already configured"
    
    # Ask if they want to refresh
    echo ""
    print_info "Would you like to refresh environment variables from Vercel? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if vercel env pull .env.development.local; then
            print_success "Environment variables refreshed"
        else
            print_warning "Failed to refresh environment variables"
        fi
    fi
fi

# Neon CLI (Optional)
print_section "Neon CLI (Database)"

if command -v neonctl &> /dev/null; then
    if neonctl projects list &> /dev/null; then
        print_success "Neon CLI already authenticated"
    else
        print_info "Would you like to authenticate with Neon CLI for database management? (y/N)"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if neonctl auth; then
                print_success "Neon CLI authenticated"
            else
                print_warning "Neon CLI authentication failed"
            fi
        else
            print_info "Skipping Neon CLI authentication"
        fi
    fi
else
    print_info "Neon CLI not installed (optional)"
    print_info "Install with: npm install -g neonctl"
fi

# Final Summary
print_section "Authentication Complete!"

print_success "All CLI tools are now authenticated!"
echo ""
print_info "You can now:"
echo "  gh pr create              # Create GitHub pull requests"
echo "  vercel                    # Deploy to Vercel"  
echo "  npm run dev               # Start development with full environment"
echo ""

# Run final check
print_info "Running final verification..."
npm run task-check-prerequisites

if [[ $? -eq 0 ]]; then
    echo ""
    print_success "🎉 Everything is set up and authenticated! Ready to code!"
else
    echo ""
    print_warning "Some issues remain - check the output above"
fi