import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Await the params according to Next.js requirements
    const params = await context.params;
    const songId = params.id;
    
    // Properly await cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('spotify_access_token')?.value;
    const userId = cookieStore.get('user_id')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Get user's spotify_id - we need this regardless of approach
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

    // Check if song exists in songs table first
    const { data: existingSong } = await supabase
      .from('songs')
      .select('spotify_id')
      .eq('spotify_id', songId)
      .single();

    // If song doesn't exist in the songs table, fetch it and add it
    if (!existingSong) {
      // Fetch song details from Spotify
      const songResponse = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!songResponse.ok) {
        throw new Error('Failed to fetch song details from Spotify');
      }

      const songData = await songResponse.json();
      
      // Insert the song into songs table with correct column names
      const { error: songInsertError } = await supabase.from('songs').insert({
        spotify_id: songId,
        name: songData.name,
        artist: songData.artists.map((artist: any) => artist.name).join(', '),
        album_id: songData.album.id, // Use album_id instead of album
      });

      if (songInsertError) {
        console.error('Error adding song to database:', songInsertError);
        return NextResponse.json(
          { error: 'Failed to add song to database' },
          { status: 500 }
        );
      }
    }

    // Now add the like to the database
    const { error } = await supabase.from('song_likes').insert({
      spotify_id: spotifyId,
      song_id: songId,
    });

    if (error) {
      console.error('Error adding like:', error);
      return NextResponse.json(
        { error: 'Failed to add like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json(
      { error: 'Failed to add like' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Await the params according to Next.js requirements
    const params = await context.params;
    const songId = params.id;
    
    // Properly await cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('spotify_access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    // Get user's spotify_id
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

    // Remove like from database using spotify_id
    const { error } = await supabase
      .from('song_likes')
      .delete()
      .match({
        spotify_id: spotifyId,
        song_id: songId,
      });

    if (error) {
      console.error('Error removing like:', error);
      return NextResponse.json(
        { error: 'Failed to remove like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing like:', error);
    return NextResponse.json(
      { error: 'Failed to remove like' },
      { status: 500 }
    );
  }
}