import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type User = {
  id: string;
  spotify_id: string;
  display_name: string;
  profile_image_url: string;
  created_at: string;
};

export type Album = {
  id: string;
  spotify_id: string;
  name: string;
  artist: string;
  image_url: string;
  created_at: string;
};

export type AlbumRating = {
  id: string;
  user_id: string;
  album_id: string;
  rating: number;
  review?: string;
  created_at: string;
};

export type Song = {
  id: string;
  spotify_id: string;
  name: string;
  artist: string;
  album_id: string;
  created_at: string;
};

export type SongRating = {
  id: string;
  user_id: string;
  song_id: string;
  rating: number;
  review?: string;
  created_at: string;
}; 