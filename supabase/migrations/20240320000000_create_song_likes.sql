-- Drop existing policies if they exist
drop policy if exists "Users can view their own likes" on song_likes;
drop policy if exists "Users can insert their own likes" on song_likes;
drop policy if exists "Users can delete their own likes" on song_likes;

-- Drop existing table if it exists
drop table if exists song_likes;

-- Create song_likes table with text IDs
create table song_likes (
  id uuid default uuid_generate_v4() primary key,
  spotify_id text not null,
  song_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(spotify_id, song_id)
);

-- Create indexes for better query performance
create index song_likes_spotify_id_idx on song_likes(spotify_id);
create index song_likes_song_id_idx on song_likes(song_id);

-- Enable Row Level Security
alter table song_likes enable row level security;

-- Create policy that allows all operations since we're handling auth in the API
create policy "Allow all operations on song_likes"
  on song_likes
  for all
  using (true)
  with check (true);

-- Add foreign key constraint
alter table song_likes
  add constraint song_likes_song_id_fkey
  foreign key (song_id)
  references songs(spotify_id)
  on delete cascade;

-- Add comment to table
comment on table song_likes is 'Stores user likes for songs'; 