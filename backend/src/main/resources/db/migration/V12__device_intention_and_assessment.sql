-- V12__device_intention_and_assessment.sql
-- Module 1: Capture user intention and extended device assessment attributes for ML readiness

-- Add user intention to disposal requests (defaults to 'UNSURE' for backward compatibility)
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS user_intention VARCHAR(30) DEFAULT 'UNSURE';

-- Add user intention, operational status, and safety assessment attributes to ewaste items
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS user_intention VARCHAR(30) DEFAULT 'UNSURE';
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS powers_on BOOLEAN;
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS screen_condition VARCHAR(50);
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS battery_swollen BOOLEAN DEFAULT FALSE;
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS battery_leaking BOOLEAN DEFAULT FALSE;
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS overheating_evidence BOOLEAN DEFAULT FALSE;
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS severe_physical_damage BOOLEAN DEFAULT FALSE;
ALTER TABLE ewaste_items ADD COLUMN IF NOT EXISTS functional_issues VARCHAR(500);
