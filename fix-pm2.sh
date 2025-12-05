#!/bin/bash
# Force cleanup PM2 stuck processes - comprehensive fix

set -e

echo "🔧 PM2 Force Cleanup Script"
echo "============================"
echo ""

# Step 1: Try graceful stop first
echo "1️⃣  Attempting graceful stop..."
pm2 stop all --force 2>/dev/null || echo "   (No processes to stop)"

# Step 2: Delete all processes
echo "2️⃣  Deleting all PM2 processes..."
pm2 delete all --force 2>/dev/null || echo "   (No processes to delete)"

# Step 3: Kill PM2 daemon
echo "3️⃣  Killing PM2 daemon..."
pm2 kill 2>/dev/null || echo "   (Daemon already stopped)"

# Step 4: Kill any stuck Node/Next.js processes
echo "4️⃣  Killing any remaining Node processes..."
pkill -9 -f "node.*next" 2>/dev/null || echo "   (No Node processes found)"
pkill -9 -f "pm2" 2>/dev/null || echo "   (No PM2 processes found)"

# Step 5: Remove lock files and stale data
echo "5️⃣  Cleaning PM2 lock files and stale data..."
rm -f ~/.pm2/*.lock 2>/dev/null || true
rm -f ~/.pm2/pids/* 2>/dev/null || true
rm -rf ~/.pm2/.sock 2>/dev/null || true

# Step 6: Wait a moment for cleanup
echo "6️⃣  Waiting for cleanup to complete..."
sleep 2

# Step 7: Flush logs
echo "7️⃣  Flushing PM2 logs..."
pm2 flush 2>/dev/null || echo "   (PM2 not running, skipping flush)"

# Step 8: Verify cleanup
echo "8️⃣  Verifying cleanup..."
if pgrep -f "pm2" > /dev/null; then
    echo "   ⚠️  Warning: Some PM2 processes still running"
    echo "   Run: pkill -9 -f pm2"
else
    echo "   ✓ All PM2 processes stopped"
fi

echo ""
echo "============================"
echo "✅ Cleanup complete!"
echo ""
echo "You can now restart PM2 with:"
echo "  npm run pm2:dev      (development)"
echo "  npm run pm2:start    (production)"
echo ""
