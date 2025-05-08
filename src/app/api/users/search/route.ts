import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Search for users whose display_name contains the query string (case insensitive)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, spotify_id, display_name, profile_image_url')
      .ilike('display_name', `%${query}%`)
      .order('display_name')
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in user search:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}