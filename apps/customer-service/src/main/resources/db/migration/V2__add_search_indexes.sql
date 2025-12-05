-- Full-text search support for name
CREATE INDEX idx_customers_name_search ON customers
    USING gin(to_tsvector('english', name));

-- Case-insensitive email search
CREATE INDEX idx_customers_email_lower ON customers(LOWER(email));

-- Partial index for active customers (most common queries)
CREATE INDEX idx_customers_active ON customers(store_number, customer_type)
    WHERE status = 'ACTIVE';

-- Index for loyalty tier queries (GIN index on JSONB field)
CREATE INDEX idx_customers_loyalty_tier ON customers
    USING gin((loyalty_json -> 'tier'));
