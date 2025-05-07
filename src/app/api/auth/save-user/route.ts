import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();
    console.log('Received user data:', user);

    if (!user || !user.id) {
      console.error('Invalid user data received:', user);
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }
    
    // Create an admin client that bypasses RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('spotify_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing user:', fetchError);
      throw fetchError;
    }

    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      // Update existing user
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          display_name: user.display_name,
          profile_image_url: user.images?.[0]?.url || null,
        })
        .eq('spotify_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      return NextResponse.json(data);
    }

    console.log('Creating new user with spotify_id:', user.id);
    // Create new user
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        spotify_id: user.id,
        display_name: user.display_name || 'Ratify User',
        profile_image_url: user.images?.[0]?.url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log('Successfully saved user:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { error: 'Failed to save user', details: error },
      { status: 500 }
    );
  }
}