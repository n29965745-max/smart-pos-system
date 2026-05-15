#!/bin/bash

# SnatchFit Boutique - Quick Deployment Script
# This script helps you deploy to Vercel

echo "================================"
echo "SnatchFit Boutique Deployment"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - production ready"
else
    echo "Git repository already initialized"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "You have uncommitted changes. Committing..."
    git add .
    git commit -m "Pre-deployment commit"
fi

echo ""
echo "================================"
echo "Deployment Steps:"
echo "================================"
echo ""
echo "1. PUSH TO GITHUB"
echo "   Run: git push origin main"
echo ""
echo "2. DEPLOY TO VERCEL"
echo "   a. Go to https://vercel.com/dashboard"
echo "   b. Click 'New Project'"
echo "   c. Select your GitHub repository"
echo "   d. Click 'Import'"
echo ""
echo "3. ADD ENVIRONMENT VARIABLES"
echo "   In Vercel Settings → Environment Variables, add:"
echo ""
echo "   MONGODB_URI=your_mongodb_connection_string"
echo "   JWT_SECRET=REDACTED
echo "   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx"
echo "   STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST"
echo "   NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min"
echo "   NEXTAUTH_URL=https://your-domain.vercel.app"
echo "   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app"
echo "   NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com"
echo "   NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_password"
echo "   NODE_ENV=production"
echo ""
echo "4. DEPLOY"
echo "   Click 'Deploy' on Vercel"
echo ""
echo "5. TEST"
echo "   Visit your Vercel URL and test all features"
echo ""
echo "================================"
echo "Documentation:"
echo "================================"
echo ""
echo "- SETUP_ACCOUNTS.md - Account setup guide"
echo "- ENVIRONMENT_VARIABLES.md - Environment variables guide"
echo "- DEPLOYMENT_CHECKLIST_DETAILED.md - Detailed checklist"
echo "- DEPLOY_QUICK_REFERENCE.md - Quick reference"
echo ""
echo "================================"
echo "Ready to deploy! 🚀"
echo "================================"
