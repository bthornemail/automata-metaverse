#!/bin/bash

# Automaton UI Development Server Launcher

echo "🚀 Starting Automaton UI Development Environment"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "automaton.jsonl" ]; then
    echo "❌ automaton.jsonl not found. Please run from the automaton directory."
    exit 1
fi

# Install UI dependencies if needed
if [ ! -d "ui/node_modules" ]; then
    echo "📦 Installing UI dependencies..."
    cd ui
    npm install
    cd ..
fi

# Install server dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install socket.io tsx
fi

# Start the backend server
echo "🔌 Starting backend server..."
tsx ui-server.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start the UI development server
echo "🎨 Starting UI development server..."
cd ui
npm run dev &
UI_PID=$!

echo ""
echo "✅ Development environment started!"
echo "🌐 UI: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8080"
echo "📡 WebSocket: ws://localhost:8081"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $UI_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait