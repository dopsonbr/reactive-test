-- V002__seed_stock.sql
-- Seed data for merchant portal demo
-- SKUs match merchandise-service (6-digit format)

INSERT INTO stock (sku, available_quantity) VALUES
-- Electronics (varying stock levels)
(100001, 150),    -- Headphones - good stock
(100002, 25),     -- TV - moderate stock
(100003, 200),    -- Speaker - high stock
(100004, 8),      -- Mouse - low stock
(100005, 75),     -- Keyboard - good stock

-- Home & Kitchen
(200001, 120),    -- Coffee maker - good stock
(200002, 5),      -- Air fryer - low stock (popular item)
(200003, 30),     -- Robot vacuum - moderate stock
(200004, 15),     -- Stand mixer - low stock
(200005, 250),    -- Instant Pot - high stock

-- Clothing
(300001, 500),    -- T-shirt - high stock
(300002, 180),    -- Jeans - good stock
(300003, 90),     -- Running shoes - good stock
(300004, 3),      -- Winter jacket - very low stock
(300005, 320),    -- Athletic shorts - high stock

-- Sports & Outdoors
(400001, 200),    -- Yoga mat - high stock
(400002, 0),      -- Dumbbells - out of stock
(400003, 45),     -- Tent - moderate stock
(400004, 60),     -- Hiking backpack - good stock
(400005, 400),    -- Resistance bands - high stock

-- Beauty & Personal Care
(500001, 85),     -- Electric toothbrush - good stock
(500002, 110),    -- Hair dryer - good stock
(500003, 7),      -- Facial cleanser - low stock
(500004, 55),     -- Grooming kit - moderate stock
(500005, 180)     -- Moisturizer - good stock

ON CONFLICT (sku) DO NOTHING;
