import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Await the params according to Next.js requirements
    const params = await context.params;
    const albumId = params.id;
    
    // Properly await cookies() as required by Next.js
    const cookieStore = await cookies();
    const token = cookieStore.get('spotify_access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Get user profile from Spotify
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await response.json();
    const spotifyId = userData.id;

    // Check if album is liked
    const { data, error } = await supabase
      .from('album_likes')
      .select('*')
      .match({
        spotify_id: spotifyId,
        album_id: albumId,
      })
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking album like status:', error);
      return NextResponse.json(
        { error: 'Failed to check album like status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ isLiked: !!data });
  } catch (error) {
    console.error('Error checking album like status:', error);
    return NextResponse.json(
      { error: 'Failed to check album like status' },
      { status: 500 }
    );
  }
}