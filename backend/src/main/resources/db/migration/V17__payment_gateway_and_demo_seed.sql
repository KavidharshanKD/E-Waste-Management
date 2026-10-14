-- V17__payment_gateway_and_demo_seed.sql
-- Comprehensive Database Seed (2-3 realistic records in every table)
-- and Payment Gateway Transaction tracking schema extension

-- 1. Extend Marketplace Orders for Payment Gateway Tracking
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100);
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);

-- 2. Insert Additional System Users
INSERT INTO users (email, password, role, active, reward_points_balance)
VALUES 
('priya.sharma@example.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'USER', TRUE, 260),
('arun.patel@techcorp.in', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'USER', TRUE, 750),
('suresh.logistics@ewaste.com', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'COLLECTOR', TRUE, 0),
('mumbai.circular@ecorecycle.in', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'RECYCLER', TRUE, 0),
('chennai.circular@ecorecycle.in', '$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z', 'RECYCLER', TRUE, 0);

-- 3. Insert Additional User Profiles
INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, address, city, state, postal_code, user_type, organization_name, organization_type, gst_number, contact_person)
VALUES
(5, 'Priya', 'Sharma', '+91 9840123456', '14 Besant Nagar Beach Road', 'Chennai', 'Tamil Nadu', '600090', 'INDIVIDUAL', NULL, NULL, NULL, NULL),
(6, 'Arun', 'Patel', '+91 9820987654', 'TechCorp Tower, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', 'INSTITUTION', 'TechCorp Global IT India', 'CORPORATE', '27AAACT1984L1Z9', 'Arun Patel (VP IT Asset Management)'),
(7, 'Suresh', 'Nadar', '+91 9789012345', 'Guindy Logistics Hub 4B', 'Chennai', 'Tamil Nadu', '600032', 'INDIVIDUAL', NULL, NULL, NULL, NULL),
(8, 'Vikram', 'Mehta', '+91 9821345678', 'Plot 12 MIDC Andheri East', 'Mumbai', 'Maharashtra', '400093', 'INDIVIDUAL', 'CleanEarth Green Processing Plant', NULL, NULL, NULL),
(9, 'Karthik', 'Rajan', '+91 9840998877', 'B-14 Guindy Industrial Estate', 'Chennai', 'Tamil Nadu', '600032', 'INDIVIDUAL', 'GreenTech E-Waste Recyclers', NULL, NULL, NULL);

-- 4. Insert Additional Recycler Entity Records (Unique user_id constraint satisfied)
INSERT INTO recyclers (user_id, center_id, company_name, license_number, verification_status)
VALUES
(8, 4, 'Maharashtra Circular Dismantlers Ltd', 'REC-MH-2026-0012', 'APPROVED'),
(9, 2, 'Tamil Nadu Eco Recovery Facility', 'REC-TN-2026-0044', 'APPROVED');

-- 5. Insert Disposal Requests (Covering Completed, Processing, Scheduled, Submitted, In-Transit)
INSERT INTO disposal_requests (
    tracking_number, user_id, status, recommended_action, pickup_address, pickup_city, pickup_state, pickup_postal_code, preferred_pickup_date, notes, center_id, is_bulk_request, organization_name, created_at, updated_at
) VALUES
(
    'EWR-2026-BLR-001', 4, 'COMPLETED', 'RECYCLE', '78 Green Avenue, Indiranagar', 'Bengaluru', 'Karnataka', '560038', CURRENT_TIMESTAMP - INTERVAL '5' DAY, 'Dead motherboard MacBook Pro disposal with battery insulation.', 1, FALSE, NULL, CURRENT_TIMESTAMP - INTERVAL '5' DAY, CURRENT_TIMESTAMP - INTERVAL '3' DAY
),
(
    'EWR-2026-BLR-002', 4, 'PROCESSING', 'REFURBISH', '78 Green Avenue, Indiranagar', 'Bengaluru', 'Karnataka', '560038', CURRENT_TIMESTAMP - INTERVAL '3' DAY, 'Working ThinkPad laptop for refurbishment evaluation.', 1, FALSE, NULL, CURRENT_TIMESTAMP - INTERVAL '3' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    'EWR-2026-CHN-003', 5, 'SCHEDULED', 'REFURBISH', '14 Besant Nagar Beach Road', 'Chennai', 'Tamil Nadu', '600090', CURRENT_TIMESTAMP + INTERVAL '1' DAY, 'iPhone 11 with intact internals; minor cosmetic scuffs.', 2, FALSE, NULL, CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    'EWR-2026-MUM-004', 6, 'SUBMITTED', 'RECYCLE', 'TechCorp Tower, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', CURRENT_TIMESTAMP + INTERVAL '2' DAY, 'HP LaserJet printer and toner cartridges awaiting pickup.', 4, FALSE, 'TechCorp Global IT India', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'EWR-2026-INST-005', 6, 'IN_TRANSIT', 'REFURBISH', 'TechCorp Tower, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', CURRENT_TIMESTAMP - INTERVAL '1' DAY, 'Bulk lot of 25 enterprise desktop workstations for second-life testing.', 1, TRUE, 'TechCorp Global IT India', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP
);

-- 6. Insert EWaste Items
INSERT INTO ewaste_items (
    request_id, category, brand, model_name, serial_number, condition, weight_kg, quantity, description, estimated_reward_points, created_at, updated_at
) VALUES
(
    1, 'LAPTOP', 'Apple', 'MacBook Pro 13 (2018)', 'C02W9308HV29', 'POOR', 2.10, 1, 'Corroded motherboard after beverage spill. Power disabled.', 150, CURRENT_TIMESTAMP - INTERVAL '5' DAY, CURRENT_TIMESTAMP - INTERVAL '5' DAY
),
(
    2, 'LAPTOP', 'Lenovo', 'ThinkPad T480', 'PF18Z0992K', 'GOOD', 1.80, 1, 'Core i5 8th Gen, boots to BIOS cleanly, 8GB RAM.', 100, CURRENT_TIMESTAMP - INTERVAL '3' DAY, CURRENT_TIMESTAMP - INTERVAL '3' DAY
),
(
    3, 'MOBILE_PHONE', 'Apple', 'iPhone 11 128GB', 'F2LZ9092N73M', 'FAIR', 0.20, 1, 'Minor frame scuffs; touch digitizer and cameras working.', 60, CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    4, 'PRINTER', 'HP', 'LaserJet Pro M404dn', 'VNB3890211', 'GOOD', 8.50, 1, 'Duplex network monochrome printer with power cable.', 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    5, 'DESKTOP', 'Dell', 'OptiPlex 7070 Workstations (25 Units)', 'BULK-DELL-7070-25X', 'GOOD', 125.00, 25, 'Enterprise fleet retirement; quad-core Intel systems without storage.', 500, CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '2' DAY
);

-- 7. Insert Pickups (request_id UNIQUE constraint satisfied)
INSERT INTO pickups (
    request_id, collector_id, scheduled_date, actual_pickup_date, status, collector_notes, verification_code, created_at, updated_at
) VALUES
(
    1, 2, CURRENT_TIMESTAMP - INTERVAL '4' DAY, CURRENT_TIMESTAMP - INTERVAL '4' DAY, 'COMPLETED', 'Collected securely in anti-static bag; sealed package.', '9482', CURRENT_TIMESTAMP - INTERVAL '5' DAY, CURRENT_TIMESTAMP - INTERVAL '4' DAY
),
(
    2, 2, CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '2' DAY, 'COMPLETED', 'Hardware intake confirmed with donor Anita Sharma.', '3819', CURRENT_TIMESTAMP - INTERVAL '3' DAY, CURRENT_TIMESTAMP - INTERVAL '2' DAY
),
(
    3, 7, CURRENT_TIMESTAMP + INTERVAL '1' DAY, NULL, 'SCHEDULED', 'Scheduled for morning pickup window (10:00 AM - 1:00 PM).', '4829', CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    5, 2, CURRENT_TIMESTAMP, NULL, 'ON_THE_WAY', 'Transit van dispatched to Bandra Kurla Complex for bulk load.', '7103', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP
);

-- 8. Insert Disposal Status Histories
INSERT INTO disposal_status_histories (request_id, from_status, to_status, changed_by_id, comment, timestamp)
VALUES
(1, 'SUBMITTED', 'APPROVED', 1, 'Automated verification check passed.', CURRENT_TIMESTAMP - INTERVAL '5' DAY),
(1, 'APPROVED', 'SCHEDULED', 1, 'Collector Ramesh assigned.', CURRENT_TIMESTAMP - INTERVAL '4' DAY),
(1, 'SCHEDULED', 'COLLECTED', 2, 'Item collected at doorstep.', CURRENT_TIMESTAMP - INTERVAL '4' DAY),
(1, 'COLLECTED', 'IN_TRANSIT', 2, 'Transporting to Bengaluru EcoRecycle Hub.', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(1, 'IN_TRANSIT', 'PROCESSING', 3, 'Facility intake weighing completed.', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(1, 'PROCESSING', 'COMPLETED', 3, 'Safe material recycling and chemical diversion completed.', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(2, 'SUBMITTED', 'APPROVED', 1, 'Intake approved for refurbishment review.', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(2, 'APPROVED', 'SCHEDULED', 1, 'Pickup scheduled.', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(2, 'SCHEDULED', 'COLLECTED', 2, 'Collected and transported.', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(2, 'COLLECTED', 'PROCESSING', 3, 'Assigned to technician for restoration evaluation.', CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- 9. Insert Reward Transactions (Green Points)
INSERT INTO reward_transactions (user_id, request_id, points, transaction_type, description, created_at)
VALUES
(4, 1, 150, 'EARNED', 'Recycling incentive: MacBook Pro 13 (2.1 kg) processed.', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(4, 2, 100, 'EARNED', 'Circular donation bonus: ThinkPad hardware intake.', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(5, 3, 50, 'EARNED', 'Welcome eco-points for scheduling first smartphone pickup.', CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(6, 5, 500, 'EARNED', 'Enterprise ESG Milestone: 125 kg corporate bulk e-waste diverted.', CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- 10. Insert System Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
VALUES
(4, 'Disposal Completed & Certificate Issued', 'Your e-waste disposal (EWR-2026-BLR-001) has been certified. 150 Green Points credited!', 'REWARD', TRUE, CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(4, 'Collector Assigned', 'Collector Ramesh Kumar has been assigned for your pickup on Green Avenue.', 'PICKUP', TRUE, CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(5, 'Pickup Scheduled for Tomorrow', 'Your doorstep collection is confirmed for tomorrow between 10:00 AM - 1:00 PM.', 'PICKUP', FALSE, CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(4, 'Order Paid & Confirmed', 'Payment received via Razorpay for Order #ORD-2026-0001. Hardware prepared for shipping.', 'ORDER', FALSE, CURRENT_TIMESTAMP);

-- 11. Insert Official Verifiable Recycling Certificates (request_id UNIQUE constraint satisfied)
INSERT INTO recycling_certificates (
    certificate_number, request_id, recycler_id, total_weight_kg, hazardous_materials_diverted_kg, issue_date, certificate_url
) VALUES
(
    'EWC-2026-BLR-001', 1, 1, 8.50, 1.20, CURRENT_TIMESTAMP - INTERVAL '3' DAY, '/api/public/certificates/verify/EWC-2026-BLR-001'
),
(
    'EWC-2026-INST-002', 5, 1, 125.00, 14.50, CURRENT_TIMESTAMP - INTERVAL '1' DAY, '/api/public/certificates/verify/EWC-2026-INST-002'
),
(
    'EWC-2026-CHN-003', 3, 3, 3.50, 0.40, CURRENT_TIMESTAMP, '/api/public/certificates/verify/EWC-2026-CHN-003'
);

-- 12. Insert Technician Physical Device Assessments (request_id UNIQUE constraint satisfied)
INSERT INTO device_assessments (
    request_id, assessed_by_id, power_status, screen_assessment, battery_assessment, physical_condition, functional_assessment, diagnosed_issues, repairability_status, technician_decision, safety_hazard_found, safety_notes, recommended_for_marketplace, assessment_notes
) VALUES
(
    2, 3, 'WORKING', 'INTACT', 'HEALTHY_85', 'GOOD', 'Boots cleanly into Linux live OS; all USB ports and keyboard responsive.', 'Minor fan dust build-up; thermal paste aged.', 'HIGHLY_REPAIRABLE', 'REFURBISH', FALSE, 'Zero swelling or hazardous leakage found.', TRUE, 'Candidate for Grade A refurbished laptop catalog listing.'
),
(
    3, 3, 'WORKING', 'INTACT', 'HEALTHY_89', 'GOOD', 'Full display and wireless radios functioning; clean logic board.', 'Minor outer frame wear.', 'HIGHLY_REPAIRABLE', 'REFURBISH', FALSE, 'Battery load curve within nominal parameters.', TRUE, 'Grade B refurbished iPhone 11 listing candidate.'
),
(
    1, 3, 'DEAD', 'INTACT', 'SWOLLEN', 'POOR', 'Total motherboard short circuit. Corrosion on power delivery rails.', 'Burnt power IC, swelling Li-ion battery pouch.', 'UNREPAIRABLE', 'RECYCLE', TRUE, 'Swollen lithium pouch safely isolated in fire-resistant container.', FALSE, 'Direct material recovery and shredding protocol executed.'
);

-- 13. Insert Restoration Jobs
INSERT INTO restoration_jobs (
    request_id, assessment_id, assigned_technician_id, job_type, status, work_started_at, work_completed_at, work_performed, parts_replaced, technician_notes, parts_cost, labor_cost, total_cost
) VALUES
(
    2, 1, 3, 'REFURBISH', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY, 'Cleaned chassis and heatsink. Applied Arctic MX-4 thermal paste. Installed new 512GB NVMe SSD and upgraded to 16GB dual-channel RAM.', '512GB NVMe SSD, 8GB DDR4 RAM stick', 'Passed 4-hour continuous CPU/GPU stress test with max temp 68C.', 1500.00, 800.00, 2300.00
),
(
    3, 2, 3, 'REFURBISH', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY, 'Screen assembly checked, clean housing sanitization and waterproof seal renewed.', 'None - Deep Cleaning & Re-seal', 'Wireless testing and camera resolution tests passed.', 200.00, 600.00, 800.00
),
(
    1, 3, 3, 'DISMANTLE', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3' DAY, CURRENT_TIMESTAMP - INTERVAL '3' DAY, 'Disassembled aluminum unibody. Extracted gold-plated logic board for chemical refining.', 'None - Hazardous component extraction', 'Hazardous lithium cells safely transferred to authorized battery recycler.', 0.00, 300.00, 300.00
);

-- 14. Insert Quality Checks (job_id UNIQUE constraint satisfied)
INSERT INTO quality_checks (
    job_id, checked_by_id, functional_test_passed, power_test_passed, display_test_passed, battery_test_passed, safety_test_passed, cosmetic_grade, overall_result, quality_notes, marketplace_candidate
) VALUES
(
    1, 3, TRUE, TRUE, TRUE, TRUE, TRUE, 'GRADE_A', 'PASS', 'Flawless operational benchmark score. Battery health verified at 86% capacity.', TRUE
),
(
    2, 3, TRUE, TRUE, TRUE, TRUE, TRUE, 'GRADE_B', 'PASS', 'Clean device with all radios verified. Grade B cosmetic standard met.', TRUE
),
(
    3, 3, FALSE, FALSE, FALSE, FALSE, TRUE, 'GRADE_C', 'PASS', 'Safety isolation inspection passed. Non-reusable chassis consigned for smelting.', FALSE
);

-- 15. Insert Marketplace Listings (quality_check_id UNIQUE constraint satisfied)
INSERT INTO marketplace_listings (
    request_id, item_id, quality_check_id, restoration_job_id, center_id, title, description, category, brand, model, cosmetic_grade, condition_summary, technical_summary, work_performed_summary, parts_replaced_summary, selling_price, original_reference_price, warranty_days, stock_status, listing_status, approved_by_id, approved_at, published_at
) VALUES
(
    2, 2, 1, 1, 1,
    'Refurbished Lenovo ThinkPad T480 (Core i5 8th Gen, 16GB RAM, 512GB SSD)',
    'Certified refurbished enterprise laptop. Engineered for durability with legendary ThinkPad keyboard, robust MIL-SPEC chassis, high-speed 512GB NVMe SSD, and dual-battery bridge architecture.',
    'LAPTOP', 'Lenovo', 'ThinkPad T480', 'GRADE_A',
    'Grade A: Excellent cosmetic condition with minimal micro-scratches on outer shell. Screen and keyboard in immaculate condition.',
    'Intel Core i5-8350U Quad-Core (1.7GHz to 3.6GHz), 16GB DDR4 RAM, 512GB NVMe SSD, 14-inch Full HD (1920x1080) IPS display, Windows 11 Pro certified.',
    'Complete dust purge, thermal paste re-application, memory expansion, and fresh SSD initialization.',
    'Replaced: 512GB NVMe SSD and 8GB DDR4 RAM expansion.',
    18500.00, 65000.00, 180, 'SOLD', 'PUBLISHED', 1, CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    3, 3, 2, 2, 2,
    'Refurbished Apple iPhone 11 128GB Black (Certified Clean Second-Life)',
    'Quality checked and certified smartphone. Features 6.1-inch Liquid Retina HD display, A13 Bionic neural engine, dual 12MP Ultra-Wide cameras, and Face ID biometrics.',
    'MOBILE_PHONE', 'Apple', 'iPhone 11', 'GRADE_B',
    'Grade B: Light cosmetic scuffs on outer aluminum frame; pristine glass and display.',
    'Apple A13 Bionic Chip, 128GB Flash Storage, 4GB RAM, Face ID, Wireless Qi Charging, Battery Health 89%.',
    'Deep ultrasonic cleaning and waterproof adhesive sealing.',
    'None - Clean second-life inspection pass.',
    16499.00, 49000.00, 90, 'SOLD', 'PUBLISHED', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 16. Insert Marketplace Listing Images
INSERT INTO marketplace_listing_images (listing_id, image_url, sort_order, is_primary)
VALUES
(1, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80', 0, TRUE),
(1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80', 1, FALSE),
(2, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80', 0, TRUE),
(2, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80', 1, FALSE);

-- 17. Insert Carts & Cart Items (user_id UNIQUE constraint satisfied)
INSERT INTO carts (user_id, created_at, updated_at)
VALUES 
(4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO cart_items (cart_id, listing_id, added_at)
VALUES 
(1, 2, CURRENT_TIMESTAMP);

-- 18. Insert Marketplace Orders (1 Paid via Razorpay, 1 Shipped via Razorpay, 1 Pending Checkout)
INSERT INTO marketplace_orders (
    order_number, buyer_id, status, payment_status, payment_method, payment_transaction_id, razorpay_order_id, subtotal, total_amount, recipient_name, phone_number, address_line, city, state, postal_code, placed_at, confirmed_at, shipped_at
) VALUES
(
    'ORD-2026-0001', 4, 'CONFIRMED', 'PAID', 'RAZORPAY', 'pay_rzp_test_8921a', 'order_rzp_live_001', 18500.00, 18500.00, 'Anita Sharma', '+91 9876543213', '78 Green Avenue, Indiranagar', 'Bengaluru', 'Karnataka', '560038', CURRENT_TIMESTAMP - INTERVAL '1' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY, NULL
),
(
    'ORD-2026-0002', 5, 'SHIPPED', 'PAID', 'RAZORPAY', 'pay_rzp_test_4412b', 'order_rzp_live_002', 16499.00, 16499.00, 'Priya Sharma', '+91 9840123456', '14 Besant Nagar Beach Road', 'Chennai', 'Tamil Nadu', '600090', CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '2' DAY, CURRENT_TIMESTAMP - INTERVAL '1' DAY
),
(
    'ORD-2026-0003', 4, 'PLACED', 'PENDING', 'DEMO_CHECKOUT', NULL, NULL, 18500.00, 18500.00, 'Anita Sharma', '+91 9876543213', '78 Green Avenue, Indiranagar', 'Bengaluru', 'Karnataka', '560038', CURRENT_TIMESTAMP, NULL, NULL
);

-- 19. Insert Marketplace Order Items
INSERT INTO marketplace_order_items (order_id, listing_id, price_at_purchase, title_snapshot, warranty_days_snapshot)
VALUES
(1, 1, 18500.00, 'Refurbished Lenovo ThinkPad T480 (Core i5 8th Gen, 16GB RAM, 512GB SSD)', 180),
(2, 2, 16499.00, 'Refurbished Apple iPhone 11 128GB Black (Certified Clean Second-Life)', 90),
(3, 1, 18500.00, 'Refurbished Lenovo ThinkPad T480 (Core i5 8th Gen, 16GB RAM, 512GB SSD)', 180);

-- 20. Insert Password Reset Tokens
INSERT INTO password_reset_tokens (email, token, expiry_date, used, created_at, updated_at)
VALUES
('resident@ewaste.com', '582914', CURRENT_TIMESTAMP + INTERVAL '15' MINUTE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('priya.sharma@example.com', '194820', CURRENT_TIMESTAMP - INTERVAL '30' MINUTE, TRUE, CURRENT_TIMESTAMP - INTERVAL '45' MINUTE, CURRENT_TIMESTAMP - INTERVAL '30' MINUTE);
