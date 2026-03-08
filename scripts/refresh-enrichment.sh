#!/bin/bash
# Helper script to run full-scale data enrichment

echo "🚀 Launching College Pathway Data Enrichment..."
echo "Mode: Production Scale"
echo "Rate Limit: 60 req/min (with 1.1s buffer)"

# Run the script
node scripts/enrich-external-data.js "$@"
