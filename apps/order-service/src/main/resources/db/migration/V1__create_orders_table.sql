-- Orders table for order-service (migrated from checkout-service shared access)
-- Receives orders via OrderCompleted events from checkout-service
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(100),

    -- Fulfillment type: IMMEDIATE, WILL_CALL, DELIVERY
    fulfillment_type VARCHAR(20) NOT NULL,
    fulfillment_date TIMESTAMP WITH TIME ZONE,
    reservation_id UUID,

    -- Denormalized totals (pre-calculated)
    subtotal DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    fulfillment_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL,

    -- Payment info
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),

    -- Order status
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',

    -- Denormalized line items as JSONB (for analytics extraction)
    line_items JSONB NOT NULL,

    -- Denormalized discounts applied as JSONB
    applied_discounts JSONB NOT NULL DEFAULT '[]',

    -- Denormalized customer snapshot
    customer_snapshot JSONB,

    -- Denormalized fulfillment details
    fulfillment_details JSONB,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    session_id UUID
);

-- Indexes for common queries
CREATE INDEX idx_orders_store ON orders(store_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_fulfillment_type ON orders(fulfillment_type);
CREATE INDEX idx_orders_fulfillment_date ON orders(fulfillment_date);

-- GIN index for JSONB queries (analytics)
CREATE INDEX idx_orders_line_items ON orders USING GIN(line_items);
