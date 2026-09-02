-- V2__seed_dev_data.sql
-- Development Seed Data for Smart E-Waste Management System

-- 1. Insert Initial System Users
INSERT INTO users (email, password, role, active, reward_points_balance)
VALUES 
('admin@ewaste.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'ADMIN', TRUE, 500),
('collector@ewaste.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'COLLECTOR', TRUE, 0),
('recycler@ewaste.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'RECYCLER', TRUE, 0),
('resident@ewaste.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'USER', TRUE, 150);

-- 2. Insert User Profiles
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, address, city, state, postal_code)
VALUES
(1, 'System', 'Admin', '+91 9876543210', '100 Tech Park Way', 'Bengaluru', 'Karnataka', '560001'),
(2, 'Ramesh', 'Kumar', '+91 9876543211', '45 Logistics Hub', 'Bengaluru', 'Karnataka', '560002'),
(3, 'GreenCycle', 'Facility', '+91 9876543212', '12 Industrial Area Phase 2', 'Bengaluru', 'Karnataka', '560058'),
(4, 'Anita', 'Sharma', '+91 9876543213', '78 Green Avenue, Indiranagar', 'Bengaluru', 'Karnataka', '560038');

-- 3. Insert Recycling Center
INSERT INTO recycling_centers (name, address, city, state, postal_code, latitude, longitude, contact_phone, contact_email, processing_capacity_kg_per_day, active)
VALUES
('EcoRecycle Hub Bengaluru', '12 Industrial Area Phase 2', 'Bengaluru', 'Karnataka', '560058', 12.9716, 77.5946, '+91 8023456789', 'info@ecorecyclehub.in', 5000.00, TRUE);

-- 4. Insert Recycler Profile
INSERT INTO recyclers (user_id, center_id, company_name, license_number, verification_status)
VALUES
(3, 1, 'GreenCycle Solutions Pvt Ltd', 'REC-KA-2026-0089', 'APPROVED');
