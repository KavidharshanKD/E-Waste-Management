-- V3__user_ewaste_workflow.sql
-- Add fields for citizen user disposal workflow

ALTER TABLE disposal_requests ADD COLUMN pickup_required BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE ewaste_items ADD COLUMN device_name VARCHAR(150);
ALTER TABLE ewaste_items ADD COLUMN approx_age_years INT;
ALTER TABLE ewaste_items ADD COLUMN working_status VARCHAR(50);
ALTER TABLE ewaste_items ADD COLUMN image_url VARCHAR(500);
