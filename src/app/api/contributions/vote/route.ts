import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { contribution_id, user_id } = body;

        if (!contribution_id || !user_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if user already voted
        const { data: existingVote, error: checkError } = await supabase
            .from('contribution_votes')
            .select('id')
            .eq('contribution_id', contribution_id)
            .eq('user_id', user_id)
            .single();

        if (existingVote) {
            return NextResponse.json({ error: 'Already voted' }, { status: 400 });
        }

        // 2. Insert vote (Trigger will handle point updates and verification status)
        const { data, error } = await supabase
            .from('contribution_votes')
            .insert({
                contribution_id,
                user_id,
                vote_type: 'up'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
