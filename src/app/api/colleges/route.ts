import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import zipcodes from 'zipcodes';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get local data path (fallback source)
function getDataPath(): string | null {
  const paths = [
    process.env.LOCAL_DATA_PATH, // Allow override via env var
    path.join(process.cwd(), 'data', 'institutions'),
    path.join(process.cwd(), 'data-small'),
  ].filter(Boolean) as string[];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

// Create Supabase client (server-side)
function getSupabaseClient() {
  if (!supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

interface NetPriceByIncome {
  '0_30000': number | null;
  '30001_48000': number | null;
  '48001_75000': number | null;
  '75001_110000': number | null;
}

interface TransformedCollege {
  id: number;
  name: string;
  city: string;
  state: string;
  type: string;
  tuition: number | null;
  admission_rate: number | null;
  graduation_rate: number | null;
  median_earnings: number | null;
  net_price_by_income: NetPriceByIncome | null;
  student_faculty_ratio: number | null;
  description: string | null;
  crime_stats: any;
  demographics: any;
  retention_rate: number | null;
}

function transformCollege(data: any): TransformedCollege {
  // Handle ID - local JSON uses institution_id, Supabase uses id
  const id = data.id ?? data.institution_id ?? null;

  // Handle tuition - prefer in_state, fallback to out_of_state
  let costData = data.cost;
  if (typeof costData === 'string') {
    try {
      costData = JSON.parse(costData);
    } catch (e) {
      costData = {};
    }
  }

  const tuition = costData?.tuition_in_state ?? costData?.tuition_out_of_state ?? null;

  // Handle graduation rate - stored as basis points (e.g., 3609 = 36.09%)
  let graduationRate = data.completion?.completion_rate_6_year;
  if (graduationRate !== null && graduationRate !== undefined && graduationRate > 100) {
    graduationRate = graduationRate / 100;
  }

  // Handle admission rate - stored as basis points
  let admissionRate = data.admissions?.admission_rate_overall;
  if (admissionRate !== null && admissionRate !== undefined && admissionRate > 100) {
    admissionRate = admissionRate / 100;
  }

  // Determine type - infer from institution_type or completion data
  let type = data.institution_type || 'Unknown';

  if (type === 'Unknown' || type === null) {
    const completion4yr = data.completion?.completion_rate_4_year;
    if (completion4yr !== null && completion4yr !== undefined && completion4yr > 0) {
      type = '4-Year';
    } else {
      type = '2-Year';
    }
  }

  const isPublic = type.toLowerCase().includes('public') || data.institution_type?.toLowerCase().includes('public');
  const netPriceData = isPublic ? data.cost?.net_price_public : data.cost?.net_price_private;

  let netPriceByIncome: NetPriceByIncome | null = null;
  if (netPriceData) {
    netPriceByIncome = {
      '0_30000': netPriceData['0_30000'],
      '30001_48000': netPriceData['30001_48000'],
      '48001_75000': netPriceData['48001_75000'],
      '75001_110000': netPriceData['75001_110000'],
    };
  }

  const studentFacultyRatio = data.student_faculty_ratio ?? null;

  return {
    id,
    name: data.name,
    city: data.city,
    state: data.state,
    type,
    tuition,
    admission_rate: admissionRate,
    graduation_rate: graduationRate,
    median_earnings: data.earnings?.median_10_yrs ?? null,
    net_price_by_income: netPriceByIncome,
    student_faculty_ratio: studentFacultyRatio,
    description: data.description ?? null,
    crime_stats: data.crime_stats ?? null,
    demographics: data.enrollment?.demographics ?? null,
    retention_rate: data.enrollment?.retention_rate_ft ?? data.enrollment?.retention_rate_pt ?? null,
    image_url: data.image_url ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for single ID lookup
    const idFilter = searchParams.get('id');

    // Filter params
    let typeFilter = searchParams.get('type')?.toLowerCase();
    const maxTuition = searchParams.get('max_tuition');
    const stateFilter = searchParams.get('state')?.toUpperCase();
    const searchQuery = searchParams.get('q')?.toLowerCase();
    const zipCode = searchParams.get('zip');
    const distanceMiles = parseInt(searchParams.get('distance') || '50');
    const tierFilter = searchParams.get('tier')?.toLowerCase();

    // Pagination params
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Map URL params to actual values
    if (typeFilter === '2year') typeFilter = '2-year';
    if (typeFilter === '4year') typeFilter = '4-year';

    // PRIMARY SOURCE: Try Supabase first
    const supabase = getSupabaseClient();

    if (supabase) {
      let query;
      let countQuery;

      // Use the distance RPC if zip is provided
      if (zipCode) {
        const location = zipcodes.lookup(zipCode);
        if (location) {
          query = supabase.rpc('search_colleges_by_distance', {
            origin_lat: location.latitude,
            origin_lon: location.longitude,
            max_distance_miles: distanceMiles
          });
          countQuery = supabase.rpc('search_colleges_by_distance', {
            origin_lat: location.latitude,
            origin_lon: location.longitude,
            max_distance_miles: distanceMiles
          }, { count: 'exact' });
        } else {
          // Invalid zip code, fallback to normal query but maybe warn?
          query = supabase.from('institutions').select('id, name, city, state, institution_type, type:institution_type, tuition, admission_rate, graduation_rate, median_earnings, net_price_by_income, student_faculty_ratio, loan_stats, demographics, retention_rate, description, crime_stats, city_crime_stats, local_housing_stats, image_url', { count: 'exact' });
          countQuery = query;
        }
      } else {
        query = supabase.from('institutions').select('id, name, city, state, institution_type, type:institution_type, tuition, admission_rate, graduation_rate, median_earnings, net_price_by_income, student_faculty_ratio, loan_stats, demographics, retention_rate, description, crime_stats, city_crime_stats, local_housing_stats, image_url', { count: 'exact' });
        countQuery = query;
      }

      // Apply standard filters
      if (idFilter) {
        query = query.eq('id', parseInt(idFilter));
      }
      if (stateFilter) {
        query = query.eq('state', stateFilter);
      }
      if (typeFilter) {
        query = query.ilike('institution_type', `%${typeFilter}%`);
      }
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Apply Tier logic (using JSONB querying for admission rates)
      // Admissions rate is stored in admissions->>'admission_rate_overall'
      if (tierFilter) {
        switch (tierFilter) {
          case '1':
            // Tier 1: Highly Selective (< 25%)
            query = query.lt('admissions->>admission_rate_overall', 0.25);
            break;
          case '2':
            // Tier 2: Selective (25% - 60%)
            query = query.gte('admissions->>admission_rate_overall', 0.25)
                         .lte('admissions->>admission_rate_overall', 0.60);
            break;
          case '3':
            // Tier 3: Accessible (> 60%)
            query = query.gt('admissions->>admission_rate_overall', 0.60);
            break;
          case 'community':
            // Community: 2-year and less than 2-year
            query = query.or('institution_type.ilike.%2-year%,institution_type.ilike.%less than 2-year%');
            break;
          case 'unranked':
            // Unranked: 4-year but no admission rate data
            query = query.ilike('institution_type', '%4-year%')
                         .is('admissions->>admission_rate_overall', null);
            break;
        }
      }

      // For standard search we order by name. For distance search it's already ordered by distance natively in the RPC.
      if (!zipCode) {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const [{ data: colleges, error }, { count }] = await Promise.all([
        query,
        countQuery
      ]);

      if (!error && colleges && colleges.length > 0) {
        let results = colleges.map(transformCollege);

        if (maxTuition) {
          results = results.filter((c: TransformedCollege) =>
            c.tuition === null || c.tuition <= parseInt(maxTuition)
          );
        }

        return NextResponse.json({
          colleges: results,
          total: count || results.length,
          limit,
          offset,
          source: 'supabase'
        });
      }
    }

    // FALLBACK SOURCE: Try local JSON files
    const localDataPath = getDataPath();

    if (localDataPath) {
      const allFiles = fs.readdirSync(localDataPath).filter((f: string) => f.endsWith('.json'));
      const colleges: TransformedCollege[] = [];

      for (const file of allFiles) {
        try {
          const filePath = path.join(localDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          const college = transformCollege(data);

          if (idFilter && college.id !== parseInt(idFilter)) continue;

          if (!idFilter) {
            if (typeFilter && !college.type.toLowerCase().includes(typeFilter)) continue;
            if (maxTuition && college.tuition !== null && college.tuition > parseInt(maxTuition)) continue;
            if (stateFilter && college.state !== stateFilter) continue;
            if (searchQuery && !college.name.toLowerCase().includes(searchQuery)) continue;
          }

          colleges.push(college);
        } catch (e) {
          console.error(`Error processing file ${file}:`, e);
        }
      }

      if (colleges.length > 0) {
        colleges.sort((a, b) => a.name.localeCompare(b.name));

        // Manual pagination for local results
        const paginatedColleges = colleges.slice(offset, offset + limit);

        return NextResponse.json({
          colleges: paginatedColleges,
          total: colleges.length,
          limit,
          offset,
          source: 'local'
        });
      }
    }

    return NextResponse.json({
      colleges: [],
      total: 0,
      source: 'none',
      error: 'No data available'
    });
  } catch (error) {
    console.error('Error reading college data:', error);
    return NextResponse.json(
      { error: 'Failed to load college data' },
      { status: 500 }
    );
  }
}
// deploy
