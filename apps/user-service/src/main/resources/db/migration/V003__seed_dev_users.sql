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

-- Merchant Portal Test Users

-- Merchant user (product creation)
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'merchant1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,merchant}',
    1234,
    'merchant1@test.com',
    'Test Merchant'
) ON CONFLICT (username) DO NOTHING;

-- Pricing specialist
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'pricer1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,pricing_specialist}',
    1234,
    'pricer1@test.com',
    'Test Pricer'
) ON CONFLICT (username) DO NOTHING;

-- Inventory specialist
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'inventory1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,inventory_specialist}',
    1234,
    'inventory1@test.com',
    'Test Inventory Specialist'
) ON CONFLICT (username) DO NOTHING;

-- Manager (merchant + pricing)
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    'manager1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,merchant,pricing_specialist}',
    1234,
    'manager1@test.com',
    'Test Manager'
) ON CONFLICT (username) DO NOTHING;

-- Admin (all permissions)
INSERT INTO users (id, username, password_hash, user_type, permissions, store_number, email, display_name)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    'admin1',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3o6EaNsj2R/N1OAb2.O2',
    'EMPLOYEE',
    '{read,write,admin,merchant,pricing_specialist,inventory_specialist}',
    1234,
    'admin1@test.com',
    'Test Admin'
) ON CONFLICT (username) DO NOTHING;
