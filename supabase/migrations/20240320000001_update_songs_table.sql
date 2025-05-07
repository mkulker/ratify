-- Drop existing foreign key constraints
alter table if exists song_likes
  drop constraint if exists song_likes_song_id_fkey;

alter table if exists song_ratings
  drop constraint if exists song_ratings_song_id_fkey;

-- Drop existing table
drop table if exists songs;

-- Create songs table with text IDs
create table songs (
  id uuid default uuid_generate_v4() primary key,
  spotify_id text not null unique,
  name text not null,
  artist text not null,
  album_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index songs_spotify_id_idx on songs(spotify_id);
create index songs_album_id_idx on songs(album_id);

-- Enable RLS
alter table songs enable row level security;

-- Create policy
create policy "Allow all operations on songs"
  on songs
  for all
  using (true)
  with check (true);

-- Add comment
comment on table songs is 'Stores song information from Spotify'; 