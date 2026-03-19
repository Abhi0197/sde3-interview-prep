#!/bin/bash

# SDE 3 Interview Prep - Setup Script
# This script will install dependencies and get your app ready to run

echo "🚀 SDE 3 Interview Prep - Setup Script"
echo "========================================\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)\n"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed!\n"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript build had issues, but app may still run"
fi

echo "\n✓ Setup complete!\n"
echo "=========================================="
echo "📚 SDE 3 Interview Prep is Ready!"
echo "=========================================="
echo "\nTo start the server, run:"
echo "  npm start"
echo "\nThen open:"
echo "  http://localhost:3000"
echo "\n=========================================="
echo "\n📖 Quick Tips:"
echo "  • Start with DSA fundamentals"
echo "  • Follow the Recommended Learning Path"
echo "  • Mark topics as you complete them"
echo "  • Search for specific concepts"
echo "  • Use favorites for quick access"
echo "\nGood luck! 🎯\n"
