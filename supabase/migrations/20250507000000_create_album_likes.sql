-- Drop existing policies if they exist
drop policy if exists "Users can view their own album likes" on album_likes;
drop policy if exists "Users can insert their own album likes" on album_likes;
drop policy if exists "Users can delete their own album likes" on album_likes;

-- Drop existing table if it exists
drop table if exists album_likes;

-- Create album_likes table with text IDs
create table album_likes (
  id uuid default uuid_generate_v4() primary key,
  spotify_id text not null,
  album_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(spotify_id, album_id)
);

-- Create indexes for better query performance
create index album_likes_spotify_id_idx on album_likes(spotify_id);
create index album_likes_album_id_idx on album_likes(album_id);

-- Enable Row Level Security
alter table album_likes enable row level security;

-- Create policy that allows all operations since we're handling auth in the API
create policy "Allow all operations on album_likes"
  on album_likes
  for all
  using (true)
  with check (true);

-- Add comment to table
comment on table album_likes is 'Stores user likes for albums';