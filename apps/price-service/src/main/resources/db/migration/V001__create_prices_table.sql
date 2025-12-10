-- V001__create_prices_table.sql
CREATE TABLE IF NOT EXISTS prices (
    sku BIGINT PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prices_updated_at ON prices(updated_at);
