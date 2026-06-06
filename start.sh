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

if [ ! -f .env ]; then
  echo "Error: .env not found."
  echo "Copy .env.example to .env and set ANTHROPIC_API_KEY, APP_PASSWORD, and SESSION_SECRET."
  exit 1
fi

echo "Building the app..."
npm run build

echo ""
echo "Starting the secure LAN server (HTTPS, password-protected)."
echo "Visitors on your network sign in with the shared APP_PASSWORD."
echo ""
npm run server
