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
