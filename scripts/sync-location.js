#!/usr/bin/env node
/**
 * College Location Sync Script
 * Paginates through the College Scorecard API to fetch latitude and longitude
 * for all institutions, then updates the Supabase `institutions` table.
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx);
                const value = trimmed.slice(eqIdx + 1);
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    }
}

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) {
    console.error('❌ COLLEGE_SCORECARD_API_KEY is not set in .env.local');
    process.exit(1);
}

if (!SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
    process.exit(1);
}

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';

const FIELDS = [
    'id',
    'location.lat',
    'location.lon'
].join(',');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPageWithRetry(page, retries = 3) {
    const url = `${BASE_URL}?api_key=${API_KEY}&fields=${FIELDS}&per_page=100&page=${page}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            if (attempt === retries) {
                throw err;
            }
            console.log(`\n  ⚠️ Attempt ${attempt} failed for page ${page}. Retrying in ${attempt * 2}s...`);
            await sleep(attempt * 2000);
        }
    }
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  College Pathway — Location Coordinates Sync        ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    let page = 0;
    let totalSaved = 0;
    let totalErrors = 0;
    let hasMore = true;

    console.log(`📡 Fetching location data from College Scorecard API...\n`);

    while (hasMore) {
        try {
            const data = await fetchPageWithRetry(page);
            const results = data.results;

            if (!results || results.length === 0) {
                hasMore = false;
                break;
            }

            // Prepare upsert batch
            const batch = results
                .filter(r => r.id && r['location.lat'] && r['location.lon'])
                .map(r => ({
                    id: r.id,
                    latitude: r['location.lat'],
                    longitude: r['location.lon']
                }));

            if (batch.length > 0) {
                // We use an update loop so we don't accidentally overwrite missing row data
                // For performance, doing it this way is okay for a one-off sync script
                let batchSuccess = 0;

                for (const update of batch) {
                    const { error } = await supabase
                        .from('institutions')
                        .update({
                            latitude: update.latitude,
                            longitude: update.longitude
                        })
                        .eq('id', update.id);

                    if (!error) batchSuccess++;
                }
                totalSaved += batchSuccess;
            }

            const totalItems = data.metadata.total;
            const totalPages = Math.ceil(totalItems / 100);
            const percent = Math.min((page + 1) / totalPages * 100, 100).toFixed(1);

            process.stdout.write(`\r   Page ${page + 1}/${totalPages} — Updated ${totalSaved} coordinates (${percent}%)`);

            page++;

            // Be nice to the API
            await sleep(100);

        } catch (err) {
            console.error(`\n❌ Error fetching page ${page}:`, err.message);
            totalErrors++;
            hasMore = false; // abort on fatal error
        }
    }

    console.log('\n\n✅ Sync complete!');
    console.log(`   Updated: ${totalSaved} institutions`);
    if (totalErrors > 0) console.log(`   Errors:  ${totalErrors}`);
}

main().catch(console.error);
