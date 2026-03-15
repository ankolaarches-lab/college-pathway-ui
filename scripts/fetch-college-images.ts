// Script to add image_url column and fetch college images from Wikipedia
import { createClient } from '@supabase/supabase-js';
import https from 'https';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Clean up college name for better Wikipedia search
function cleanCollegeName(name: string): string {
  // Remove campus suffixes like "Penn State Beaver", "UCLA" variations
  return name
    .replace(/-\s*.*$/, '')  // Remove everything after hyphen (campus names)
    .replace(/\s*(campus|branch|college|university)\s*$/i, '')  // Remove trailing campus/branch
    .trim();
}

// Fetch Wikipedia image for a college
async function getWikipediaImage(collegeName) {
  const cleanName = cleanCollegeName(collegeName);
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`;
  
  return new Promise((resolve) => {
    https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (json.query?.search?.[0]) {
            const pageId = json.query.search[0].pageid;
            const imageUrl = await getPageImage(pageId);
            resolve(imageUrl);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function getPageImage(pageId) {
  const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
  
  return new Promise((resolve) => {
    https.get(infoUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const page = json.query?.pages?.[pageId];
          resolve(page?.thumbnail?.source || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  // First, try to add the column (will fail if already exists, that's ok)
  console.log('Ensuring image_url column exists...');
  try {
    await supabase.rpc('exec_sql', { 
      query: 'ALTER TABLE institutions ADD COLUMN IF NOT EXISTS image_url TEXT;' 
    });
  } catch (e) {
    // Column might already exist or RPC not available - continue
    console.log('Column creation skipped (may already exist)');
  }
  
  // Fetch institutions without images - prioritize by name (larger schools tend to be alphabetically first)
  const { data: institutions, error } = await supabase
    .from('institutions')
    .select('id, name, image_url')
    .is('image_url', null)
    .order('name')
    .limit(50);
  
  if (error) {
    console.error('Error fetching institutions:', error);
    return;
  }
  
  console.log(`Found ${institutions.length} institutions without images`);
  
  let updated = 0;
  for (const inst of institutions) {
    console.log(`Fetching image for: ${inst.name}`);
    const imageUrl = await getWikipediaImage(inst.name);
    
    if (imageUrl) {
      const { error: updateError } = await supabase
        .from('institutions')
        .update({ image_url: imageUrl })
        .eq('id', inst.id);
      
      if (!updateError) {
        console.log(`  ✓ Updated: ${imageUrl.substring(0, 60)}...`);
        updated++;
      }
    } else {
      console.log(`  ✗ No image found`);
    }
    
    // Rate limit - wait between requests
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\nDone! Updated ${updated} institutions.`);
}

main();
