#!/bin/bash
# Script to handle database migration/push in prebuild
# Tries db:migrate first, falls back to db:push if migrate fails

set -e

echo "🔄 Attempting to apply database migrations..."

if npm run db:migrate; then
  echo "✅ Database migrations applied successfully"
  exit 0
else
  echo "⚠️  Migration failed, falling back to db:push..."
  npm run db:push
  echo "✅ Database schema synced via db:push"
  exit 0
fi

