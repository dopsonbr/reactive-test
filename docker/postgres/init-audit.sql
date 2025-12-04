-- Create audit events table for the audit-service
-- This script runs on PostgreSQL container initialization

-- Main audit events table
-- Optimized with indexes for common query patterns
CREATE TABLE IF NOT EXISTS audit_events (
    event_id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    store_number INTEGER NOT NULL,
    user_id VARCHAR(50),
    session_id VARCHAR(36),
    trace_id VARCHAR(36),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL DEFAULT '{}'
);

-- Index for time-series queries by store and entity type
CREATE INDEX IF NOT EXISTS idx_audit_store_entity_time
ON audit_events (store_number, entity_type, created_at DESC);

-- Index for entity lookups (e.g., all events for a specific cart)
CREATE INDEX IF NOT EXISTS idx_audit_entity
ON audit_events (entity_type, entity_id, created_at DESC);

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_events (user_id, created_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_audit_event_type
ON audit_events (event_type, created_at DESC);

-- GIN index for JSONB data queries (for searching within event data)
CREATE INDEX IF NOT EXISTS idx_audit_data_gin
ON audit_events USING GIN (data);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE audit_events TO audit;
