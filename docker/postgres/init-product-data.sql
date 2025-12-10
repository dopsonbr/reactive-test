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
