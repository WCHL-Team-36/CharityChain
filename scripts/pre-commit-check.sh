#!/bin/bash

# Pre-commit security check for CharityChain
echo "🔒 Running pre-commit security checks..."

# Check for sensitive data patterns
echo "📋 Checking for sensitive data..."
if grep -r -i "password\|secret\|api_key\|private_key" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules src/; then
    echo "❌ Found potential sensitive data! Please review and remove."
    exit 1
fi

# Check for hardcoded canister IDs that should use env vars
echo "📋 Checking for hardcoded canister IDs..."
if grep -r "cai'" --include="*.ts" --include="*.tsx" src/ | grep -v "process.env" | grep -v "||"; then
    echo "⚠️  Found hardcoded canister IDs. Consider using environment variables."
fi

# Check for .env files being committed
echo "📋 Checking for .env files..."
if git diff --cached --name-only | grep -E "\.env$"; then
    echo "❌ .env file should not be committed! Use .env.example instead."
    exit 1
fi

# Check for debug console.log that should be removed
echo "📋 Checking for debug logs..."
debug_count=$(grep -r "console.log\|console.error\|console.warn" --include="*.ts" --include="*.tsx" src/ | wc -l)
if [ "$debug_count" -gt 50 ]; then
    echo "⚠️  High number of console logs ($debug_count). Consider removing debug logs."
fi

echo "✅ Security checks passed!"
echo "🚀 Ready to commit!"
