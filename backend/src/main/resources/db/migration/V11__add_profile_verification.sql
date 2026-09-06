-- Add verified column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
