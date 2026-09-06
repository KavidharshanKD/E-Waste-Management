-- V10: India Focused E-Waste Compliance Support Module Schema

ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS cpcb_registration_ref VARCHAR(100);
ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS registration_validity_date DATE;
ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS authorized_capacity_tons_per_annum DOUBLE;
ALTER TABLE recycling_centers ADD COLUMN IF NOT EXISTS verification_authority VARCHAR(150) DEFAULT 'State Pollution Control Board / CPCB';

CREATE TABLE IF NOT EXISTS compliance_guidelines (
    id BIGSERIAL PRIMARY KEY,
    section_key VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    detailed_content TEXT,
    legal_framework_reference VARCHAR(255),
    disclaimer_text TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Informational Guidelines for India E-Waste Management Rules Framework
INSERT INTO compliance_guidelines (section_key, title, summary, detailed_content, legal_framework_reference, disclaimer_text) VALUES
('RESPONSIBLE_DISPOSAL',
 'Responsible E-Waste Disposal',
 'Understanding environmentally sound management of electrical and electronic equipment in India.',
 'Responsible e-waste disposal mandates that consumers, commercial entities, and institutions channel discarded electronics exclusively through authorized collection channels and registered recyclers. Under India''s E-Waste Management Rules, unauthorized dumping in municipal solid waste stream or selling to unorganized scrap dealers is strictly discouraged to prevent toxic heavy metal leaching and land contamination.',
 'E-Waste (Management) Rules, 2022 - Ministry of Environment, Forest and Climate Change (MoEFCC), Govt. of India',
 'Registration information and regulatory guidelines should be independently verified with the relevant authority (CPCB / State Pollution Control Board).'),

('EPR_CONCEPT',
 'Extended Producer Responsibility (EPR)',
 'Overview of producer obligations, collection targets, and EPR portal compliance for electronics manufacturers.',
 'Extended Producer Responsibility (EPR) is the cornerstone of India''s e-waste regulatory framework. Electronics producers, importers, and brand owners (PIBOs) are mandated to fulfill annual e-waste collection and recycling targets based on their historical sales volume. Producers execute EPR obligations through registered recyclers, acquiring verified EPR certificates registered on the CPCB Portal.',
 'Rule 5 & Schedule III, E-Waste (Management) Rules, 2022 - Central Pollution Control Board (CPCB)',
 'Registration information should be independently verified with the relevant authority. EPR certificate validity is subject to statutory audit by CPCB.'),

('REGISTERED_RECYCLER_IMPORTANCE',
 'Importance of Registered Recyclers',
 'Why utilizing State PCB / CPCB registered dismantlers and recyclers is critical for statutory compliance.',
 'Registered recyclers operate state-of-the-art facilities equipped with dust extraction, vacuum shredders, precious metal recovery units, and closed-loop effluent treatment. By utilizing registered recyclers, institutions receive official disposal certificates and audit trails verifying environmentally sound processing (ESM) in compliance with CPCB technical guidelines.',
 'CPCB Technical Guidelines for Implementation of E-Waste Management Rules',
 'Registration information should be independently verified with the relevant authority. Facilities listed on this platform are for awareness and logistics assistance.'),

('SAFE_BATTERY_HANDLING',
 'Safe Battery & Hazardous Electronic Waste Handling',
 'Protocols for managing Lithium-ion, Lead-acid, mercury-bearing, and hazardous component disposal.',
 'Batteries and mercury-containing devices require specialized handling to prevent fire hazards, thermal runaway, and chemical exposure. Damaged Li-ion batteries should be insulated with non-conductive tape over terminal pins before transport. Fluorescent lamps and CRT monitors must remain intact to prevent mercury vapor and leaded glass dust leakage.',
 'Battery Waste Management Rules, 2022 & E-Waste Management Rules, 2022',
 'Registration information should be independently verified with the relevant authority. Always check local hazardous material transit rules.'),

('INFORMAL_DISPOSAL_HAZARDS',
 'Hazards of Informal Sector Disposal',
 'Why open burning, acid bathing, and unorganized scrap dealer dumping damage public health and ecology.',
 'Over 80% of e-waste in developing regions historically flowed into informal scrap markets where primitive extraction methods are employed—such as open cyanide/acid leaching for gold recovery, open burning of wire insulation releasing dioxins, and dumping leaded glass into local waterways. Disposing of electronics through formal channels protects worker health and eliminates toxic environmental contamination.',
 'National Green Tribunal (NGT) Guidelines & MoEFCC E-Waste Health Hazard Assessment',
 'Registration information should be independently verified with the relevant authority. Information provided herein serves educational awareness.');

-- Update existing sample recycling centers with registration reference data
UPDATE recycling_centers 
SET cpcb_registration_ref = 'CPCB/EW-RECY/TN/2024/1092',
    registration_validity_date = '2028-12-31',
    authorized_capacity_tons_per_annum = 5000.0,
    verification_authority = 'Tamil Nadu Pollution Control Board (TNPCB)'
WHERE id = 1;

UPDATE recycling_centers 
SET cpcb_registration_ref = 'CPCB/EW-RECY/KA/2023/8841',
    registration_validity_date = '2027-06-30',
    authorized_capacity_tons_per_annum = 7500.0,
    verification_authority = 'Karnataka State Pollution Control Board (KSPCB)'
WHERE id = 2;
