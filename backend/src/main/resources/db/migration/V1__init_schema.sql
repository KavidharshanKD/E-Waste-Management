-- V1__init_schema.sql
-- Initial Schema Migration for Smart E-Waste Management System

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    reward_points_balance INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(30),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recycling_centers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone VARCHAR(30),
    contact_email VARCHAR(150),
    processing_capacity_kg_per_day NUMERIC(10, 2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recyclers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    center_id BIGINT REFERENCES recycling_centers(id) ON DELETE SET NULL,
    company_name VARCHAR(150) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disposal_requests (
    id BIGSERIAL PRIMARY KEY,
    tracking_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    recommended_action VARCHAR(30),
    pickup_address VARCHAR(255) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(100) NOT NULL,
    pickup_postal_code VARCHAR(20) NOT NULL,
    preferred_pickup_date TIMESTAMP,
    notes TEXT,
    center_id BIGINT REFERENCES recycling_centers(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ewaste_items (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES disposal_requests(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100),
    condition VARCHAR(30) NOT NULL,
    weight_kg NUMERIC(8, 2),
    quantity INT NOT NULL DEFAULT 1,
    description TEXT,
    estimated_reward_points INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pickups (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL UNIQUE REFERENCES disposal_requests(id) ON DELETE CASCADE,
    collector_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP,
    actual_pickup_date TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    collector_notes TEXT,
    verification_code VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disposal_status_histories (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES disposal_requests(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    comment VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reward_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id BIGINT REFERENCES disposal_requests(id) ON DELETE SET NULL,
    points INT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recycling_certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    request_id BIGINT NOT NULL UNIQUE REFERENCES disposal_requests(id) ON DELETE CASCADE,
    recycler_id BIGINT NOT NULL REFERENCES recyclers(id) ON DELETE CASCADE,
    total_weight_kg NUMERIC(10, 2),
    hazardous_materials_diverted_kg NUMERIC(10, 2),
    issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    certificate_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_disposal_requests_user ON disposal_requests(user_id);
CREATE INDEX idx_disposal_requests_status ON disposal_requests(status);
CREATE INDEX idx_disposal_requests_tracking ON disposal_requests(tracking_number);
CREATE INDEX idx_ewaste_items_request ON ewaste_items(request_id);
CREATE INDEX idx_pickups_collector ON pickups(collector_id);
CREATE INDEX idx_pickups_status ON pickups(status);
CREATE INDEX idx_status_history_request ON disposal_status_histories(request_id);
CREATE INDEX idx_reward_transactions_user ON reward_transactions(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
