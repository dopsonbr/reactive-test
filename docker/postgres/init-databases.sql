-- Create databases and users for all services

-- Cart Service Database
CREATE DATABASE cartdb;
CREATE USER cart_user WITH ENCRYPTED PASSWORD 'cart_pass';
GRANT ALL PRIVILEGES ON DATABASE cartdb TO cart_user;

-- Audit Service Database
CREATE DATABASE audit;
CREATE USER audit WITH ENCRYPTED PASSWORD 'audit';
GRANT ALL PRIVILEGES ON DATABASE audit TO audit;

-- Grant schema permissions
\c cartdb
GRANT ALL ON SCHEMA public TO cart_user;

\c audit
GRANT ALL ON SCHEMA public TO audit;
