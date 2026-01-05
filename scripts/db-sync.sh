#!/bin/bash
# File: scripts/db-sync.sh

# Script to handle database migration/push in prebuild
# Tries db:migrate first, falls back to db:push if migrate fails

set +e  # Don't exit on error, we'll handle it

echo "🔄 Attempting to apply database migrations..."

# Try to run migrations
npm run db:migrate
MIGRATE_EXIT_CODE=$?

if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
  echo "✅ Database migrations applied successfully"
  exit 0
else
  echo "⚠️  Migration failed (exit code: $MIGRATE_EXIT_CODE)"
  
  # Check if the error is about tables already existing
  # If so, try to mark migrations as applied first
  if npm run db:mark-applied 2>/dev/null; then
    echo "✅ Marked existing migrations as applied"
    echo "🔄 Retrying db:migrate..."
    if npm run db:migrate; then
      echo "✅ Database migrations applied successfully after marking"
      exit 0
    fi
  fi
  
  # Fall back to db:push
  echo "⚠️  Falling back to db:push..."
  npm run db:push
  PUSH_EXIT_CODE=$?
  
  if [ $PUSH_EXIT_CODE -eq 0 ]; then
    echo "✅ Database schema synced via db:push"
    exit 0
  else
    echo "❌ Both db:migrate and db:push failed"
    exit 1
  fi
fi
