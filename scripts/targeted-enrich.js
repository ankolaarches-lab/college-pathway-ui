/**
 * Targeted Data Enrichment Script
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const HUD_API_KEY = env.HUD_API_KEY;
const FBI_API_KEY = env.FBI_API_KEY;

const colleges = [
    { id: 100858, name: 'Auburn University', city: 'Auburn', state: 'AL', zip: '36849' },
    { id: 101514, name: 'University of Alabama at Birmingham', city: 'Birmingham', state: 'AL', zip: '35233' },
    { id: 158333, name: 'Central Michigan University', city: 'Mount Pleasant', state: 'MI', zip: '48859' },
    { id: 207388, name: 'Louisiana State University', city: 'Baton Rouge', state: 'LA', zip: '70803' },
    { id: 110635, name: 'University of California-Berkeley', city: 'Berkeley', state: 'CA', zip: '94720' }
];

async function enrich() {
    console.log('🚀 Final Targeted Enrichment...');

    for (const c of colleges) {
        console.log(`\nProcessing ${c.name}...`);

        let housing = {};
        try {
            const url = `https://www.huduser.gov/hudapi/public/fmr/data/${c.zip}?year=2024`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${HUD_API_KEY}` } });
            if (res.ok) {
                const data = await res.json();
                if (data.data?.basicdata) {
                    const d = data.data.basicdata;
                    housing = { br0: d.studio, br1: d.one_bedroom, br2: d.two_bedroom, br3: d.three_bedroom, br4: d.four_bedroom, year: 2024 };
                    console.log(' ✅ HUD OK');
                }
            } else {
                console.log(' ❌ HUD Fail:', res.status);
            }
        } catch (e) { console.log(' ❌ HUD Error:', e.message); }

        let crime = {};
        try {
            const agencyUrl = `https://api.usa.gov/crime/fbi/cde/agency/byStateAbbr/${c.state}?api_key=${FBI_API_KEY}`;
            // If that fails, we'll use a hardcoded ORI for these specific cities if needed, but let's try one more URL
            const res = await fetch(agencyUrl);
            if (res.ok) {
                const agencies = await res.json();
                const agency = agencies.find(a => a.agency_name.toLowerCase().includes(c.city.toLowerCase()) && a.agency_type_name === 'City');
                if (agency) {
                    const crimeUrl = `https://api.usa.gov/crime/fbi/cde/summaries/agency/ori/${agency.ori}/violent-crime?api_key=${FBI_API_KEY}`;
                    const cRes = await fetch(crimeUrl);
                    if (cRes.ok) {
                        const summary = await cRes.json();
                        if (summary.keys && summary.keys.length > 0) {
                            const latest = summary.keys[summary.keys.length - 1];
                            const data = summary.data.find(d => d.year === latest);
                            if (data) {
                                crime = { violent_rate: (data.actual / (data.population || 100000)) * 100000, year: latest, agency_name: agency.agency_name };
                                console.log(' ✅ FBI OK');
                            }
                        }
                    }
                }
            }
        } catch (e) { console.log(' ❌ FBI Error:', e.message); }

        await supabase.from('institutions').update({
            zip: c.zip,
            local_housing_stats: housing,
            city_crime_stats: crime
        }).eq('id', c.id);
        console.log(' 🎉 Updated DB');
    }
}

enrich();
