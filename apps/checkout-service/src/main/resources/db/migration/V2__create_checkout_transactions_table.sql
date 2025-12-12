-- Checkout transaction log for reporting and retry tracking
CREATE TABLE checkout_transactions (
    id                      UUID PRIMARY KEY,
    checkout_session_id     VARCHAR(64) NOT NULL UNIQUE,
    cart_id                 VARCHAR(64) NOT NULL,
    store_number            INTEGER NOT NULL,
    order_id                UUID,

    -- Status tracking
    status                  VARCHAR(32) NOT NULL,
    failure_reason          TEXT,

    -- Totals (for reporting without needing order-service)
    grand_total             DECIMAL(12,2) NOT NULL,
    item_count              INTEGER NOT NULL,

    -- Payment info
    payment_method          VARCHAR(32),
    payment_reference       VARCHAR(128),

    -- Event publishing tracking
    event_published         BOOLEAN DEFAULT FALSE,
    event_publish_attempts  INTEGER DEFAULT 0,
    last_publish_attempt    TIMESTAMPTZ,

    -- Timestamps
    initiated_at            TIMESTAMPTZ NOT NULL,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_checkout_transactions_store ON checkout_transactions(store_number);
CREATE INDEX idx_checkout_transactions_status ON checkout_transactions(status);
CREATE INDEX idx_checkout_transactions_retry ON checkout_transactions(event_published, status)
    WHERE event_published = FALSE AND status = 'COMPLETED';
CREATE INDEX idx_checkout_transactions_session ON checkout_transactions(checkout_session_id);
