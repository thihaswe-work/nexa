#!/bin/bash
set -euo pipefail

echo "🚀 Setting up Nexa development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment files
echo "🔧 Setting up environment files..."
for envfile in ".env" "apps/api/.env" "apps/admin/.env"; do
  if [ ! -f "$envfile" ]; then
    cp "${envfile}.example" "$envfile"
    echo "   Created $envfile from example"
  else
    echo "   $envfile already exists, skipping"
  fi
done

# Start infrastructure
echo "🐳 Starting Docker services..."
npm run docker:dev

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run database migrations: cd apps/api && npm run migration:run"
echo "  2. Start development: npm run dev"
echo "  3. Open admin at http://localhost:3000"
echo "  4. Open API docs at http://localhost:4000/docs"
