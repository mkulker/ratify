-- Modify the song_ratings table to allow ratings from 1 to 10 instead of 1 to 5
ALTER TABLE song_ratings
  DROP CONSTRAINT IF EXISTS song_ratings_rating_check;

ALTER TABLE song_ratings
  ADD CONSTRAINT song_ratings_rating_check
  CHECK (rating >= 1 AND rating <= 10);

-- Comment explaining the change
COMMENT ON COLUMN song_ratings.rating IS 'Rating from 1-10 where odd numbers represent half stars (1=0.5 stars, 2=1 star, etc)';