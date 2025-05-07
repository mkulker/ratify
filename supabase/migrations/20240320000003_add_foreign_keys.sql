-- Add foreign key constraint for song_likes
alter table song_likes
  add constraint song_likes_song_id_fkey
  foreign key (song_id)
  references songs(spotify_id)
  on delete cascade; 