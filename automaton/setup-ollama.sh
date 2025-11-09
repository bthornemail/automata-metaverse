#!/bin/bash

echo "🤖 Setting up Ollama for Self-Referencing Automaton"
echo "=================================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✅ Ollama installed successfully"
    else
        echo "❌ Failed to install Ollama"
        exit 1
    fi
else
    echo "✅ Ollama is already installed"
fi

# Check if Ollama service is running
if ! pgrep -f "ollama serve" > /dev/null; then
    echo "🚀 Starting Ollama service..."
    ollama serve &
    sleep 3
else
    echo "✅ Ollama service is running"
fi

# Pull recommended models
echo "📥 Pulling Ollama models..."

models=("llama3.2" "qwen2.5:3b" "phi3" "gemma2:2b")

for model in "${models[@]}"; do
    echo "📦 Pulling $model..."
    ollama pull "$model"
    
    if [ $? -eq 0 ]; then
        echo "✅ $model pulled successfully"
    else
        echo "⚠️ Failed to pull $model (will try smaller model)"
    fi
done

echo ""
echo "🎯 Setup Complete!"
echo ""
echo "Usage examples:"
echo "  # Run with llama3.2 (default)"
echo "  npx tsx ollama-automaton.ts"
echo ""
echo "  # Run with qwen2.5:3b and 5 second interval"
echo "  npx tsx ollama-automaton.ts qwen2.5:3b 5000"
echo ""
echo "  # Run for 50 iterations only"
echo "  npx tsx ollama-automaton.ts llama3.2 2000 50"
echo ""
echo "  # Run with smallest model for resource efficiency"
echo "  npx tsx ollama-automaton.ts gemma2:2b 1000"

# Test Ollama
echo ""
echo "🧪 Testing Ollama..."
echo "test" | ollama run llama3.2 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Ollama is working correctly"
else
    echo "❌ Ollama test failed"
    echo "Please check Ollama installation: ollama --version"
fi