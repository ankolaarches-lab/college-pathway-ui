/**
 * Enhanced IPEDS/College Scorecard Data Sync Script
 * Fetches additional data: student-faculty ratio, loan stats, and more
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/sync-enhanced-data.js
 */

const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://yprxfmbwbxwdpmazgadp.supabase.co';

// College Scorecard API configuration
const COLLEGE_SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools';
// Note: You'll need to get a free API key from https://collegescorecard.ed.gov/data/api/
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY || 'YOUR_API_KEY';

// Data paths
const DATA_DIR = path.join(__dirname, '..', 'data-small');

// Fields to fetch from College Scorecard API (the ones we need that aren't in local data)
const ENHANCED_FIELDS = [
  'id',
  'school.name',
  'latest.student.faculty_rate',  // Student/faculty ratio
  'latest.aid.median_debt.completers.overall',  // Median debt
  'latest.aid.median_debt.completers.dependent',  // Median debt for dependent
  'latest.aid.median_debt.completers.independent',  // Median debt for independent
  'latest.aid.federal_loan_rate',  // % with federal loans
  'latest.aid.pell_grant_rate',  // % with Pell grants
  'latest.student.demographics.american_indian',  // Demographics
  'latest.student.demographics.asian',
  'latest.student.demographics.black',
  'latest.student.demographics.hispanic',
  'latest.student.demographics.white',
  'latest.student.demographics.two_or_more',
  'latest.student.demographics.non_resident_alien',
  'latest.student.demographics.unknown',
  'latest.student.demographics.men',  // Gender
  'latest.student.demographics.women',
  'latest.completion.150nt',  // 150% graduation rate (6-year)
  'latest.completion.100nt',  // 100% graduation rate (4-year)
  'latest.retained.retention_rate.full_time',  // Retention rate
  'latest.retained.retention_rate.part_time',
];

async function fetchEnhancedData(institutionIds, batchSize = 100) {
  console.log(`Fetching enhanced data for ${institutionIds.length} institutions...`);
  
  const results = [];
  const batches = [];
  
  // Split into batches
  for (let i = 0; i < institutionIds.length; i += batchSize) {
    batches.push(institutionIds.slice(i, i + batchSize));
  }
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} institutions)`);
    
    try {
      // Build the query - filter by IDs
      const idList = batch.join(',');
      const url = new URL(COLLEGE_SCORECARD_API);
      url.searchParams.set('api_key', API_KEY);
      url.searchParams.set('fields', ENHANCED_FIELDS.join(','));
      url.searchParams.set('school.id', idList);
      url.searchParams.set('per_page', '100');
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error(`Error fetching batch ${i + 1}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.results) {
        results.push(...data.results);
      }
      
      // Rate limiting - be nice to the API
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error processing batch ${i + 1}:`, error.message);
    }
  }
  
  return results;
}

function transformEnhancedData(rawData) {
  return {
    student_faculty_ratio: rawData['latest.student.faculty_rate'] || null,
    loan_stats: {
      federal_loan_rate: rawData['latest.aid.federal_loan_rate'] || null,
      median_debt: rawData['latest.aid.median_debt.completers.overall'] || null,
      median_debt_dependent: rawData['latest.aid.median_debt.completers.dependent'] || null,
      median_debt_independent: rawData['latest.aid.median_debt.completers.independent'] || null,
      pell_grant_rate: rawData['latest.aid.pell_grant_rate'] || null,
    },
    demographics: {
      american_indian: rawData['latest.student.demographics.american_indian'] || null,
      asian: rawData['latest.student.demographics.asian'] || null,
      black: rawData['latest.student.demographics.black'] || null,
      hispanic: rawData['latest.student.demographics.hispanic'] || null,
      white: rawData['latest.student.demographics.white'] || null,
      two_or_more: rawData['latest.student.demographics.two_or_more'] || null,
      non_resident_alien: rawData['latest.student.demographics.non_resident_alien'] || null,
      unknown: rawData['latest.student.demographics.unknown'] || null,
      men: rawData['latest.student.demographics.men'] || null,
      women: rawData['latest.student.demographics.women'] || null,
    },
    completion: {
      rate_150nt: rawData['latest.completion.150nt'] || null,  // 6-year rate
      rate_100nt: rawData['latest.completion.100nt'] || null,  // 4-year rate
    },
    retained: {
      retention_rate_full_time: rawData['latest.retained.retention_rate.full_time'] || null,
      retention_rate_part_time: rawData['latest.retained.retention_rate.part_time'] || null,
    },
  };
}

async function updateSupabaseEnhancedData(enhancedData) {
  const { createClient } = require('@supabase/supabase-js');
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  
  const supabase = createClient(SUPABASE_URL, serviceKey);
  
  console.log(`Updating ${enhancedData.length} institutions in Supabase...`);
  
  let updated = 0;
  let errors = 0;
  
  for (const data of enhancedData) {
    const { error } = await supabase
      .from('institutions')
      .update({
        student_faculty_ratio: data.enhanced.student_faculty_ratio,
        loan_stats: JSON.stringify(data.enhanced.loan_stats),
        demographics: JSON.stringify(data.enhanced.demographics),
        // Update completion with more accurate data if available
        completion: JSON.stringify({
          ...data.existingCompletion,
          rate_150nt: data.enhanced.completion?.rate_150nt,
          rate_100nt: data.enhanced.completion?.rate_100nt,
        }),
      })
      .eq('id', data.id);
    
    if (error) {
      console.error(`Error updating institution ${data.id}:`, error.message);
      errors++;
    } else {
      updated++;
    }
  }
  
  console.log(`Updated ${updated} institutions (${errors} errors)`);
  return { updated, errors };
}

async function main() {
  console.log('=== College Pathway Explorer - Enhanced Data Sync ===\n');
  
  // Check for API key
  if (!process.env.COLLEGE_SCORECARD_API_KEY) {
    console.log('⚠️  COLLEGE_SCORECARD_API_KEY not set');
    console.log('To get a free API key, visit: https://collegescorecard.ed.gov/data/api/');
    console.log('Set it with: export COLLEGE_SCORECARD_API_KEY=your_key\n');
  }
  
  // Get list of institutions from local data
  console.log('Reading local data files...');
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  
  const institutionIds = [];
  const localDataMap = {};
  
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    if (data.institution_id) {
      institutionIds.push(data.institution_id);
      localDataMap[data.institution_id] = data;
    }
  }
  
  console.log(`Found ${institutionIds.length} institutions in local data`);
  
  if (process.env.COLLEGE_SCORECARD_API_KEY) {
    // Fetch enhanced data from API
    const enhancedResults = await fetchEnhancedData(institutionIds);
    
    console.log(`\nFetched enhanced data for ${enhancedResults.length} institutions`);
    
    // Transform and combine data
    const combinedData = enhancedResults.map(raw => ({
      id: raw.id,
      enhanced: transformEnhancedData(raw),
      existingCompletion: localDataMap[raw.id]?.completion || {},
    }));
    
    // Update Supabase
    await updateSupabaseEnhancedData(combinedData);
  } else {
    console.log('\n⚠️  Skipping API fetch - no API key provided');
    console.log('To add enhanced data, run with COLLEGE_SCORECARD_API_KEY set');
  }
  
  console.log('\n=== Sync Complete ===');
}

main().catch(console.error);
