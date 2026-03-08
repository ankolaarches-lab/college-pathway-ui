/**
 * Data Enrichment Script (Ultra Robust Version)
 */

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HUD_API_KEY = process.env.HUD_API_KEY;
const FBI_API_KEY = process.env.FBI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function enrichData() {
    console.log('🚀 Starting robust data enrichment...');

    // Select specific interesting colleges for verification
    const testIds = [100858, 101514, 158333, 207388, 166026, 110635]; // Auburn, UAB, Central Michigan, LSU, etc.
    const { data: colleges, error } = await supabase
        .from('institutions')
        .select('id, name, city, state, zip')
        .in('id', testIds);

    if (error) { console.error('Supabase Error:', error); return; }
    if (!colleges || colleges.length === 0) {
        console.log('✅ No colleges found with ZIP codes that need enrichment.');
        return;
    }

    console.log(`Processing ${colleges.length} colleges...`);

    for (const college of colleges) {
        console.log(`\n------------------`);
        console.log(`${college.name} (${college.city}, ${college.state}) | ZIP: ${college.zip}`);

        // 1. HUD Housing Data
        let housingStats = {};
        try {
            const hudData = await fetchHUDHousingStats(college.zip);
            if (hudData) {
                housingStats = {
                    br0: hudData.studio,
                    br1: hudData.one_bedroom,
                    br2: hudData.two_bedroom,
                    br2_year: hudData.year,
                    area_name: hudData.area_name
                };
                console.log(' ✅ HUD Data Found');
            } else {
                console.log(' ❌ No HUD Data');
            }
        } catch (e) {
            console.log(' ❌ HUD API Error:', e.message);
        }

        // 2. FBI Crime Data
        let crimeStats = {};
        try {
            const fbiData = await fetchFBICrimeStats(college.city, college.state);
            if (fbiData) {
                crimeStats = fbiData;
                console.log(' ✅ FBI Data Found');
            } else {
                console.log(' ❌ No FBI Data');
            }
        } catch (e) {
            console.log(' ❌ FBI API Error:', e.message);
        }

        // Update DB
        const { error: updateError } = await supabase
            .from('institutions')
            .update({
                local_housing_stats: housingStats,
                city_crime_stats: crimeStats
            })
            .eq('id', college.id);

        if (updateError) {
            console.error('Update Error:', updateError);
        } else {
            console.log(' 🎉 Updated successfully');
        }

        await new Promise(r => setTimeout(r, 500));
    }
}

async function fetchHUDHousingStats(zip) {
    // Try both current year and previous year
    const years = ['2025', '2024'];
    for (const year of years) {
        const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zip}?year=${year}`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${HUD_API_KEY}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.data?.basicdata) return data.data.basicdata;
        }
    }
    return null;
}

async function fetchFBICrimeStats(city, state) {
    // Try multiple endpoint patterns for agencies
    const patterns = [
        `https://api.usa.gov/crime/fbi/cde/agency/byStateAbbr/${state}`,
        `https://api.usa.gov/crime/fbi/sapi/api/agencies/byStateAbbr/${state}`
    ];

    let agencyData = null;
    for (const baseUrl of patterns) {
        const url = `${baseUrl}?api_key=${FBI_API_KEY}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                agencyData = await res.json();
                break;
            }
        } catch (e) { }
    }

    if (!agencyData || !Array.isArray(agencyData)) return null;

    const targetCity = city.toLowerCase();
    const agency = agencyData.find(a =>
        (a.agency_name.toLowerCase().includes(targetCity) || a.agency_name.toLowerCase().includes(targetCity.replace(' ', ''))) &&
        a.agency_type_name === 'City'
    );

    if (!agency) return null;

    // Fetch crime summary
    const summaryPatterns = [
        `https://api.usa.gov/crime/fbi/cde/summaries/agency/ori/${agency.ori}/violent-crime`,
        `https://api.usa.gov/crime/fbi/sapi/api/summaries/agency/ori/${agency.ori}/violent-crime`
    ];

    for (const baseUrl of summaryPatterns) {
        const url = `${baseUrl}?api_key=${FBI_API_KEY}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const summary = await res.json();
                if (summary.keys && summary.keys.length > 0) {
                    const latest = summary.keys[summary.keys.length - 1];
                    const data = summary.data.find(d => d.year === latest);
                    if (data) {
                        const pop = data.population || 100000;
                        return {
                            ori: agency.ori,
                            agency_name: agency.agency_name,
                            year: latest,
                            violent_rate: (data.actual / pop) * 100000,
                            status: 'success'
                        };
                    }
                }
            }
        } catch (e) { }
    }

    return null;
}

enrichData();
