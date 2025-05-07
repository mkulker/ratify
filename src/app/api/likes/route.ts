import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
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

    // Get liked songs from database
    const { data: likedSongs, error } = await supabase
      .from('song_likes')
      .select('song_id')
      .eq('spotify_id', spotifyId);

    if (error) {
      console.error('Error fetching liked songs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch liked songs' },
        { status: 500 }
      );
    }

    if (!likedSongs || likedSongs.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch song details from Spotify
    const songIds = likedSongs.map((song) => song.song_id);
    const songsResponse = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${songIds.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!songsResponse.ok) {
      throw new Error('Failed to fetch song details from Spotify');
    }

    const songsData = await songsResponse.json();
    return NextResponse.json(songsData.tracks);
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked songs' },
      { status: 500 }
    );
  }
}