import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const song = await request.json();
    console.log('Received song data:', song);

    if (!song.spotify_id || !song.name || !song.artist || !song.album_id) {
      console.error('Invalid song data:', song);
      return NextResponse.json(
        { error: 'Invalid song data' },
        { status: 400 }
      );
    }

    // Check if song already exists
    const { data: existingSong, error: fetchError } = await supabase
      .from('songs')
      .select('*')
      .eq('spotify_id', song.spotify_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing song:', fetchError);
      throw fetchError;
    }

    if (existingSong) {
      console.log('Song already exists:', existingSong);
      return NextResponse.json(existingSong);
    }

    // Create new song
    const { data, error } = await supabase
      .from('songs')
      .insert({
        spotify_id: song.spotify_id,
        name: song.name,
        artist: song.artist,
        album_id: song.album_id,
      })
      .select()
      .single();

    if (error) {
      // If we get a unique constraint violation, try to fetch the existing song
      if (error.code === '23505') {
        const { data: existingSong, error: fetchError } = await supabase
          .from('songs')
          .select('*')
          .eq('spotify_id', song.spotify_id)
          .single();

        if (fetchError) {
          console.error('Error fetching existing song:', fetchError);
          throw fetchError;
        }

        console.log('Returning existing song:', existingSong);
        return NextResponse.json(existingSong);
      }

      console.error('Error creating song:', error);
      throw error;
    }

    console.log('Successfully created song:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving song:', error);
    return NextResponse.json(
      { error: 'Failed to save song', details: error },
      { status: 500 }
    );
  }
} 