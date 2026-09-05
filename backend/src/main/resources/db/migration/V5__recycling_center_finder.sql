-- V5__recycling_center_finder.sql
-- Migration for Location-Based Recycling Center Discovery with Indian City Seed Data

ALTER TABLE recycling_centers ADD COLUMN registration_number VARCHAR(100);
ALTER TABLE recycling_centers ADD COLUMN district VARCHAR(100);
ALTER TABLE recycling_centers ADD COLUMN accepted_waste_categories VARCHAR(500);
ALTER TABLE recycling_centers ADD COLUMN operating_hours VARCHAR(150);
ALTER TABLE recycling_centers ADD COLUMN is_demo_facility BOOLEAN NOT NULL DEFAULT TRUE;

-- Insert Indian City Seed Facilities (Clear Demo Labels)
INSERT INTO recycling_centers (
    name, registration_number, address, city, district, state, postal_code, latitude, longitude, contact_phone, contact_email, accepted_waste_categories, operating_hours, processing_capacity_kg_per_day, active, is_demo_facility, created_at, updated_at
) VALUES 
(
    'GreenTech E-Waste Recyclers (Demo Facility)', 'TN-EWASTE-DEMO-01', 'B-14 Guindy Industrial Estate', 'Chennai', 'Chennai', 'Tamil Nadu', '600032', 13.0067, 80.2020, '+91 44 2250 1234', 'chennai.demo@ewaste-recycle.in', 'MOBILE_PHONE, LAPTOP, BATTERY, MONITOR, PRINTER, CABLE', 'Mon - Sat: 9:00 AM - 6:30 PM', 5000.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'EcoMatrix E-Waste Recycling Hub (Demo Facility)', 'KA-EWASTE-DEMO-02', 'Plot 45 Whitefield Industrial Zone', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560066', 12.9698, 77.7500, '+91 80 4123 5678', 'blr.demo@ewaste-recycle.in', 'LAPTOP, DESKTOP, MOBILE_PHONE, TELEVISION, REFRIGERATOR, BATTERY', 'Mon - Sat: 8:30 AM - 7:00 PM', 8000.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'CleanEarth Green Processing Plant (Demo Facility)', 'MH-EWASTE-DEMO-03', 'Unit 12 Andheri East MIDC Area', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400093', 19.1136, 72.8697, '+91 22 2830 9988', 'mumbai.demo@ewaste-recycle.in', 'MOBILE_PHONE, LAPTOP, MONITOR, TELEVISION, AIR_CONDITIONER, WASHING_MACHINE', 'Mon - Sat: 9:00 AM - 6:00 PM', 6500.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Capital Green E-Waste Recovery Unit (Demo Facility)', 'DL-EWASTE-DEMO-04', 'C-88 Okhla Industrial Area Phase 3', 'New Delhi', 'South East Delhi', 'Delhi', '110020', 28.5355, 77.2690, '+91 11 2684 4321', 'delhi.demo@ewaste-recycle.in', 'LAPTOP, DESKTOP, PRINTER, KEYBOARD, MOUSE, BATTERY, CHARGER', 'Mon - Sat: 9:00 AM - 6:00 PM', 4500.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Deccan Circular Recycling Center (Demo Facility)', 'TS-EWASTE-DEMO-05', 'Phase 2 Gachibowli Tech Park', 'Hyderabad', 'Ranga Reddy', 'Telangana', '500032', 17.4401, 78.3489, '+91 40 6789 1122', 'hyd.demo@ewaste-recycle.in', 'MOBILE_PHONE, LAPTOP, BATTERY, CHARGER, CABLE, MONITOR', 'Mon - Sat: 9:00 AM - 7:00 PM', 6000.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'Kovai Eco Recycling Hub (Demo Facility)', 'TN-EWASTE-DEMO-06', '78 Peelamedu Industrial Estate', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '641004', 11.0267, 77.0028, '+91 422 257 8899', 'cbe.demo@ewaste-recycle.in', 'MOBILE_PHONE, LAPTOP, TELEVISION, REFRIGERATOR, BATTERY, OTHER', 'Mon - Sat: 9:00 AM - 6:00 PM', 3500.00, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
