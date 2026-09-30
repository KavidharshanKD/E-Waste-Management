-- V16__add_password_reset_token.sql
-- Table for password reset tokens and email verification codes

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(10) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens (token);
