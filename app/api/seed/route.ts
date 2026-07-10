import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint seeds dummy data for the app demo
// Only runs if no dummy users exist

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Check if already seeded
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('is_dummy', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ status: 'already_seeded' });
    }

    return NextResponse.json({ status: 'seed_needed', message: 'Please use the client-side seed' });
  } catch (err) {
    return NextResponse.json({ error: 'Seed check failed' }, { status: 500 });
  }
}
