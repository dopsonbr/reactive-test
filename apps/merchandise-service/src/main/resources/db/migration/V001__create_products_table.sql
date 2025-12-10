-- V001__create_products_table.sql
CREATE TABLE IF NOT EXISTS products (
    sku BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    category VARCHAR(100),
    suggested_retail_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
