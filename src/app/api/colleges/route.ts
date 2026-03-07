import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get local data path (primary source)
function getDataPath(): string | null {
  const paths = [
    '/Users/archesankola/.openclaw/workspace/college-dataops/data/normalized/institutions',
    path.join(process.cwd(), 'data', 'institutions'),
    path.join(process.cwd(), 'data-small'),
  ];
  
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
}

function transformCollege(data: any): TransformedCollege {
  // Handle ID - local JSON uses institution_id, Supabase uses id
  const id = data.id ?? data.institution_id ?? null;
  
  // Handle tuition - prefer in_state, fallback to out_of_state
  // Local JSON has nested cost object, Supabase stores cost as JSON string
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
  
  // If type is unknown, try to infer from completion rates
  if (type === 'Unknown' || type === null) {
    const completion4yr = data.completion?.completion_rate_4_year;
    if (completion4yr !== null && completion4yr !== undefined && completion4yr > 0) {
      type = '4-Year';
    } else {
      type = '2-Year';
    }
  }
  
  // Get net price by income - use public or private depending on institution type
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
  
  // Student-faculty ratio (stored as integer, convert to ratio)
  // Not currently in data - would need to fetch from IPEDS
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
    
    // Map URL params to actual values
    if (typeFilter === '2year') typeFilter = '2-year';
    if (typeFilter === '4year') typeFilter = '4-year';
    
    // PRIMARY SOURCE: Try to load from local JSON files first (they have complete net price data)
    const localDataPath = getDataPath();
    
    if (localDataPath) {
      // Read all JSON files
      const files = fs.readdirSync(localDataPath).filter((f: string) => f.endsWith('.json'));
      
      const colleges: TransformedCollege[] = [];
      
      for (const file of files) {
        try {
          const filePath = path.join(localDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          
          const college = transformCollege(data);
          
          // If looking for specific ID, check first
          if (idFilter && college.id !== parseInt(idFilter)) {
            continue;
          }
          
          // Apply filters (skip if we're looking for a specific ID)
          if (!idFilter) {
            if (typeFilter && !college.type.toLowerCase().includes(typeFilter)) {
              continue;
            }
            
            if (maxTuition && college.tuition !== null && college.tuition > parseInt(maxTuition)) {
              continue;
            }
            
            if (stateFilter && college.state !== stateFilter) {
              continue;
            }
            
            if (searchQuery && !college.name.toLowerCase().includes(searchQuery)) {
              continue;
            }
          }
          
          colleges.push(college);
        } catch (e) {
          // Skip invalid files
          console.error(`Error processing file ${file}:`, e);
        }
      }
      
      // If we found local data, return it
      if (colleges.length > 0) {
        // Sort by name
        colleges.sort((a, b) => a.name.localeCompare(b.name));
        
        return NextResponse.json({
          colleges,
          total: colleges.length,
          source: 'local'
        });
      }
      
      // If no local data found, log and fall through to Supabase
      console.log('No local data found, falling back to Supabase...');
    }
    
    // FALLBACK: Try Supabase if no local data available
    const supabase = getSupabaseClient();
    
    if (supabase) {
      let query = supabase.from('institutions').select('*');
      
      // Apply filters
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
      
      const { data: colleges, error } = await query;
      
      if (!error && colleges && colleges.length > 0) {
        // Transform the data
        let results = colleges.map(transformCollege);
        
        // Apply max_tuition filter
        if (maxTuition) {
          results = results.filter(c => 
            c.tuition === null || c.tuition <= parseInt(maxTuition)
          );
        }
        
        // Sort by name
        results.sort((a, b) => a.name.localeCompare(b.name));
        
        return NextResponse.json({
          colleges: results,
          total: results.length,
          source: 'supabase'
        });
      }
    }
    
    // No data available
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
