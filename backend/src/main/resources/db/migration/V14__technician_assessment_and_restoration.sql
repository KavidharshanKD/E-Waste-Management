-- V14__technician_assessment_and_restoration.sql
-- Module 7: Technician Physical Assessment, Restoration Jobs & Quality Assurance Check Foundation

-- 1. Device Assessments (Physical diagnostics at facility)
CREATE TABLE IF NOT EXISTS device_assessments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL UNIQUE REFERENCES disposal_requests(id) ON DELETE CASCADE,
    assessed_by_id BIGINT NOT NULL REFERENCES users(id),
    power_status VARCHAR(50) NOT NULL,
    screen_assessment VARCHAR(50),
    battery_assessment VARCHAR(50),
    physical_condition VARCHAR(50) NOT NULL,
    functional_assessment VARCHAR(500),
    diagnosed_issues VARCHAR(500),
    repairability_status VARCHAR(50) NOT NULL,
    technician_decision VARCHAR(50) NOT NULL,
    safety_hazard_found BOOLEAN NOT NULL DEFAULT FALSE,
    safety_notes VARCHAR(500),
    recommended_for_marketplace BOOLEAN NOT NULL DEFAULT FALSE,
    assessment_notes TEXT,
    assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_assessments_request ON device_assessments(request_id);
CREATE INDEX IF NOT EXISTS idx_device_assessments_assessed_by ON device_assessments(assessed_by_id);
CREATE INDEX IF NOT EXISTS idx_device_assessments_decision ON device_assessments(technician_decision);

-- 2. Restoration Jobs (For REPAIR or REFURBISH decisions)
CREATE TABLE IF NOT EXISTS restoration_jobs (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES disposal_requests(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES device_assessments(id) ON DELETE CASCADE,
    assigned_technician_id BIGINT NOT NULL REFERENCES users(id),
    job_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    work_started_at TIMESTAMP,
    work_completed_at TIMESTAMP,
    work_performed TEXT,
    parts_replaced VARCHAR(500),
    technician_notes TEXT,
    parts_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_restoration_jobs_request ON restoration_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_restoration_jobs_technician ON restoration_jobs(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_restoration_jobs_status ON restoration_jobs(status);

-- 3. Quality Checks (Rigorous post-restoration verification)
CREATE TABLE IF NOT EXISTS quality_checks (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL UNIQUE REFERENCES restoration_jobs(id) ON DELETE CASCADE,
    checked_by_id BIGINT NOT NULL REFERENCES users(id),
    functional_test_passed BOOLEAN NOT NULL DEFAULT FALSE,
    power_test_passed BOOLEAN NOT NULL DEFAULT FALSE,
    display_test_passed BOOLEAN,
    battery_test_passed BOOLEAN,
    safety_test_passed BOOLEAN NOT NULL DEFAULT FALSE,
    cosmetic_grade VARCHAR(20),
    overall_result VARCHAR(30) NOT NULL,
    quality_notes TEXT,
    marketplace_candidate BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_checks_job ON quality_checks(job_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_candidate ON quality_checks(marketplace_candidate);
