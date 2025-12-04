-- Cart table with JSONB columns for nested collections
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    customer_id VARCHAR(255),
    customer_json JSONB,
    products_json JSONB NOT NULL DEFAULT '[]',
    discounts_json JSONB NOT NULL DEFAULT '[]',
    fulfillments_json JSONB NOT NULL DEFAULT '[]',
    totals_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for finding carts by store
CREATE INDEX idx_carts_store_number ON carts(store_number);

-- Index for finding carts by customer
CREATE INDEX idx_carts_customer_id ON carts(customer_id);

-- Index for finding active/recent carts
CREATE INDEX idx_carts_updated_at ON carts(updated_at DESC);

-- Composite index for store + customer queries
CREATE INDEX idx_carts_store_customer ON carts(store_number, customer_id);
