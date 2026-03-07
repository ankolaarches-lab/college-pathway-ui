#!/usr/bin/env node
/**
 * College Data Sync Script
 * Pulls institution data from local normalized files and syncs to Supabase
 * 
 * Usage: node scripts/sync-to-supabase.js
 * 
 * Environment variables required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (needs admin access)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const DATA_DIR = process.env.DATA_DIR || '/Users/archesankola/.openclaw/workspace/college-dataops/data/normalized/institutions';

const BATCH_SIZE = 100;

async function main() {
  console.log('🏫 College Data Sync Script');
  console.log('============================\n');
  
  // Check for Supabase credentials
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('\nTo run this script:');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/sync-to-supabase.js');
    process.exit(1);
  }

  console.log(`📂 Data directory: ${DATA_DIR}`);
  console.log(`🗄️  Supabase URL: ${SUPABASE_URL}\n`);

  // Initialize Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, serviceKey);

  // Load all institution files
  console.log('📚 Loading institution data...');
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`   Found ${files.length} institutions\n`);

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const institutions = [];

    for (const file of batch) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Transform to match our schema
        const institution = {
          id: data.institution_id,
          name: data.name,
          city: data.city,
          state: data.state,
          lat: data.lat,
          lon: data.lon,
          url: data.url,
          institution_type: data.institution_type,
          enrollment: data.enrollment || {},
          cost: data.cost || {},
          admissions: data.admissions || {},
          completion: data.completion || {},
          earnings: data.earnings || {},
          accreditation: data.accreditation || {},
          loan_stats: data.loan_stats || {}
        };
        
        institutions.push(institution);
      } catch (err) {
        console.error(`   Error reading ${file}: ${err.message}`);
        errors++;
      }
    }

    // Upsert batch to Supabase
    if (institutions.length > 0) {
      const { error } = await supabase
        .from('institutions')
        .upsert(institutions, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`   ❌ Batch error: ${error.message}`);
        errors += batch.length;
      } else {
        processed += institutions.length;
        console.log(`   ✅ Synced ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} institutions`);
      }
    }
  }

  console.log('\n============================');
  console.log(`✅ Sync complete!`);
  console.log(`   Processed: ${processed} institutions`);
  console.log(`   Errors: ${errors}`);
  
  // Verify count in database
  const { count, error: countError } = await supabase
    .from('institutions')
    .select('*', { count: 'exact', head: true });
    
  if (!countError) {
    console.log(`   Total in database: ${count}`);
  }
}

main().catch(console.error);
