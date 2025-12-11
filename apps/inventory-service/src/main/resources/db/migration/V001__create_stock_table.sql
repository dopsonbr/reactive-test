-- V001__create_stock_table.sql
CREATE TABLE IF NOT EXISTS stock (
    sku BIGINT PRIMARY KEY,
    available_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_available ON stock(available_quantity);
CREATE INDEX idx_stock_updated_at ON stock(updated_at);
