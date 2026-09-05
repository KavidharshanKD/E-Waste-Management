-- V6: Add doorstep pickup scheduling fields to pickups table

ALTER TABLE pickups ADD COLUMN time_slot VARCHAR(30);
ALTER TABLE pickups ADD COLUMN contact_number VARCHAR(30);
ALTER TABLE pickups ADD COLUMN pickup_address VARCHAR(255);
ALTER TABLE pickups ADD COLUMN user_notes TEXT;
