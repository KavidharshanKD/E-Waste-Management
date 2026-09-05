-- V4__recommendation_engine.sql
-- Add fields for Smart Disposal Recommendation Engine

ALTER TABLE disposal_requests ADD COLUMN recommendation_explanation TEXT;
ALTER TABLE disposal_requests ADD COLUMN handling_advice TEXT;

ALTER TABLE ewaste_items ADD COLUMN battery_condition VARCHAR(50);
ALTER TABLE ewaste_items ADD COLUMN damage_condition VARCHAR(50);
