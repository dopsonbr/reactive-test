-- V002__seed_stock.sql
-- Seed data for merchant portal demo
-- Stock levels correspond to products in merchandise-service

INSERT INTO stock (sku, available_quantity) VALUES
-- Electronics (varying stock levels)
(1001, 150),    -- Headphones - good stock
(1002, 25),     -- TV - moderate stock
(1003, 200),    -- Speaker - high stock
(1004, 8),      -- Mouse - low stock
(1005, 75),     -- Keyboard - good stock

-- Home & Kitchen
(2001, 120),    -- Coffee maker - good stock
(2002, 5),      -- Air fryer - low stock (popular item)
(2003, 30),     -- Robot vacuum - moderate stock
(2004, 15),     -- Stand mixer - low stock
(2005, 250),    -- Instant Pot - high stock

-- Clothing
(3001, 500),    -- T-shirt - high stock
(3002, 180),    -- Jeans - good stock
(3003, 90),     -- Running shoes - good stock
(3004, 3),      -- Winter jacket - very low stock
(3005, 320),    -- Athletic shorts - high stock

-- Sports & Outdoors
(4001, 200),    -- Yoga mat - high stock
(4002, 0),      -- Dumbbells - out of stock
(4003, 45),     -- Tent - moderate stock
(4004, 60),     -- Hiking backpack - good stock
(4005, 400),    -- Resistance bands - high stock

-- Beauty & Personal Care
(5001, 85),     -- Electric toothbrush - good stock
(5002, 110),    -- Hair dryer - good stock
(5003, 7),      -- Facial cleanser - low stock
(5004, 55),     -- Grooming kit - moderate stock
(5005, 180)     -- Moisturizer - good stock

ON CONFLICT (sku) DO NOTHING;
