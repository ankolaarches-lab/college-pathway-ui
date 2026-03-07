#!/bin/bash
# College Data Weekly Refresh Script
# Run this to sync the latest data from College Scorecard API to Supabase
#
# Usage:
#   ./scripts/refresh-data.sh
#
# Or with environment variables:
#   SUPABASE_SERVICE_ROLE_KEY=your_key ./scripts/refresh-data.sh
#
# For cron (weekly on Sunday at 2am):
#   0 2 * * 0 cd /path/to/college-pathway-explorer && ./scripts/refresh-data.sh

set -e

echo "🏫 College Data Refresh"
echo "=======================\n"

# Check for required tools
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    exit 1
fi

# Check for Supabase service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set in environment"
    echo "   Please provide your Supabase service role key:"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_key ./scripts/refresh-data.sh"
    exit 1
fi

# Step 1: Pull latest data from College Scorecard API
echo "📥 Step 1: Fetching latest data from College Scorecard API..."
echo "   (Skipping - using existing normalized data. Run scorecard_sync skill for fresh data)\n"

# Step 2: Sync to Supabase
echo "📤 Step 2: Syncing to Supabase..."
node scripts/sync-to-supabase.js

echo "\n✅ Refresh complete!"
echo "\nTo set up automatic weekly refresh, add this to your crontab:"
echo "   crontab -e"
echo "   # Add line:"
echo "   0 2 * * 0 SUPABASE_SERVICE_ROLE_KEY=your_key /path/to/node /path/to/college-pathway-explorer/scripts/sync-to-supabase.js"
