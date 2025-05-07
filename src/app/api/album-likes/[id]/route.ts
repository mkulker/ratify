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
    const albumId = params.id;
    
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

    // Add like to album_likes table
    const { error } = await supabase.from('album_likes').insert({
      spotify_id: spotifyId,
      album_id: albumId,
    });

    if (error) {
      console.error('Error adding album like:', error);
      return NextResponse.json(
        { error: 'Failed to add album like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding album like:', error);
    return NextResponse.json(
      { error: 'Failed to add album like' },
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
    const albumId = params.id;
    
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

    // Remove like from album_likes table
    const { error } = await supabase
      .from('album_likes')
      .delete()
      .match({
        spotify_id: spotifyId,
        album_id: albumId,
      });

    if (error) {
      console.error('Error removing album like:', error);
      return NextResponse.json(
        { error: 'Failed to remove album like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing album like:', error);
    return NextResponse.json(
      { error: 'Failed to remove album like' },
      { status: 500 }
    );
  }
}