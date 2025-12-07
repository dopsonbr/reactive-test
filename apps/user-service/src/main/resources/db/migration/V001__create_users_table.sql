-- User table for storing users of all types
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL CHECK (user_type IN ('SERVICE_ACCOUNT', 'CUSTOMER', 'EMPLOYEE')),
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    store_number    INTEGER,
    email           VARCHAR(255),
    display_name    VARCHAR(200),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,

    -- Employees must have a store number
    CONSTRAINT chk_employee_store CHECK (
        user_type != 'EMPLOYEE' OR store_number IS NOT NULL
    )
);

-- Indexes for common queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_store_number ON users(store_number) WHERE store_number IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
