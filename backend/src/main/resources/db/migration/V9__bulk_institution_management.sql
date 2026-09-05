-- V9: Institutional Bulk E-Waste Management & Organization Schema

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS organization_name VARCHAR(150);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS organization_type VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150);

ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS is_bulk_request BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS organization_name VARCHAR(150);

