#!/bin/bash

# Production Build Script for Automaton UI
# This script creates an optimized production build

echo "🚀 Starting Production Build..."

# Navigate to UI directory
cd "$(dirname "$0")/ui"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production=false
fi

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

# Run linting
echo "🧹 Running ESLint..."
npm run lint

# Create production build
echo "🏗️  Building production version..."
npm run build

# Create build info
echo "📋 Creating build information..."
cat > dist/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(npm pkg get version | tr -d '"')",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Optimize bundle size
echo "📊 Analyzing bundle size..."
npx vite-bundle-analyzer dist/static/js/*.js --mode json --output dist/bundle-analysis.json 2>/dev/null || echo "Bundle analysis skipped"

# Create compressed versions
echo "🗜️  Creating compressed versions..."
find dist -name "*.js" -o -name "*.css" -o -name "*.html" | while read file; do
    gzip -c "$file" > "$file.gz"
    brotli -c "$file" > "$file.br" 2>/dev/null || echo "Brotli compression skipped for $file"
done

# Generate service worker for PWA
echo "📱 Generating service worker..."
cat > dist/sw.js << 'EOF'
const CACHE_NAME = 'automaton-ui-v1';
const urlsToCache = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
EOF

# Create PWA manifest
echo "📱 Creating PWA manifest..."
cat > dist/manifest.json << EOF
{
  "name": "Self-Referencing Automaton Interface",
  "short_name": "Automaton UI",
  "description": "Advanced interface for 8-dimensional Church encoding automaton",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
tar -czf ../automaton-ui-build.tar.gz .
cd ..

echo "✅ Production build completed successfully!"
echo "📁 Build artifacts:"
echo "   - ui/dist/ (production build)"
echo "   - ui/automaton-ui-build.tar.gz (deployment package)"
echo ""
echo "🚀 To deploy:"
echo "   1. Copy ui/dist/* to your web server"
echo "   2. Ensure backend API is accessible"
echo "   3. Configure API endpoint if needed"
echo ""
echo "📊 Build size:"
du -sh ui/dist/
echo ""
echo "🔍 For detailed analysis, check:"
echo "   - ui/dist/bundle-analysis.json"
echo "   - ui/dist/build-info.json"