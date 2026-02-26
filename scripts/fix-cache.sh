#!/bin/bash

# Fix webpack cache issues
echo "🔧 Fixing webpack cache issues..."

# Kill any running Next.js processes
echo "🛑 Stopping any running Next.js processes..."
pkill -f "next" || true

# Clear Next.js cache
echo "🗑️  Clearing Next.js cache..."
rm -rf .next/cache
rm -rf .next/server
rm -rf .next/static
rm -rf .next/trace

# Clear webpack cache specifically
echo "🗑️  Clearing webpack cache..."
rm -rf .next/cache/webpack

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies if needed
if [ "$1" = "--reinstall" ]; then
    echo "📦 Reinstalling dependencies..."
    rm -rf node_modules package-lock.json
    npm install --legacy-peer-deps
fi

echo "✅ Cache cleanup complete!"
echo "🚀 You can now run: npm run dev"
