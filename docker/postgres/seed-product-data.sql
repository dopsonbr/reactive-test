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
