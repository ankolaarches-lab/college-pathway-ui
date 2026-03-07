import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institution_id');

    if (!institutionId) {
        return NextResponse.json({ error: 'Institution ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('user_contributions')
        .select(`
      *,
      user_profiles:user_id (display_name, reputation_level)
    `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { institution_id, program_id, data_type, value, description, user_id } = body;

        if (!institution_id || !data_type || value === undefined || !user_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('user_contributions')
            .insert({
                user_id,
                institution_id,
                program_id: program_id || null,
                data_type,
                value,
                description,
                verification_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
