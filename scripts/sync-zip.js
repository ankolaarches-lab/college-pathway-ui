const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx).trim();
                const value = trimmed.slice(eqIdx + 1).trim();
                process.env[key] = value;
            }
        }
    }
}

const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function syncZipCodes() {
    console.log('🚀 Syncing ALL ZIP codes...');

    let page = 0;
    let hasMore = true;
    let totalUpdated = 0;
    const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

    while (hasMore) {
        const url = `${BASE_URL}?api_key=${API_KEY}&fields=id,school.zip&per_page=20&page=${page}`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`\n❌ Page ${page} failed: ${res.status}. Retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                // Try once more or skip
                const res2 = await fetch(url);
                if (!res2.ok) {
                    console.log(`Skipping page ${page}`);
                    page++;
                    continue;
                }
            }

            const data = await res.json();
            if (!data.results || data.results.length === 0) {
                hasMore = false;
                break;
            }

            const updates = data.results
                .filter(r => r['school.zip'])
                .map(r => ({
                    id: r.id,
                    zip: String(r['school.zip']).substring(0, 5)
                }));

            if (updates.length > 0) {
                await supabase.from('institutions').upsert(updates, { onConflict: 'id' });
                totalUpdated += updates.length;
            }

            const total = data.metadata.total;
            const totalPages = Math.ceil(total / 20);
            process.stdout.write(`\r   Progress: Page ${page + 1}/${totalPages} — Updated ${totalUpdated} ZIP codes`);

            page++;
            await new Promise(r => setTimeout(r, 100));
        } catch (err) {
            console.error('\n❌ Error:', err.message);
            hasMore = false;
        }
    }
    console.log(`\n✅ ZIP code sync complete! Total: ${totalUpdated}`);
}

syncZipCodes();
