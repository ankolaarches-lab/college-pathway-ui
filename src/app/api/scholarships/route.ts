import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yprxfmbwbxwdpmazgadp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ajj6Lmb2CDNQI9RFYvJnDw_WwQYKkNR';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const hiddenGem = searchParams.get('hidden_gem');
  const limit = searchParams.get('limit') || '50';

  let query = supabase
    .from('scholarships')
    .select('*')
    .eq('is_active', true)
    .order('deadline_month', { ascending: true })
    .order('deadline_day', { ascending: true })
    .limit(parseInt(limit));

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (hiddenGem === 'true') {
    query = query.eq('is_hidden_gem', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scholarships: data });
}
