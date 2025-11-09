#!/bin/bash

# Setup script for OpenCode Meta-Log Plugin integration
# This script builds and links the meta-log-plugin to work with OpenCode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR/plugin/meta-log-plugin"
OPENCODE_DIR="$SCRIPT_DIR/.opencode"
META_LOG_DB_DIR="$SCRIPT_DIR/meta-log-db"

echo "🔧 Setting up OpenCode Meta-Log Plugin integration..."
echo ""

# Step 1: Check if meta-log-db exists and is linked
echo "📦 Step 1: Checking meta-log-db..."
if [ ! -d "$META_LOG_DB_DIR" ]; then
    echo "⚠️  Warning: meta-log-db directory not found at $META_LOG_DB_DIR"
    echo "   The plugin may not work correctly without meta-log-db"
    echo "   See: docs/06-Meta-Log-Adapters/01-Meta-Log-Db/SETUP_GUIDE.md"
else
    echo "✅ meta-log-db directory found"
    
    # Check if meta-log-db is built
    if [ ! -d "$META_LOG_DB_DIR/dist" ]; then
        echo "📦 Building meta-log-db..."
        cd "$META_LOG_DB_DIR"
        npm run build || echo "⚠️  Warning: meta-log-db build failed, but continuing..."
        cd "$SCRIPT_DIR"
    fi
    
    # Link meta-log-db
    echo "🔗 Linking meta-log-db..."
    cd "$META_LOG_DB_DIR"
    npm link || echo "⚠️  Warning: meta-log-db link failed, but continuing..."
    cd "$SCRIPT_DIR"
fi

# Step 2: Link meta-log-db to plugin
if [ -d "$META_LOG_DB_DIR" ]; then
    echo "🔗 Linking meta-log-db to meta-log-plugin..."
    cd "$PLUGIN_DIR"
    npm link meta-log-db || echo "⚠️  Warning: Could not link meta-log-db to plugin"
    cd "$SCRIPT_DIR"
fi

# Step 3: Build meta-log-plugin
echo ""
echo "📦 Step 2: Building meta-log-plugin..."
cd "$PLUGIN_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the plugin
echo "🔨 Building plugin..."
npm run build || {
    echo "⚠️  Warning: Plugin build failed. This may be due to:"
    echo "   1. Missing meta-log-db dependency"
    echo "   2. TypeScript errors in Obsidian-specific code"
    echo "   The OpenCode adapter should still work if meta-log-db is available"
    echo ""
    echo "   To fix Obsidian-specific errors, you can:"
    echo "   1. Add DOM types: npm install --save-dev @types/node"
    echo "   2. Update tsconfig.json to include DOM lib"
}

cd "$SCRIPT_DIR"

# Step 4: Link plugin to OpenCode
echo ""
echo "🔗 Step 3: Linking meta-log-plugin to OpenCode..."
cd "$PLUGIN_DIR"
npm link || echo "⚠️  Warning: Plugin link failed, but continuing..."
cd "$SCRIPT_DIR"

cd "$OPENCODE_DIR"
npm link meta-log-plugin || echo "⚠️  Warning: Could not link plugin to OpenCode directory"
cd "$SCRIPT_DIR"

# Step 5: Verify installation
echo ""
echo "✅ Step 4: Verifying installation..."
echo ""

# Check if plugin dist exists
if [ -d "$PLUGIN_DIR/dist" ]; then
    echo "✅ Plugin built successfully"
    if [ -f "$PLUGIN_DIR/dist/opencode.js" ]; then
        echo "✅ OpenCode entry point found"
    elif [ -f "$PLUGIN_DIR/dist/adapters/opencode.js" ]; then
        echo "✅ OpenCode adapter found"
    else
        echo "⚠️  Warning: OpenCode adapter not found in dist/"
    fi
else
    echo "⚠️  Warning: Plugin dist/ directory not found"
fi

# Check if linked
if [ -L "$OPENCODE_DIR/node_modules/meta-log-plugin" ]; then
    echo "✅ Plugin linked to OpenCode"
else
    echo "⚠️  Warning: Plugin not linked to OpenCode"
    echo "   Run: cd .opencode && npm link meta-log-plugin"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. The meta-log tool is available in .opencode/tool/meta-log.ts"
echo "   2. Use it with queries like:"
echo "      - ProLog: queryType='prolog', query='your query here'"
echo "      - DataLog: queryType='datalog', query='your query here'"
echo "      - SPARQL: queryType='sparql', query='your query here'"
echo "      - Load canvas: queryType='load', canvasPath='./automaton-kernel.jsonl'"
echo ""
echo "📚 Documentation:"
echo "   - Plugin: plugin/meta-log-plugin/README.md"
echo "   - Setup: plugin/meta-log-plugin/LINKING_SETUP.md"
echo "   - OpenCode integration: .opencode/README.md"
