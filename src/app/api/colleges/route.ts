import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CollegeData {
  institution_id: number;
  name: string;
  city: string;
  state: string;
  institution_type: string | null;
  cost: {
    tuition_in_state: number | null;
    tuition_out_of_state: number | null;
  };
  admissions: {
    admission_rate_overall: number | null;
  };
  completion: {
    completion_rate_6_year: number | null;
  };
  earnings: {
    median_10_yrs: number | null;
  };
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
}

// For Vercel deployment, we'll use smaller dataset for faster builds
function getDataPath(): string {
  // Check if running locally or on Vercel
  const localPath = '/Users/archesankola/.openclaw/workspace/college-dataops/data/normalized/institutions';
  const bundledPath = path.join(process.cwd(), 'data', 'institutions');
  const smallPath = path.join(process.cwd(), 'data-small');
  
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  if (fs.existsSync(smallPath)) {
    return smallPath;
  }
  return bundledPath;
}

function transformCollege(data: CollegeData): TransformedCollege {
  // Handle tuition - prefer in_state, fallback to out_of_state
  const tuition = data.cost?.tuition_in_state ?? data.cost?.tuition_out_of_state ?? null;
  
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
  
  return {
    id: data.institution_id,
    name: data.name,
    city: data.city,
    state: data.state,
    type,
    tuition,
    admission_rate: admissionRate,
    graduation_rate: graduationRate,
    median_earnings: data.earnings?.median_10_yrs ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for single ID lookup
    const idFilter = searchParams.get('id');
    
    // Filter params
    const typeFilter = searchParams.get('type')?.toLowerCase();
    const maxTuition = searchParams.get('max_tuition');
    const stateFilter = searchParams.get('state')?.toUpperCase();
    const searchQuery = searchParams.get('q')?.toLowerCase();
    
    const dataPath = getDataPath();
    
    // Read all JSON files
    const files = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
    
    const colleges: TransformedCollege[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(dataPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data: CollegeData = JSON.parse(fileContent);
        
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
    
    // If looking for specific ID and not found, return error
    if (idFilter && colleges.length === 0) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }
    
    // Sort by name
    colleges.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({
      colleges,
      total: colleges.length
    });
  } catch (error) {
    console.error('Error reading college data:', error);
    return NextResponse.json(
      { error: 'Failed to load college data' },
      { status: 500 }
    );
  }
}
