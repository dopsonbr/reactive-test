# 050A: Database Schemas for Product Data Services

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create PostgreSQL schemas and database initialization for merchandise, price, and inventory services.

**Architecture:** Three isolated schemas in the shared Postgres instance, each with its own user/credentials for logical separation.

**Tech Stack:** PostgreSQL 16, Flyway migrations, Docker init scripts

---

## Task 1: Create Database Init Script

**Files:**
- Create: `docker/postgres/init-product-data.sql`

**Step 1: Create the init script**

```sql
-- docker/postgres/init-product-data.sql
-- Creates databases and users for merchandise, price, and inventory services

-- Merchandise Service
CREATE DATABASE merchandisedb;
CREATE USER merchandise_user WITH ENCRYPTED PASSWORD 'merchandise_pass';
GRANT ALL PRIVILEGES ON DATABASE merchandisedb TO merchandise_user;

-- Price Service
CREATE DATABASE pricedb;
CREATE USER price_user WITH ENCRYPTED PASSWORD 'price_pass';
GRANT ALL PRIVILEGES ON DATABASE pricedb TO price_user;

-- Inventory Service
CREATE DATABASE inventorydb;
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'inventory_pass';
GRANT ALL PRIVILEGES ON DATABASE inventorydb TO inventory_user;

-- Grant schema creation privileges (needed for Flyway)
\c merchandisedb
GRANT ALL ON SCHEMA public TO merchandise_user;

\c pricedb
GRANT ALL ON SCHEMA public TO price_user;

\c inventorydb
GRANT ALL ON SCHEMA public TO inventory_user;
```

**Step 2: Verify file created**

Run: `cat docker/postgres/init-product-data.sql | head -20`
Expected: Shows the SQL script header

**Step 3: Commit**

```bash
git add docker/postgres/init-product-data.sql
git commit -m "feat(db): add init script for merchandise, price, inventory databases"
```

---

## Task 2: Update Docker Compose Postgres Volume

**Files:**
- Modify: `docker/docker-compose.yml` (postgres service volumes section)

**Step 1: Add the new init script to postgres volumes**

Find the postgres service and add the new init script:

```yaml
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres/init-databases.sql:/docker-entrypoint-initdb.d/01-init-databases.sql:ro
      - ./postgres/init-audit.sql:/docker-entrypoint-initdb.d/02-init-audit.sql:ro
      - ./postgres/init-product-data.sql:/docker-entrypoint-initdb.d/03-init-product-data.sql:ro
```

**Step 2: Verify change**

Run: `grep -A 10 "init-product-data" docker/docker-compose.yml`
Expected: Shows the new volume mount

**Step 3: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "feat(docker): mount product data init script in postgres"
```

---

## Task 3: Create Seed Data Script

**Files:**
- Create: `docker/postgres/seed-product-data.sql`

**Step 1: Create seed data for development**

```sql
-- docker/postgres/seed-product-data.sql
-- Seed data for local development - runs after Flyway migrations

-- Connect to merchandise database and insert products
\c merchandisedb

INSERT INTO products (sku, name, description, image_url, category, suggested_retail_price, currency)
VALUES
  (1001, 'Wireless Bluetooth Headphones', 'Premium over-ear headphones with noise cancellation', 'https://picsum.photos/seed/headphones/300/300', 'Electronics', 149.99, 'USD'),
  (1002, 'Organic Green Tea', 'Japanese sencha green tea, 100 bags', 'https://picsum.photos/seed/tea/300/300', 'Grocery', 24.99, 'USD'),
  (1003, 'Running Shoes', 'Lightweight mesh running shoes with cushioned sole', 'https://picsum.photos/seed/shoes/300/300', 'Footwear', 89.99, 'USD'),
  (1004, 'Stainless Steel Water Bottle', '32oz insulated water bottle, keeps drinks cold 24hrs', 'https://picsum.photos/seed/bottle/300/300', 'Sports', 34.99, 'USD'),
  (1005, 'USB-C Charging Cable', '6ft braided USB-C to USB-C cable', 'https://picsum.photos/seed/cable/300/300', 'Electronics', 19.99, 'USD'),
  (1006, 'Yoga Mat', 'Non-slip exercise mat, 6mm thick', 'https://picsum.photos/seed/yoga/300/300', 'Sports', 29.99, 'USD'),
  (1007, 'Coffee Beans', 'Medium roast whole bean coffee, 2lb bag', 'https://picsum.photos/seed/coffee/300/300', 'Grocery', 18.99, 'USD'),
  (1008, 'Backpack', 'Water-resistant laptop backpack with USB port', 'https://picsum.photos/seed/backpack/300/300', 'Accessories', 59.99, 'USD'),
  (1009, 'Desk Lamp', 'LED desk lamp with adjustable brightness', 'https://picsum.photos/seed/lamp/300/300', 'Home', 44.99, 'USD'),
  (1010, 'Wireless Mouse', 'Ergonomic wireless mouse with silent clicks', 'https://picsum.photos/seed/mouse/300/300', 'Electronics', 29.99, 'USD')
ON CONFLICT (sku) DO NOTHING;

-- Connect to price database and set prices
\c pricedb

INSERT INTO prices (sku, price, original_price, currency)
VALUES
  (1001, 129.99, 149.99, 'USD'),  -- On sale
  (1002, 24.99, NULL, 'USD'),
  (1003, 79.99, 89.99, 'USD'),    -- On sale
  (1004, 34.99, NULL, 'USD'),
  (1005, 14.99, 19.99, 'USD'),    -- On sale
  (1006, 29.99, NULL, 'USD'),
  (1007, 18.99, NULL, 'USD'),
  (1008, 49.99, 59.99, 'USD'),    -- On sale
  (1009, 44.99, NULL, 'USD'),
  (1010, 29.99, NULL, 'USD')
ON CONFLICT (sku) DO NOTHING;

-- Connect to inventory database and set stock levels
\c inventorydb

INSERT INTO stock (sku, available_quantity)
VALUES
  (1001, 50),
  (1002, 200),
  (1003, 75),
  (1004, 150),
  (1005, 500),
  (1006, 100),
  (1007, 300),
  (1008, 45),
  (1009, 80),
  (1010, 120)
ON CONFLICT (sku) DO NOTHING;
```

**Step 2: Verify file created**

Run: `wc -l docker/postgres/seed-product-data.sql`
Expected: ~60 lines

**Step 3: Commit**

```bash
git add docker/postgres/seed-product-data.sql
git commit -m "feat(db): add seed data for merchandise, price, inventory"
```

---

## Task 4: Create Seed Users for Merchant Portal

**Files:**
- Modify: `apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql`

**Step 1: Add merchant portal test users to existing seed file**

Append to the existing V003 migration:

```sql
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
```

**Step 2: Verify changes**

Run: `grep -c "merchant" apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql`
Expected: At least 5 matches

**Step 3: Commit**

```bash
git add apps/user-service/src/main/resources/db/migration/V003__seed_dev_users.sql
git commit -m "feat(user-service): add seed users for merchant portal"
```

---

## Verification

**Test the database init:**

```bash
# Reset postgres data and restart
cd docker
docker compose down -v
docker compose up -d postgres

# Wait for postgres to be ready
sleep 10

# Verify databases exist
docker exec postgres psql -U postgres -c "\l" | grep -E "(merchandisedb|pricedb|inventorydb)"
```

Expected: Three databases listed (merchandisedb, pricedb, inventorydb)

---

## Summary

| Task | Files | Purpose |
|------|-------|---------|
| 1 | `docker/postgres/init-product-data.sql` | Create databases and users |
| 2 | `docker/docker-compose.yml` | Mount init script |
| 3 | `docker/postgres/seed-product-data.sql` | Sample data for dev |
| 4 | `V003__seed_dev_users.sql` | Merchant portal test users |
