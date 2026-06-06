#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if ! command -v node &>/dev/null; then
  echo "Error: node not found. Install Node.js first."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Note: .env not found. Copy .env.example to .env and add VITE_ANTHROPIC_API_KEY to enable AI features."
fi

echo "Starting Marian Apparitions at http://localhost:5173"
npm run dev
