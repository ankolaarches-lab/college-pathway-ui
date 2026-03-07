/**
 * Data Enrichment Script
 * 
 * This script pulls data from:
 * 1. HUD User API (Local Fair Market Rents)
 * 2. FBI Crime Data API (City-level crime rates)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role to bypass RLS

// External API Keys - These should be added to .env
const HUD_API_KEY = process.env.HUD_API_KEY;
const FBI_API_KEY = process.env.FBI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function enrichData() {
    if (!HUD_API_KEY || !FBI_API_KEY) {
        console.error('❌ HUD_API_KEY or FBI_API_KEY is missing in .env');
        console.log('Please get your keys from:');
        console.log('- FBI: https://api.data.gov/signup/');
        console.log('- HUD: https://www.huduser.gov/portal/dataset/fmr-api.html');
        // return; // Skip for now so user can see the logic
    }

    console.log('🚀 Starting enrichment process...');

    // 1. Get institutions with missing data
    const { data: colleges, error } = await supabase
        .from('institutions')
        .select('id, name, city, state, zip')
        .or('local_housing_stats.eq.{}, city_crime_stats.eq.{}')
        .limit(10); // Batch process

    if (error) {
        console.error('Error fetching colleges:', error);
        return;
    }

    console.log(`Found ${colleges.length} colleges to enrich.`);

    for (const college of colleges) {
        console.log(`Processing ${college.name} (${college.city}, ${college.state})...`);

        // Placeholder for HUD API call
        const housingStats = await fetchHUDHousingStats(college.zip);

        // Placeholder for FBI API call
        const crimeStats = await fetchFBICrimeStats(college.city, college.state);

        // Update database
        const { error: updateError } = await supabase
            .from('institutions')
            .update({
                local_housing_stats: housingStats || {},
                city_crime_stats: crimeStats || {}
            })
            .eq('id', college.id);

        if (updateError) {
            console.error(`Error updating ${college.name}:`, updateError);
        } else {
            console.log(`✅ Success for ${college.name}`);
        }
    }
}

async function fetchHUDHousingStats(zip) {
    if (!HUD_API_KEY) return null;
    try {
        const response = await fetch(`https://www.huduser.gov/hudapi/public/fmr/data/${zip}`, {
            headers: { 'Authorization': `Bearer ${HUD_API_KEY}` }
        });
        const data = await response.json();
        // Return structured data
        return data.results || null;
    } catch (e) {
        console.error('HUD API Error:', e);
        return null;
    }
}

async function fetchFBICrimeStats(city, state) {
    if (!FBI_API_KEY) return null;
    try {
        // FBI requires two steps: 
        // 1. Find the agency_id for the city
        // 2. Fetch the crime stats for that agency
        // For now, this is a placeholder for that multi-step logic
        return { city_name: city, status: 'api_keys_needed' };
    } catch (e) {
        console.error('FBI API Error:', e);
        return null;
    }
}

enrichData();
