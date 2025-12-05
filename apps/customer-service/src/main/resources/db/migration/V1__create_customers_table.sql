-- Main customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    customer_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    -- B2B hierarchy support
    parent_customer_id VARCHAR(255),

    -- JSONB columns for nested data
    addresses_json JSONB NOT NULL DEFAULT '[]',
    wallet_json JSONB,
    communication_prefs_json JSONB NOT NULL DEFAULT '{}',
    loyalty_json JSONB,
    b2b_info_json JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for CRUD and search operations
CREATE INDEX idx_customers_store_number ON customers(store_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_parent_id ON customers(parent_customer_id);
CREATE INDEX idx_customers_updated_at ON customers(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_customers_store_type ON customers(store_number, customer_type);
CREATE INDEX idx_customers_store_status ON customers(store_number, status);

-- Unique constraint for email per store (allows same email in different stores)
CREATE UNIQUE INDEX idx_customers_store_email ON customers(store_number, email);
