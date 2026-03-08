/**
 * Data Enrichment Script (Production Scale Version)
 * 
 * Scaled to handle 6,400+ institutions with:
 * - Batching (100 row window)
 * - Rate limiting (1.1s delay for HUD)
 * - Resumability (skips already enriched schools by default)
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

// Config
const BATCH_SIZE = 50;
const HUD_DELAY_MS = 1100; // ~54 req/min
const FORCE_RELOAD = process.argv.includes('--force');

async function enrichData() {
    console.log(`🚀 Starting production-scale data enrichment... ${FORCE_RELOAD ? '(FORCE MODE)' : ''}`);

    let totalProcessed = 0;
    let hasMore = true;
    let lastId = 0;

    while (hasMore) {
        // Query batch
        let query = supabase
            .from('institutions')
            .select('id, name, city, state, zip, local_housing_stats, city_crime_stats')
            .gt('id', lastId)
            .order('id', { ascending: true })
            .limit(BATCH_SIZE);

        if (!FORCE_RELOAD) {
            // Only fetch those that need work
            // Note: Since we can't easily filter on null JSONB in one go with complex logic, 
            // we'll fetch and filter in JS if needed, or rely on gt(id) for progression.
        }

        const { data: colleges, error } = await query;

        if (error) {
            console.error('Supabase Error:', error);
            break;
        }

        if (!colleges || colleges.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`\n📦 Processing Batch: Institutions ${lastId}+ (Size: ${colleges.length})`);

        for (const college of colleges) {
            lastId = college.id;

            // Skip if already done and not in force mode
            const hasHousing = college.local_housing_stats && Object.keys(college.local_housing_stats).length > 0;
            const hasCrime = college.city_crime_stats && Object.keys(college.city_crime_stats).length > 0;

            if (!FORCE_RELOAD && hasHousing && hasCrime) {
                // console.log(` ⏩ Skipping ${college.name} (Already enriched)`);
                continue;
            }

            console.log(`\n🔹 ${college.name} (${college.city}, ${college.state})`);

            // 1. HUD Housing Data
            let housingStats = college.local_housing_stats || {};
            if (FORCE_RELOAD || !hasHousing) {
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
                        console.log('   ✅ HUD Data Found');
                    }
                    // Rate limit delay
                    await new Promise(r => setTimeout(r, HUD_DELAY_MS));
                } catch (e) {
                    console.log('   ❌ HUD API Error:', e.message);
                }
            }

            // 2. FBI Crime Data
            let crimeStats = college.city_crime_stats || {};
            if (FORCE_RELOAD || !hasCrime) {
                try {
                    const fbiData = await fetchFBICrimeStats(college.city, college.state);
                    if (fbiData) {
                        crimeStats = fbiData;
                        console.log('   ✅ FBI Data Found (Agency identified)');
                    }
                } catch (e) {
                    console.log('   ❌ FBI API Error:', e.message);
                }
            }

            // Update DB if we found anything new
            if (Object.keys(housingStats).length > 0 || Object.keys(crimeStats).length > 0) {
                const { error: updateError } = await supabase
                    .from('institutions')
                    .update({
                        local_housing_stats: housingStats,
                        city_crime_stats: crimeStats
                    })
                    .eq('id', college.id);

                if (updateError) {
                    console.error('   ❌ Update Error:', updateError);
                } else {
                    console.log('   🎉 DB Updated');
                }
            }

            totalProcessed++;
        }

        console.log(`\n✅ Batch Complete. Total Processed so far: ${totalProcessed}`);
    }

    console.log('\n🏁 ENRICHMENT PROCESS COMPLETE');
}

const stateFmrCache = {};

async function fetchHUDHousingStats(zip, state, city) {
    if (!HUD_API_KEY) return null;
    const year = 2024;

    try {
        if (!stateFmrCache[state]) {
            console.log(`     📥 Fetching HUD list for ${state}...`);
            const listUrl = `https://www.huduser.gov/hudapi/public/fmr/statedata/${state}`;
            const listRes = await fetch(listUrl, {
                headers: { 'Authorization': `Bearer ${HUD_API_KEY.trim()}` }
            });
            if (listRes.ok) {
                const listData = await listRes.json();
                stateFmrCache[state] = [
                    ...(listData.data?.metroareas || []),
                    ...(listData.data?.counties || [])
                ];
            }
        }

        const zipInfo = zipcodes.lookup(zip);
        const countyName = zipInfo?.county;

        const match = stateFmrCache[state]?.find(item => {
            const cName = (item.county_name || "").toLowerCase();
            const mName = (item.metro_name || "").toLowerCase();
            const tName = (item.town_name || "").toLowerCase();
            const searchCity = (city || "").toLowerCase().trim();
            const searchCounty = (countyName || "").toLowerCase().trim();

            return (searchCounty && cName.includes(searchCounty)) ||
                (searchCity && mName.includes(searchCity)) ||
                (searchCity && tName.includes(searchCity));
        });

        if (!match) return null;

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
        console.error(`     ❌ HUD Fetch Error:`, error.message);
    }
    return null;
}

async function fetchFBICrimeStats(city, state) {
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
    } else if (typeof agencyData === 'object' && agencyData !== null) {
        flatAgencies = Object.values(agencyData).flat();
    }

    if (flatAgencies.length === 0) return null;

    const targetCity = city.toLowerCase();
    const agency = flatAgencies.find(a =>
        a.agency_name &&
        (a.agency_name.toLowerCase().includes(targetCity) || a.agency_name.toLowerCase().includes(targetCity.replace(' ', ''))) &&
        a.agency_type_name === 'City'
    );

    if (!agency) return null;

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
                        const stats = summary.data.sort((a, b) => b.data_year - a.data_year).find(d => d.data_year >= 2020);
                        if (stats) {
                            const pop = stats.population || 100000;
                            const key = category === 'violent-crime' ? 'violent_rate' : 'property_rate';
                            crimeData[key] = (stats.actual / pop) * 100000;
                            crimeData[key + '_year'] = stats.data_year;
                            break;
                        }
                    } else if (summary.keys && summary.keys.length > 0) {
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

    return { ori: agency.ori, agency_name: agency.agency_name };
}

enrichData();
