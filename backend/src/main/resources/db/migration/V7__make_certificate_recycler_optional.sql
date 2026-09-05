-- V7: Make recycler_id optional on recycling_certificates table
ALTER TABLE recycling_certificates ALTER COLUMN recycler_id DROP NOT NULL;
