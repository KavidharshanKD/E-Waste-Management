-- V13__add_ml_recommendation_audit.sql
-- Module 6: Persistence of ML Recommendation Audit, Model Provenance, and Inspection Flags

-- 1. Recommendation Source (ML, RULE_BASED_FALLBACK, SAFETY_RULE)
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS recommendation_source VARCHAR(30) DEFAULT 'RULE_BASED_FALLBACK';

-- 2. ML Provenance and Inference Metrics
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_model_version VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_recovery_status VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_recovery_probability NUMERIC(5,4);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_raw_pathway VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_display_recommendation VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_pathway_probability NUMERIC(5,4);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_confidence_level VARCHAR(20);

-- 3. Human Gate & Triage Flags
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS technician_review_required BOOLEAN DEFAULT FALSE;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS inspection_recommended BOOLEAN DEFAULT FALSE;

-- 4. Marketplace Commercial Assessment Status (Advisory only - never auto-approved)
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS marketplace_eligibility VARCHAR(50) DEFAULT 'NOT_ASSESSED';

-- 5. Structured Explanation from ML Inference
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_explanation TEXT;
