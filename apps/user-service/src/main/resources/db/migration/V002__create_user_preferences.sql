-- User preferences for display and communication settings
CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    locale              VARCHAR(10) DEFAULT 'en-US',
    timezone            VARCHAR(50) DEFAULT 'America/New_York',
    currency            VARCHAR(3) DEFAULT 'USD',

    -- Communication preferences
    marketing_email     BOOLEAN DEFAULT false,
    marketing_sms       BOOLEAN DEFAULT false,
    order_updates_email BOOLEAN DEFAULT true,
    order_updates_sms   BOOLEAN DEFAULT false,

    -- Display preferences
    display_theme       VARCHAR(20) DEFAULT 'system',
    items_per_page      INTEGER DEFAULT 20,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
