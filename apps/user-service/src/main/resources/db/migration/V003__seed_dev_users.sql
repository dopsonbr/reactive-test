-- Seed development users for testing
-- Password: dev123 (BCrypt hash)

-- Dev employee with full permissions
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'dev-employee',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,admin,customer_search}',
    1234,
    'employee@dev.local',
    'Dev Employee'
);

-- Dev customer
INSERT INTO users (id, username, password_hash, user_type, permissions, email, display_name)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'dev-customer',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'CUSTOMER',
    '{read,write}',
    'customer@dev.local',
    'Dev Customer'
);

-- Dev service account (kiosk)
INSERT INTO users (id, username, password_hash, user_type, permissions, display_name)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'dev-kiosk',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'SERVICE_ACCOUNT',
    '{read}',
    'Dev Kiosk'
);

-- Default preferences for dev users
INSERT INTO user_preferences (user_id) VALUES
    ('11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333');
