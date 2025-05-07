import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Properly await cookies
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

    // Get liked albums from database
    const { data: likedAlbums, error } = await supabase
      .from('album_likes')
      .select('album_id')
      .eq('spotify_id', spotifyId);

    if (error) {
      console.error('Error fetching liked albums:', error);
      return NextResponse.json(
        { error: 'Failed to fetch liked albums' },
        { status: 500 }
      );
    }

    if (!likedAlbums || likedAlbums.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch album details from Spotify
    const albumIds = likedAlbums.map((album) => album.album_id);
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/albums?ids=${albumIds.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!albumsResponse.ok) {
      throw new Error('Failed to fetch album details from Spotify');
    }

    const albumsData = await albumsResponse.json();
    return NextResponse.json(albumsData.albums);
  } catch (error) {
    console.error('Error fetching liked albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked albums' },
      { status: 500 }
    );
  }
}