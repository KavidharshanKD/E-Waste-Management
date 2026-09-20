-- V15__marketplace_foundation.sql
-- Module 8: Refurbished Electronics Marketplace, Human Approval, Inventory Concurrency, Cart & Order Foundation

-- 1. Marketplace Listings (Commercial second-life representation of verified refurbished devices)
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES disposal_requests(id),
    item_id BIGINT NOT NULL REFERENCES ewaste_items(id),
    quality_check_id BIGINT NOT NULL UNIQUE REFERENCES quality_checks(id),
    restoration_job_id BIGINT NOT NULL REFERENCES restoration_jobs(id),
    center_id BIGINT NOT NULL REFERENCES recycling_centers(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    cosmetic_grade VARCHAR(20) NOT NULL,
    condition_summary TEXT,
    technical_summary TEXT,
    work_performed_summary TEXT,
    parts_replaced_summary TEXT,
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price > 0),
    original_reference_price NUMERIC(10, 2),
    warranty_days INT DEFAULT 0,
    stock_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    listing_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    approved_by_id BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_by_id BIGINT REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    published_at TIMESTAMP,
    sold_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(listing_status, stock_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_center ON marketplace_listings(center_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON marketplace_listings(selling_price);

-- 2. Marketplace Listing Images
CREATE TABLE IF NOT EXISTS marketplace_listing_images (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON marketplace_listing_images(listing_id);

-- 3. Carts (Authenticated Customer Cart)
CREATE TABLE IF NOT EXISTS carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cart Items (Individual unique second-life device listings in cart; quantity is strictly 1)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_listing UNIQUE (cart_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- 5. Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PLACED',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'DEMO_CHECKOUT',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    placed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_number ON marketplace_orders(order_number);

-- 6. Marketplace Order Items
CREATE TABLE IF NOT EXISTS marketplace_order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES marketplace_listings(id),
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    title_snapshot VARCHAR(200) NOT NULL,
    warranty_days_snapshot INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON marketplace_order_items(order_id);
