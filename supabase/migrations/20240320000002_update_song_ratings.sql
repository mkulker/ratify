-- Drop existing foreign key constraints
alter table if exists song_ratings
  drop constraint if exists song_ratings_song_id_fkey;

-- Drop existing table
drop table if exists song_ratings;

-- Create song_ratings table with text IDs
create table song_ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  song_id text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, song_id)
);

-- Create indexes
create index song_ratings_user_id_idx on song_ratings(user_id);
create index song_ratings_song_id_idx on song_ratings(song_id);

-- Enable RLS
alter table song_ratings enable row level security;

-- Create policy
create policy "Allow all operations on song_ratings"
  on song_ratings
  for all
  using (true)
  with check (true);

-- Add foreign key constraint
alter table song_ratings
  add constraint song_ratings_song_id_fkey
  foreign key (song_id)
  references songs(spotify_id)
  on delete cascade;

-- Add comment
comment on table song_ratings is 'Stores user ratings for songs'; 