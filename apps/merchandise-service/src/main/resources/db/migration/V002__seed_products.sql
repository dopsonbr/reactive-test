-- V002__seed_products.sql
-- Seed data for merchant portal demo

INSERT INTO products (sku, name, description, category, suggested_retail_price, currency) VALUES
-- Electronics
(1001, 'Wireless Bluetooth Headphones', 'High-quality over-ear wireless headphones with noise cancellation', 'Electronics', 149.99, 'USD'),
(1002, '4K Ultra HD Smart TV 55"', 'Premium smart TV with HDR support and streaming apps', 'Electronics', 699.99, 'USD'),
(1003, 'Portable Bluetooth Speaker', 'Waterproof speaker with 20-hour battery life', 'Electronics', 79.99, 'USD'),
(1004, 'Wireless Gaming Mouse', 'RGB gaming mouse with programmable buttons', 'Electronics', 59.99, 'USD'),
(1005, 'Mechanical Keyboard', 'Cherry MX switches with RGB backlighting', 'Electronics', 129.99, 'USD'),

-- Home & Kitchen
(2001, 'Stainless Steel Coffee Maker', '12-cup programmable coffee maker with thermal carafe', 'Home & Kitchen', 89.99, 'USD'),
(2002, 'Air Fryer XL', '5.8 quart digital air fryer with 8 presets', 'Home & Kitchen', 119.99, 'USD'),
(2003, 'Robot Vacuum Cleaner', 'Smart robot vacuum with app control', 'Home & Kitchen', 249.99, 'USD'),
(2004, 'Stand Mixer', 'Professional 5-quart stand mixer with attachments', 'Home & Kitchen', 329.99, 'USD'),
(2005, 'Instant Pot Duo', '7-in-1 electric pressure cooker 6 quart', 'Home & Kitchen', 99.99, 'USD'),

-- Clothing
(3001, 'Premium Cotton T-Shirt', 'Soft premium cotton crew neck t-shirt', 'Clothing', 24.99, 'USD'),
(3002, 'Classic Denim Jeans', 'Slim fit stretch denim jeans', 'Clothing', 49.99, 'USD'),
(3003, 'Lightweight Running Shoes', 'Breathable mesh running shoes with cushioning', 'Clothing', 89.99, 'USD'),
(3004, 'Waterproof Winter Jacket', 'Insulated waterproof jacket with hood', 'Clothing', 149.99, 'USD'),
(3005, 'Athletic Shorts', 'Quick-dry performance athletic shorts', 'Clothing', 29.99, 'USD'),

-- Sports & Outdoors
(4001, 'Yoga Mat Premium', 'Non-slip eco-friendly yoga mat with carrying strap', 'Sports & Outdoors', 34.99, 'USD'),
(4002, 'Adjustable Dumbbells', 'Space-saving adjustable dumbbell set 5-52.5 lbs', 'Sports & Outdoors', 299.99, 'USD'),
(4003, 'Camping Tent 4-Person', 'Waterproof dome tent with easy setup', 'Sports & Outdoors', 129.99, 'USD'),
(4004, 'Hiking Backpack 40L', 'Water-resistant hiking backpack with rain cover', 'Sports & Outdoors', 79.99, 'USD'),
(4005, 'Resistance Bands Set', 'Set of 5 resistance bands with handles', 'Sports & Outdoors', 24.99, 'USD'),

-- Beauty & Personal Care
(5001, 'Electric Toothbrush', 'Sonic electric toothbrush with 5 modes', 'Beauty & Personal Care', 69.99, 'USD'),
(5002, 'Hair Dryer Professional', '1875W ionic hair dryer with diffuser', 'Beauty & Personal Care', 49.99, 'USD'),
(5003, 'Facial Cleanser Set', 'Gentle daily facial cleanser duo', 'Beauty & Personal Care', 34.99, 'USD'),
(5004, 'Mens Grooming Kit', 'Complete grooming set with trimmer', 'Beauty & Personal Care', 79.99, 'USD'),
(5005, 'Skincare Moisturizer', 'Daily hydrating face moisturizer SPF 30', 'Beauty & Personal Care', 29.99, 'USD')

ON CONFLICT (sku) DO NOTHING;
