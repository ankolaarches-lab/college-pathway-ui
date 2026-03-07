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

# Step 1: Full sync from College Scorecard API to Supabase
echo "📥 Step 1: Fetching ALL institutions from College Scorecard API and syncing to Supabase..."
node scripts/sync-all-institutions.js

# Step 2: Full sync of program data
echo "\n📥 Step 2: Fetching program and major data from College Scorecard API..."
node scripts/sync-programs.js

echo "\n✅ Refresh complete!"
echo "\nTo set up automatic weekly refresh, add this to your crontab:"
echo "   crontab -e"
echo "   # Add line:"
echo "   0 2 * * 0 cd /path/to/college-pathway-explorer && ./scripts/refresh-data.sh"
