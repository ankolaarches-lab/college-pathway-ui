#!/usr/bin/env node
/**
 * Full College Scorecard Programs Sync Script
 * Paginates through all institutions and fetches their field-of-study (program) data
 * (earnings and debt by major). Upserts the data into the 'programs' Supabase table.
 *
 * Usage:
 *   node scripts/sync-programs.js              # Full sync
 *   node scripts/sync-programs.js --dry-run    # Preview without writing
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

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const DRY_RUN = process.argv.includes('--dry-run');

// According to the data dictionary, credential levels map to:
// 1 = Undergraduate Certificate or Diploma
// 2 = Associate's Degree
// 3 = Bachelor's Degree
// 4 = Post-baccalaureate Certificate
// 5 = Master's Degree
// 6 = Doctoral Degree
// 7 = First Professional Degree
// 8 = Graduate/Professional Certificate
function getCredentialTitle(level) {
    const map = {
        1: 'Undergraduate Certificate',
        2: "Associate's Degree",
        3: "Bachelor's Degree",
        4: 'Post-baccalaureate Certificate',
        5: "Master's Degree",
        6: 'Doctoral Degree',
        7: 'First Professional Degree',
        8: 'Graduate Certificate'
    };
    return map[level] || `Level ${level}`;
}

// ────────────────────────────────────────────────────────────────────
// API Fetching
// ────────────────────────────────────────────────────────────────────

async function fetchAllPrograms() {
    const allPrograms = [];
    let page = 0;
    let totalPages = Infinity;
    let retries = 0;
    const perPage = 100;

    console.log('📡 Fetching program data from College Scorecard API...\n');

    while (page < totalPages) {
        const url = new URL(SCORECARD_API);
        url.searchParams.set('api_key', API_KEY);
        // Fetch institution ID and the nested programs array
        url.searchParams.set('fields', 'id,latest.programs.cip_4_digit');
        url.searchParams.set('per_page', String(perPage));
        url.searchParams.set('page', String(page));
        url.searchParams.set('school.operating', '1');

        try {
            const response = await fetch(url.toString());

            if (!response.ok) {
                const text = await response.text();
                console.error(`\n❌ API error on page ${page}: ${response.status} - ${text.slice(0, 100)}`);

                if (response.status === 429) {
                    console.log('   Rate limited — waiting 5 seconds...');
                    await sleep(5000);
                    continue;
                }

                if (response.status >= 500 && retries < 3) {
                    retries++;
                    const backoff = retries * 2000;
                    console.log(`   Server error — retry ${retries}/3 in ${backoff / 1000}s...`);
                    await sleep(backoff);
                    continue;
                }

                console.log(`   Skipping page ${page} after ${retries} retries`);
                page++;
                retries = 0;
                continue;
            }

            retries = 0;

            const data = await response.json();
            const metadata = data.metadata || {};
            const total = metadata.total || 0;
            totalPages = Math.ceil(total / perPage);

            if (data.results && data.results.length > 0) {
                for (const school of data.results) {
                    const instId = school.id;
                    const programs = school['latest.programs.cip_4_digit'];

                    if (Array.isArray(programs) && programs.length > 0) {
                        for (const p of programs) {
                            // Only save programs that have some meaningful outcome data
                            const earnings = p.earnings?.highest?.['3_yr']?.overall_median_earnings
                                || p.earnings?.['1_yr']?.overall_median_earnings;
                            const debt = p.debt?.median_debt;

                            if (earnings || debt) {
                                allPrograms.push({
                                    institution_id: instId,
                                    cip_code: p.code,
                                    title: p.title,
                                    credential_level: p.credential?.level,
                                    credential_title: getCredentialTitle(p.credential?.level),
                                    median_earnings: earnings || null,
                                    median_debt: debt || null
                                });
                            }
                        }
                    }
                }
            }

            const pct = total > 0 ? (((page + 1) / totalPages) * 100).toFixed(1) : '?';
            process.stdout.write(`\r   Page ${page + 1}/${totalPages} — Extracted ${allPrograms.length} programs (${pct}%)`);

            page++;
            await sleep(150);

        } catch (error) {
            console.error(`\n❌ Network error on page ${page}:`, error.message);
            await sleep(2000);
        }
    }

    console.log(`\n\n✅ Extracted ${allPrograms.length} programs with outcome data\n`);
    return allPrograms;
}

// ────────────────────────────────────────────────────────────────────
// Supabase Upload
// ────────────────────────────────────────────────────────────────────

async function upsertToSupabase(programs) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const batchSize = 500; // Can batch higher for simple rows
    let totalUpserted = 0;
    let totalErrors = 0;

    console.log(`📤 Upserting ${programs.length} programs to Supabase...\n`);

    for (let i = 0; i < programs.length; i += batchSize) {
        const batch = programs.slice(i, i + batchSize);

        // Using upsert with unique constraint on (institution_id, cip_code, credential_level)
        const { error } = await supabase
            .from('programs')
            .upsert(batch, {
                onConflict: 'institution_id,cip_code,credential_level',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`\n   ❌ Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
            totalErrors += batch.length;
        } else {
            totalUpserted += batch.length;
        }

        const pct = ((i + batch.length) / programs.length * 100).toFixed(1);
        process.stdout.write(`\r   Upserted ${i + batch.length}/${programs.length} (${pct}%)`);

        await sleep(50);
    }

    console.log('\n');
    return { totalUpserted, totalErrors };
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  College Pathway — Program & Major Sync             ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) {
        console.log('🏜️  DRY RUN MODE — no data will be written to Supabase\n');
    }

    // Validate env
    if (!API_KEY) {
        console.error('❌ COLLEGE_SCORECARD_API_KEY is not set.');
        process.exit(1);
    }
    if (!SERVICE_KEY && !DRY_RUN) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set.');
        process.exit(1);
    }

    // Step 1: Fetch
    const programs = await fetchAllPrograms();

    if (programs.length === 0) {
        console.error('❌ No programs found. API response may have changed.');
        process.exit(1);
    }

    // Step 2: Show sample
    const sample = programs[0];
    console.log('📋 Sample program:');
    console.log(`   Inst ID:    ${sample.institution_id}`);
    console.log(`   CIP Code:   ${sample.cip_code}`);
    console.log(`   Title:      ${sample.title}`);
    console.log(`   Level:      ${sample.credential_title} (${sample.credential_level})`);
    console.log(`   Earnings:   $${sample.median_earnings ?? 'N/A'}`);
    console.log(`   Debt:       $${sample.median_debt ?? 'N/A'}\n`);

    if (DRY_RUN) {
        console.log('🏜️  Dry run complete. Would have upserted', programs.length, 'programs.');
        return;
    }

    // Step 3: Upsert
    const { totalUpserted, totalErrors } = await upsertToSupabase(programs);

    // Step 4: Verify
    console.log('📊 Results:');
    console.log(`   ✅ Upserted: ${totalUpserted}`);
    console.log(`   ❌ Errors:   ${totalErrors}`);

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
        const { count } = await supabase
            .from('programs')
            .select('*', { count: 'exact', head: true });
        console.log(`   📦 Total programs in Supabase: ${count}`);
    } catch (e) {
        // skip
    }

    console.log('\n✅ Sync complete!');
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
