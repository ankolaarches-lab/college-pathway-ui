import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, points, reputation_level')
        .gt('points', 0)
        .order('points', { ascending: false })
        .limit(5);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
