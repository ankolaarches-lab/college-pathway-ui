#!/usr/bin/env node
/**
 * Full College Scorecard Sync Script
 * Paginates through ALL ~6,400 institutions in the College Scorecard API
 * and upserts them to Supabase with base + enhanced data in a single pass.
 *
 * Usage:
 *   node scripts/sync-all-institutions.js              # Full sync
 *   node scripts/sync-all-institutions.js --dry-run    # Preview without writing
 *
 * Environment variables (reads from .env.local automatically):
 *   COLLEGE_SCORECARD_API_KEY  - API key from https://api.data.gov/signup/
 *   SUPABASE_SERVICE_ROLE_KEY  - Supabase service role key
 *   NEXT_PUBLIC_SUPABASE_URL   - Supabase project URL
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
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCORECARD_API = 'https://api.data.gov/ed/collegescorecard/v1/schools';
const DRY_RUN = process.argv.includes('--dry-run');

// All fields to fetch — base + enhanced in a single request
const API_FIELDS = [
  // Identity
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.institutional_characteristics.level',
  'school.ownership',
  'school.locale',
  'school.online_only',
  'school.religious_affiliation',
  'school.accreditor',
  'school.accreditor_code',

  // Location
  'location.lat',
  'location.lon',

  // Enrollment
  'latest.student.size',
  'latest.student.enrollment.undergrad_12_month',
  'latest.student.enrollment.grad_12_month',
  'latest.student.part_time_share',

  // Cost
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.tuition.program_year',
  'latest.cost.avg_net_price.public',
  'latest.cost.avg_net_price.private',
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  'latest.cost.roomboard.oncampus',
  'latest.cost.roomboard.offcampus',
  'latest.cost.booksupply',

  // Admissions
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.admissions.sat_scores.midpoint.critical_reading',
  'latest.admissions.sat_scores.midpoint.math',
  'latest.admissions.act_scores.midpoint.cumulative',

  // Completion
  'latest.completion.rate_suppressed.overall',
  'latest.completion.rate_suppressed.four_year',
  'latest.completion.consumer_rate',

  // Earnings
  'latest.earnings.6_yrs_after_entry.median',
  'latest.earnings.10_yrs_after_entry.median',

  // Student-faculty ratio
  'latest.student.students_with_pell_grant',
  'latest.student.faculty_rate',

  // Aid & Loans
  'latest.aid.federal_loan_rate',
  'latest.aid.pell_grant_rate',
  'latest.aid.median_debt.completers.overall',
  'latest.aid.median_debt.completers.monthly_payments',
  'latest.repayment.3_yr_repayment.overall',

  // Demographics
  'latest.student.demographics.race_ethnicity.white',
  'latest.student.demographics.race_ethnicity.black',
  'latest.student.demographics.race_ethnicity.hispanic',
  'latest.student.demographics.race_ethnicity.asian',
  'latest.student.demographics.race_ethnicity.aian',
  'latest.student.demographics.race_ethnicity.nhpi',
  'latest.student.demographics.race_ethnicity.two_or_more',
  'latest.student.demographics.race_ethnicity.non_resident_alien',
  'latest.student.demographics.race_ethnicity.unknown',
  'latest.student.demographics.men',
  'latest.student.demographics.women',

  // Retention
  'latest.student.retention_rate.four_year.full_time',
  'latest.student.retention_rate.four_year.part_time',
  'latest.student.retention_rate.lt_four_year.full_time',
  'latest.student.retention_rate.lt_four_year.part_time',
];

// ────────────────────────────────────────────────────────────────────
// API Fetching
// ────────────────────────────────────────────────────────────────────

async function fetchAllInstitutions() {
  const allResults = [];
  let page = 0;
  let totalPages = Infinity;
  let retries = 0;
  const perPage = 100;

  console.log('📡 Fetching all institutions from College Scorecard API...\n');

  while (page < totalPages) {
    const url = new URL(SCORECARD_API);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('fields', API_FIELDS.join(','));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    // Only currently operating schools
    url.searchParams.set('school.operating', '1');

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const text = await response.text();
        console.error(`\n❌ API error on page ${page}: ${response.status} - ${text.slice(0, 100)}`);
        if (response.status === 429) {
          console.log('   Rate limited — waiting 5 seconds...');
          await sleep(5000);
          continue; // retry same page
        }
        if (response.status >= 500 && retries < 3) {
          retries++;
          const backoff = retries * 2000;
          console.log(`   Server error — retry ${retries}/3 in ${backoff / 1000}s...`);
          await sleep(backoff);
          continue; // retry same page
        }
        // Skip this page after max retries
        console.log(`   Skipping page ${page} after ${retries} retries`);
        page++;
        retries = 0;
        continue;
      }
      retries = 0; // reset on success

      const data = await response.json();
      const metadata = data.metadata || {};
      const total = metadata.total || 0;
      totalPages = Math.ceil(total / perPage);

      if (data.results && data.results.length > 0) {
        allResults.push(...data.results);
      }

      const fetched = allResults.length;
      const pct = total > 0 ? ((fetched / total) * 100).toFixed(1) : '?';
      process.stdout.write(`\r   Page ${page + 1}/${totalPages} — ${fetched}/${total} institutions (${pct}%)`);

      page++;

      // Be nice to the API
      await sleep(150);

    } catch (error) {
      console.error(`\n❌ Network error on page ${page}:`, error.message);
      // Retry after a delay
      await sleep(2000);
    }
  }

  console.log(`\n\n✅ Fetched ${allResults.length} institutions total\n`);
  return allResults;
}

// ────────────────────────────────────────────────────────────────────
// Data Transformation
// ────────────────────────────────────────────────────────────────────

// The College Scorecard API returns FLAT objects with dot-separated keys
// e.g., { "school.name": "MIT", "latest.cost.tuition.in_state": 55878 }
function getVal(obj, key) {
  return obj?.[key] ?? null;
}

function determineInstitutionType(raw) {
  const ownership = getVal(raw, 'school.ownership');
  const level = getVal(raw, 'school.institutional_characteristics.level');

  let type = '';

  // Ownership: 1=Public, 2=Private nonprofit, 3=Private for-profit
  if (ownership === 1) type = 'Public';
  else if (ownership === 2) type = 'Private nonprofit';
  else if (ownership === 3) type = 'Private for-profit';
  else type = 'Unknown';

  // Level: 1=4-year, 2=2-year, 3=Less-than-2-year
  if (level === 1) type += ', 4-Year';
  else if (level === 2) type += ', 2-Year';
  else if (level === 3) type += ', Less than 2-Year';

  return type;
}

function transformInstitution(raw) {
  const id = raw.id;
  if (!id) return null;

  const ownership = getVal(raw, 'school.ownership');
  const isPublic = ownership === 1;

  const incomePrefix = isPublic
    ? 'latest.cost.net_price.public.by_income_level'
    : 'latest.cost.net_price.private.by_income_level';

  return {
    // Base columns (match supabase_schema.sql exactly)
    id,
    name: getVal(raw, 'school.name'),
    city: getVal(raw, 'school.city'),
    state: getVal(raw, 'school.state'),
    lat: getVal(raw, 'location.lat'),
    lon: getVal(raw, 'location.lon'),
    url: getVal(raw, 'school.school_url'),
    institution_type: determineInstitutionType(raw),

    // JSONB: enrollment (pack demographics + retention here too)
    enrollment: {
      undergrad_total: getVal(raw, 'latest.student.size'),
      undergrad_12_month: getVal(raw, 'latest.student.enrollment.undergrad_12_month'),
      grad_12_month: getVal(raw, 'latest.student.enrollment.grad_12_month'),
      part_time_share: getVal(raw, 'latest.student.part_time_share'),
      student_faculty_ratio: getVal(raw, 'latest.student.faculty_rate'),
      retention_rate_ft: getVal(raw, 'latest.student.retention_rate.four_year.full_time')
        ?? getVal(raw, 'latest.student.retention_rate.lt_four_year.full_time'),
      retention_rate_pt: getVal(raw, 'latest.student.retention_rate.four_year.part_time')
        ?? getVal(raw, 'latest.student.retention_rate.lt_four_year.part_time'),
      demographics: {
        white: getVal(raw, 'latest.student.demographics.race_ethnicity.white'),
        black: getVal(raw, 'latest.student.demographics.race_ethnicity.black'),
        hispanic: getVal(raw, 'latest.student.demographics.race_ethnicity.hispanic'),
        asian: getVal(raw, 'latest.student.demographics.race_ethnicity.asian'),
        american_indian: getVal(raw, 'latest.student.demographics.race_ethnicity.aian'),
        nhpi: getVal(raw, 'latest.student.demographics.race_ethnicity.nhpi'),
        two_or_more: getVal(raw, 'latest.student.demographics.race_ethnicity.two_or_more'),
        non_resident_alien: getVal(raw, 'latest.student.demographics.race_ethnicity.non_resident_alien'),
        unknown: getVal(raw, 'latest.student.demographics.race_ethnicity.unknown'),
        men: getVal(raw, 'latest.student.demographics.men'),
        women: getVal(raw, 'latest.student.demographics.women'),
      },
    },

    // JSONB: cost
    cost: {
      tuition_in_state: getVal(raw, 'latest.cost.tuition.in_state'),
      tuition_out_of_state: getVal(raw, 'latest.cost.tuition.out_of_state'),
      tuition_program_year: getVal(raw, 'latest.cost.tuition.program_year'),
      avg_net_price: isPublic
        ? getVal(raw, 'latest.cost.avg_net_price.public')
        : getVal(raw, 'latest.cost.avg_net_price.private'),
      net_price_public: isPublic ? {
        '0_30000': getVal(raw, `${incomePrefix}.0-30000`),
        '30001_48000': getVal(raw, `${incomePrefix}.30001-48000`),
        '48001_75000': getVal(raw, `${incomePrefix}.48001-75000`),
        '75001_110000': getVal(raw, `${incomePrefix}.75001-110000`),
        '110001_plus': getVal(raw, `${incomePrefix}.110001-plus`),
      } : null,
      net_price_private: !isPublic ? {
        '0_30000': getVal(raw, `${incomePrefix}.0-30000`),
        '30001_48000': getVal(raw, `${incomePrefix}.30001-48000`),
        '48001_75000': getVal(raw, `${incomePrefix}.48001-75000`),
        '75001_110000': getVal(raw, `${incomePrefix}.75001-110000`),
        '110001_plus': getVal(raw, `${incomePrefix}.110001-plus`),
      } : null,
      roomboard_oncampus: getVal(raw, 'latest.cost.roomboard.oncampus'),
      roomboard_offcampus: getVal(raw, 'latest.cost.roomboard.offcampus'),
      books_supplies: getVal(raw, 'latest.cost.booksupply'),
    },

    // JSONB: admissions
    admissions: {
      admission_rate_overall: getVal(raw, 'latest.admissions.admission_rate.overall'),
      sat_average: getVal(raw, 'latest.admissions.sat_scores.average.overall'),
      sat_reading_midpoint: getVal(raw, 'latest.admissions.sat_scores.midpoint.critical_reading'),
      sat_math_midpoint: getVal(raw, 'latest.admissions.sat_scores.midpoint.math'),
      act_midpoint: getVal(raw, 'latest.admissions.act_scores.midpoint.cumulative'),
    },

    // JSONB: completion
    completion: {
      completion_rate_4_year: getVal(raw, 'latest.completion.rate_suppressed.four_year'),
      completion_rate_6_year: getVal(raw, 'latest.completion.rate_suppressed.overall'),
      consumer_rate: getVal(raw, 'latest.completion.consumer_rate'),
    },

    // JSONB: earnings
    earnings: {
      median_6_yrs: getVal(raw, 'latest.earnings.6_yrs_after_entry.median'),
      median_10_yrs: getVal(raw, 'latest.earnings.10_yrs_after_entry.median'),
    },

    // JSONB: accreditation
    accreditation: {
      accreditor: getVal(raw, 'school.accreditor'),
      accreditor_code: getVal(raw, 'school.accreditor_code'),
      locale: getVal(raw, 'school.locale'),
      online_only: getVal(raw, 'school.online_only'),
      religious_affiliation: getVal(raw, 'school.religious_affiliation'),
    },

    // JSONB: loan_stats
    loan_stats: {
      federal_loan_rate: getVal(raw, 'latest.aid.federal_loan_rate'),
      pell_grant_rate: getVal(raw, 'latest.aid.pell_grant_rate'),
      median_debt: getVal(raw, 'latest.aid.median_debt.completers.overall'),
      monthly_payment: getVal(raw, 'latest.aid.median_debt.completers.monthly_payments'),
      repayment_rate_3yr: getVal(raw, 'latest.repayment.3_yr_repayment.overall'),
    },
  };
}

// ────────────────────────────────────────────────────────────────────
// Supabase Upload
// ────────────────────────────────────────────────────────────────────

async function upsertToSupabase(institutions) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const batchSize = 100;
  let totalUpserted = 0;
  let totalErrors = 0;

  console.log(`📤 Upserting ${institutions.length} institutions to Supabase...\n`);

  for (let i = 0; i < institutions.length; i += batchSize) {
    const batch = institutions.slice(i, i + batchSize);

    const { error } = await supabase
      .from('institutions')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`\n   ❌ Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
      totalErrors += batch.length;
    } else {
      totalUpserted += batch.length;
    }

    const pct = ((i + batch.length) / institutions.length * 100).toFixed(1);
    process.stdout.write(`\r   Upserted ${i + batch.length}/${institutions.length} (${pct}%)`);

    // Small delay between batches
    await sleep(100);
  }

  console.log('\n');
  return { totalUpserted, totalErrors };
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  College Pathway — Full Institution Sync            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🏜️  DRY RUN MODE — no data will be written to Supabase\n');
  }

  // Validate env
  if (!API_KEY) {
    console.error('❌ COLLEGE_SCORECARD_API_KEY is not set.');
    console.error('   Get a free key at: https://api.data.gov/signup/');
    process.exit(1);
  }
  if (!SERVICE_KEY && !DRY_RUN) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set.');
    process.exit(1);
  }

  // Step 1: Fetch all institutions
  const rawResults = await fetchAllInstitutions();

  if (rawResults.length === 0) {
    console.error('❌ No results returned from the API. Check your API key.');
    process.exit(1);
  }

  // Step 2: Transform
  console.log('🔄 Transforming data...');
  const institutions = rawResults
    .map(transformInstitution)
    .filter(Boolean);

  console.log(`   ${institutions.length} institutions transformed\n`);

  // Step 3: Show sample
  const sample = institutions[0];
  console.log('📋 Sample institution:');
  console.log(`   Name:       ${sample.name}`);
  console.log(`   City/State: ${sample.city}, ${sample.state}`);
  console.log(`   Type:       ${sample.institution_type}`);
  console.log(`   Tuition:    $${sample.cost?.tuition_in_state ?? 'N/A'} in-state`);
  console.log(`   Admit Rate: ${sample.admissions?.admission_rate_overall != null ? (sample.admissions.admission_rate_overall * 100).toFixed(1) + '%' : 'N/A'}`);
  console.log(`   Earnings:   $${sample.earnings?.median_10_yrs ?? 'N/A'} (10yr median)\n`);

  if (DRY_RUN) {
    console.log('🏜️  Dry run complete. Would have upserted', institutions.length, 'institutions.');
    console.log('   Run without --dry-run to write to Supabase.');
    return;
  }

  // Step 4: Upsert to Supabase
  const { totalUpserted, totalErrors } = await upsertToSupabase(institutions);

  // Step 5: Verify
  console.log('📊 Results:');
  console.log(`   ✅ Upserted: ${totalUpserted}`);
  console.log(`   ❌ Errors:   ${totalErrors}`);

  // Quick count check
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { count } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });
    console.log(`   📦 Total in Supabase: ${count}`);
  } catch (e) {
    // non-critical
  }

  console.log('\n✅ Sync complete!');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
