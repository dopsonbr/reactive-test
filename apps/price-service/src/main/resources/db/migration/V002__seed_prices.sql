-- V002__seed_prices.sql
-- Seed data for merchant portal demo
-- Prices correspond to products in merchandise-service

INSERT INTO prices (sku, price, original_price, currency) VALUES
-- Electronics (some on sale)
(1001, 129.99, 149.99, 'USD'),  -- Headphones on sale
(1002, 699.99, NULL, 'USD'),     -- TV regular price
(1003, 59.99, 79.99, 'USD'),     -- Speaker on sale
(1004, 59.99, NULL, 'USD'),      -- Mouse regular price
(1005, 99.99, 129.99, 'USD'),    -- Keyboard on sale

-- Home & Kitchen
(2001, 89.99, NULL, 'USD'),      -- Coffee maker regular
(2002, 99.99, 119.99, 'USD'),    -- Air fryer on sale
(2003, 249.99, NULL, 'USD'),     -- Robot vacuum regular
(2004, 279.99, 329.99, 'USD'),   -- Stand mixer on sale
(2005, 79.99, 99.99, 'USD'),     -- Instant Pot on sale

-- Clothing
(3001, 24.99, NULL, 'USD'),      -- T-shirt regular
(3002, 39.99, 49.99, 'USD'),     -- Jeans on sale
(3003, 89.99, NULL, 'USD'),      -- Running shoes regular
(3004, 119.99, 149.99, 'USD'),   -- Winter jacket on sale
(3005, 29.99, NULL, 'USD'),      -- Athletic shorts regular

-- Sports & Outdoors
(4001, 34.99, NULL, 'USD'),      -- Yoga mat regular
(4002, 249.99, 299.99, 'USD'),   -- Dumbbells on sale
(4003, 109.99, 129.99, 'USD'),   -- Tent on sale
(4004, 79.99, NULL, 'USD'),      -- Hiking backpack regular
(4005, 19.99, 24.99, 'USD'),     -- Resistance bands on sale

-- Beauty & Personal Care
(5001, 49.99, 69.99, 'USD'),     -- Electric toothbrush on sale
(5002, 49.99, NULL, 'USD'),      -- Hair dryer regular
(5003, 29.99, 34.99, 'USD'),     -- Facial cleanser on sale
(5004, 79.99, NULL, 'USD'),      -- Grooming kit regular
(5005, 29.99, NULL, 'USD')       -- Moisturizer regular

ON CONFLICT (sku) DO NOTHING;
