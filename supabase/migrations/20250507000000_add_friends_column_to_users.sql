-- This migration adds a 'friends' column to the 'users' table.

-- Add the 'friends' column as an array of UUIDs.
ALTER TABLE users
ADD COLUMN friends UUID[] DEFAULT '{}'::UUID[];