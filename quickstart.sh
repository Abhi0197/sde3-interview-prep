#!/bin/bash
# SDE 3 Interview Prep - Quick Start Script

cd /Users/abhishek/project/Study_Buddy/sde3-interview-prep

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 SDE 3 INTERVIEW PREP - ONE STOP SHOP 🚀                  ║"
echo "║  Your Complete Interview Preparation Platform                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is already running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use!"
    echo ""
    echo "Choose an action:"
    echo "1) Kill existing process and start fresh"
    echo "2) Use a different port (3001)"
    echo "3) Exit"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "Killing process on port 3000..."
            lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
            sleep 1
            ;;
        2)
            echo "Starting on port 3001..."
            PORT=3001 npm start
            exit $?
            ;;
        3)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
fi

echo "📦 Starting SDE 3 Interview Prep Server..."
echo ""

npm start
