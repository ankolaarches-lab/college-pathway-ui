#!/usr/bin/env node
/**
 * Campus Safety Sync Script (Excel variant)
 * Reads the Campus Safety and Security (CSS) Excel data from the US Department of Education
 * and updates the `crime_stats` column in the Supabase `institutions` table.
 * 
 * Usage: node scripts/sync-crime.js path/to/Crime2024EXCEL
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set.');
    process.exit(1);
}

const dataDir = process.argv[2];
if (!dataDir || !fs.existsSync(dataDir)) {
    console.error('❌ Please provide a valid path to the Crime2024EXCEL directory.');
    console.log('Usage: node scripts/sync-crime.js path/to/Crime2024EXCEL');
    process.exit(1);
}

const onCampusCrimeFile = path.join(dataDir, 'Oncampuscrime212223.xls');
if (!fs.existsSync(onCampusCrimeFile)) {
    console.error(`❌ Could not find ${onCampusCrimeFile} in the provided directory.`);
    process.exit(1);
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  College Pathway — Campus Safety Sync (Excel)       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log(`📡 Parsing Excel file: ${onCampusCrimeFile}...`);
    const workbook = XLSX.readFile(onCampusCrimeFile);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // A map of UNITID to aggregated crime stats
    const safetyData = new Map();

    for (const row of data) {
        if (!row.UNITID_P) continue;

        // UNITID_P is typically 9 digits where the first 6 are the main UNITID
        const unitid = String(row.UNITID_P).substring(0, 6);

        // Standard CSS columns for latest year (23, fallback to 22/21)
        let parsedStats = {
            murder: (parseInt(row.MURD23) || parseInt(row.MURD22) || parseInt(row.MURD21)) || 0,
            rape: (parseInt(row.RAPE23) || parseInt(row.RAPE22) || parseInt(row.RAPE21)) || 0,
            robbery: (parseInt(row.ROBBE23) || parseInt(row.ROBBE22) || parseInt(row.ROBBE21)) || 0,
            aggravated_assault: (parseInt(row.AGG_A23) || parseInt(row.AGG_A22) || parseInt(row.AGG_A21)) || 0,
            burglary: (parseInt(row.BURGLA23) || parseInt(row.BURGLA22) || parseInt(row.BURGLA21)) || 0,
            motor_vehicle_theft: (parseInt(row.VEHIC23) || parseInt(row.VEHIC22) || parseInt(row.VEHIC21)) || 0,
            arson: (parseInt(row.ARSON23) || parseInt(row.ARSON22) || parseInt(row.ARSON21)) || 0
        };

        if (safetyData.has(unitid)) {
            const existing = safetyData.get(unitid);
            for (const key in parsedStats) {
                existing[key] += parsedStats[key];
            }
        } else {
            safetyData.set(unitid, parsedStats);
        }
    }

    console.log(`✅ Parsed safety data for ${safetyData.size} distinct institutions.`);
    console.log('📤 Upserting to Supabase (this may take a minute)...\n');

    let successCount = 0;

    // Get all institutions from our DB first to only update matching ids
    const { data: dbInstitutions, error: fetchErr } = await supabase
        .from('institutions')
        .select('id');

    if (fetchErr) {
        console.error('Failed to fetch institutions from DB:', fetchErr);
        process.exit(1);
    }

    const validIds = new Set(dbInstitutions.map(i => i.id.toString()));

    // Batch process
    const BATCH_SIZE = 100;
    const validEntries = Array.from(safetyData.entries()).filter(([uid]) => validIds.has(uid));

    console.log(`Matched ${validEntries.length} institutions in our database.`);

    for (let i = 0; i < validEntries.length; i += BATCH_SIZE) {
        const batch = validEntries.slice(i, i + BATCH_SIZE);

        // Process sequentially but batch DB calls conceptually? Supabase doesn't have a bulk update RPC by default unless defined.
        // We'll just do parallel Promises for the batch
        const updates = batch.map(([unitid, stats]) => {
            stats.total_incidents = Object.values(stats).reduce((a, b) => a + b, 0);
            return supabase
                .from('institutions')
                .update({ crime_stats: stats })
                .eq('id', unitid);
        });

        const results = await Promise.all(updates);
        const successful = results.filter(r => !r.error).length;
        successCount += successful;

        process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, validEntries.length)} / ${validEntries.length}`);
    }

    console.log(`\n\n✅ Successfully updated crime_stats for ${successCount} institutions.`);
}

main().catch(console.error);
