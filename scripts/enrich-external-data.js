/**
 * Data Enrichment Script (Ultra Robust Version)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const zipcodes = require('zipcodes');

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
            const hudData = await fetchHUDHousingStats(college.zip, college.state, college.city);
            if (hudData) {
                housingStats = {
                    br0: hudData["Efficiency"] || hudData.studio,
                    br1: hudData["One-Bedroom"] || hudData.one_bedroom,
                    br2: hudData["Two-Bedroom"] || hudData.two_bedroom,
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
                console.log(' ✅ FBI Data Found (Agency identified)');
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

const stateFmrCache = {};

async function fetchHUDHousingStats(zip, state, city) {
    if (!HUD_API_KEY) return null;
    const year = 2024;

    try {
        // 1. Get state FMR data (cached)
        if (!stateFmrCache[state]) {
            console.log(` 📥 Fetching HUD list for ${state}...`);
            const listUrl = `https://www.huduser.gov/hudapi/public/fmr/statedata/${state}`;
            const listRes = await fetch(listUrl, {
                headers: { 'Authorization': `Bearer ${HUD_API_KEY.trim()}` }
            });
            if (listRes.ok) {
                const listData = await listRes.json();
                // Combine metro and county lists for easier matching
                stateFmrCache[state] = [
                    ...(listData.data?.metroareas || []),
                    ...(listData.data?.counties || [])
                ];
            }
        }

        // 2. Identify county
        const zipInfo = zipcodes.lookup(zip);
        const countyName = zipInfo?.county;

        // 3. Match county or city in the HUD list
        const match = stateFmrCache[state]?.find(item => {
            const cName = (item.county_name || "").toLowerCase();
            const mName = (item.metro_name || "").toLowerCase();
            const tName = (item.town_name || "").toLowerCase();
            const searchCity = (city || "").toLowerCase().trim();
            const searchCounty = (countyName || "").toLowerCase().trim();

            const isMatch = (searchCounty && cName.includes(searchCounty)) ||
                (searchCity && mName.includes(searchCity)) ||
                (searchCity && tName.includes(searchCity));

            if (isMatch) console.log(`   ✨ Potential Match: ${mName || cName}`);
            return isMatch;
        });

        if (!match) {
            console.log(` ❌ No HUD FIPS match for city: "${city}", county: "${countyName}"`);
            console.log(`    (Checked ${stateFmrCache[state]?.length} areas in ${state})`);
            return null;
        }

        console.log(` ✅ Found HUD Area: ${match.metro_name || match.county_name} (${match.fips_code})`);

        // 4. Fetch specific data for that FIPS/Code
        const entityId = match.fips_code || match.code;
        const fmrUrl = `https://www.huduser.gov/hudapi/public/fmr/data/${entityId}?year=${year}`;
        const fmrRes = await fetch(fmrUrl, {
            headers: { 'Authorization': `Bearer ${HUD_API_KEY.trim()}` }
        });

        if (fmrRes.ok) {
            const data = await fmrRes.json();
            return data.data?.basicdata || null;
        }
    } catch (error) {
        console.error(` ❌ HUD Fetch Error:`, error.message);
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

    let flatAgencies = [];
    if (Array.isArray(agencyData)) {
        flatAgencies = agencyData;
    } else if (typeof agencyData === 'object') {
        // CDE returns object with county keys
        flatAgencies = Object.values(agencyData).flat();
    }

    if (flatAgencies.length === 0) {
        console.log(` ❌ No agencies found for state ${state}`);
        return null;
    }

    const targetCity = city.toLowerCase();
    const agency = flatAgencies.find(a =>
        a.agency_name &&
        (a.agency_name.toLowerCase().includes(targetCity) || a.agency_name.toLowerCase().includes(targetCity.replace(' ', ''))) &&
        a.agency_type_name === 'City'
    );

    if (!agency) {
        console.log(` ❌ No City agency found for ${city}.`);
        return null;
    }

    console.log(` ✅ Found Agency: ${agency.agency_name} (${agency.ori})`);

    // Fetch crime summaries
    const crimeData = {};
    const categories = ['violent-crime', 'property-crime'];

    for (const category of categories) {
        const summaryPatterns = [
            `https://api.usa.gov/crime/fbi/cde/summaries/agency/ori/${agency.ori}/${category}`,
            `https://api.usa.gov/crime/fbi/sapi/api/summaries/agency/ori/${agency.ori}/${category}`
        ];

        for (const baseUrl of summaryPatterns) {
            const url = `${baseUrl}?api_key=${FBI_API_KEY}`;
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const summary = await res.json();
                    if (summary.data && summary.data.length > 0) {
                        const stats = (summary.data || []).sort((a, b) => b.data_year - a.data_year).find(d => d.data_year >= 2020);
                        if (stats) {
                            const pop = stats.population || 100000;
                            const key = category === 'violent-crime' ? 'violent_rate' : 'property_rate';
                            crimeData[key] = (stats.actual / pop) * 100000;
                            crimeData[key + '_year'] = stats.data_year;
                            break;
                        }
                    } else if (summary.keys && summary.keys.length > 0) {
                        // CDE legacy format
                        const latest = summary.keys[summary.keys.length - 1];
                        const data = summary.data.find(d => d.year === latest);
                        if (data) {
                            const pop = data.population || 100000;
                            const key = category === 'violent-crime' ? 'violent_rate' : 'property_rate';
                            crimeData[key] = (data.actual / pop) * 100000;
                            crimeData[key + '_year'] = latest;
                            break;
                        }
                    }
                }
            } catch (e) { }
        }
    }

    if (Object.keys(crimeData).length > 0) {
        return {
            ori: agency.ori,
            agency_name: agency.agency_name,
            ...crimeData,
            status: 'success'
        };
    }

    return null;
}

enrichData();
