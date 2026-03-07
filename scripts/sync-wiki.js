#!/usr/bin/env node
/**
 * Wikipedia College Summary Sync Script
 * Fetches short descriptions for colleges from the Wikipedia API and updates
 * the Supabase 'institutions' table.
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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

// Use the REST API so we don't break if supabase-js isn't installed locally
async function fetchInstitutionsFromDB() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log('📡 Fetching institutions from Supabase that need descriptions...');

    // Only fetch a batch at a time to be nice to Wikipedia
    // and prioritize those without descriptions
    const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .is('description', null)
        .limit(100);

    if (error) {
        throw error;
    }

    return data || [];
}

async function fetchWikipediaSummary(collegeName) {
    // Try to sanitize the name for better search matching
    let searchName = collegeName
        .replace(/ - | -|- /g, ' ')
        .replace(/, .*$/, ''); // remove ", City" suffix if present

    const wUrl = new URL('https://en.wikipedia.org/w/api.php');
    wUrl.searchParams.set('action', 'query');
    wUrl.searchParams.set('format', 'json');
    wUrl.searchParams.set('prop', 'extracts');
    wUrl.searchParams.set('exintro', '1');       // Only the intro paragraph
    wUrl.searchParams.set('explaintext', '1');   // Plain text, no HTML tags
    wUrl.searchParams.set('redirects', '1');     // Follow redirects
    wUrl.searchParams.set('titles', searchName);

    try {
        const res = await fetch(wUrl.toString(), {
            headers: {
                'User-Agent': 'CollegePathwayExplorerBot/1.0 (test@example.com)'
            }
        });

        const data = await res.json();

        // Parse response
        const pages = data.query?.pages;
        if (!pages) return null;

        // API returns pages indexed by a dynamically generated ID
        const pageId = Object.keys(pages)[0];
        if (pageId === '-1') {
            // Not found
            return null;
        }

        const extract = pages[pageId].extract;
        if (!extract || extract.trim().length === 0) return null;
        if (extract.includes('may refer to:')) return null; // Hit a disambiguation page

        // Truncate to first paragraph or ~500 chars to save DB space
        let clean = extract.split('\n')[0];
        if (clean.length > 600) {
            clean = clean.substring(0, 597) + '...';
        }

        return clean;
    } catch (err) {
        console.error(`Skipping ${searchName} due to API error:`, err.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  College Pathway — Wikipedia Sync                   ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    if (DRY_RUN) console.log('🏜️  DRY RUN MODE\n');

    if (!SERVICE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set.');
        process.exit(1);
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const institutions = await fetchInstitutionsFromDB();

    if (institutions.length === 0) {
        console.log('✅ All institutions already have descriptions (or none found in DB).');
        return;
    }

    console.log(`\nWill attempt to fetch Wikipedia summaries for ${institutions.length} colleges.\n`);

    let successCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < institutions.length; i++) {
        const inst = institutions[i];
        process.stdout.write(`Fetching ${i + 1}/${institutions.length} : ${inst.name}...`);

        const summary = await fetchWikipediaSummary(inst.name);

        if (summary) {
            console.log(' ✅ Found');
            successCount++;

            if (!DRY_RUN) {
                // Upsert to DB
                await supabase
                    .from('institutions')
                    .update({ description: summary })
                    .eq('id', inst.id);
            } else if (successCount === 1) {
                console.log(`\n📋 Sample summary:\n${summary}\n`);
            }
        } else {
            console.log(' ❌ Not Found on Wiki');
            notFoundCount++;
        }

        // Rate limits (respect Wikipedia API)
        await sleep(200);
    }

    console.log(`\n✅ Sync complete. Found ${successCount}, Missed ${notFoundCount}.`);
}

main().catch(console.error);
