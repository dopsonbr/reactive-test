-- Create databases and users for all services

-- Cart Service Database
CREATE DATABASE cartdb;
CREATE USER cart_user WITH ENCRYPTED PASSWORD 'cart_pass';
GRANT ALL PRIVILEGES ON DATABASE cartdb TO cart_user;

-- User Service Database
CREATE DATABASE userdb;
CREATE USER user_user WITH ENCRYPTED PASSWORD 'user_pass';
GRANT ALL PRIVILEGES ON DATABASE userdb TO user_user;

-- Customer Service Database
CREATE DATABASE customerdb;
CREATE USER customer_user WITH ENCRYPTED PASSWORD 'customer_pass';
GRANT ALL PRIVILEGES ON DATABASE customerdb TO customer_user;

-- Audit Service Database
CREATE DATABASE audit;
CREATE USER audit WITH ENCRYPTED PASSWORD 'audit';
GRANT ALL PRIVILEGES ON DATABASE audit TO audit;

-- Checkout Service Database
CREATE DATABASE checkoutdb;
CREATE USER checkout_user WITH ENCRYPTED PASSWORD 'checkout_pass';
GRANT ALL PRIVILEGES ON DATABASE checkoutdb TO checkout_user;

-- Merchandise Service Database
CREATE DATABASE merchandisedb;
CREATE USER merchandise_user WITH ENCRYPTED PASSWORD 'merchandise_pass';
GRANT ALL PRIVILEGES ON DATABASE merchandisedb TO merchandise_user;

-- Price Service Database
CREATE DATABASE pricedb;
CREATE USER price_user WITH ENCRYPTED PASSWORD 'price_pass';
GRANT ALL PRIVILEGES ON DATABASE pricedb TO price_user;

-- Inventory Service Database
CREATE DATABASE inventorydb;
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'inventory_pass';
GRANT ALL PRIVILEGES ON DATABASE inventorydb TO inventory_user;

-- Order Service Database
CREATE DATABASE orderdb;
CREATE USER order_user WITH ENCRYPTED PASSWORD 'order_pass';
GRANT ALL PRIVILEGES ON DATABASE orderdb TO order_user;

-- Grant schema permissions
\c cartdb
GRANT ALL ON SCHEMA public TO cart_user;

\c userdb
GRANT ALL ON SCHEMA public TO user_user;

\c customerdb
GRANT ALL ON SCHEMA public TO customer_user;

\c audit
GRANT ALL ON SCHEMA public TO audit;

\c checkoutdb
GRANT ALL ON SCHEMA public TO checkout_user;

\c merchandisedb
GRANT ALL ON SCHEMA public TO merchandise_user;

\c pricedb
GRANT ALL ON SCHEMA public TO price_user;

\c inventorydb
GRANT ALL ON SCHEMA public TO inventory_user;

\c orderdb
GRANT ALL ON SCHEMA public TO order_user;
