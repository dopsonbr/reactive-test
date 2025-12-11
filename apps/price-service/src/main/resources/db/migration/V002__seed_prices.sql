-- V002__seed_prices.sql
-- Seed data for merchant portal demo
-- SKUs match merchandise-service (6-digit format)

INSERT INTO prices (sku, price, original_price, currency) VALUES
-- Electronics (some on sale)
(100001, 129.99, 149.99, 'USD'),  -- Headphones on sale
(100002, 699.99, NULL, 'USD'),     -- TV regular price
(100003, 59.99, 79.99, 'USD'),     -- Speaker on sale
(100004, 59.99, NULL, 'USD'),      -- Mouse regular price
(100005, 99.99, 129.99, 'USD'),    -- Keyboard on sale

-- Home & Kitchen
(200001, 89.99, NULL, 'USD'),      -- Coffee maker regular
(200002, 99.99, 119.99, 'USD'),    -- Air fryer on sale
(200003, 249.99, NULL, 'USD'),     -- Robot vacuum regular
(200004, 279.99, 329.99, 'USD'),   -- Stand mixer on sale
(200005, 79.99, 99.99, 'USD'),     -- Instant Pot on sale

-- Clothing
(300001, 24.99, NULL, 'USD'),      -- T-shirt regular
(300002, 39.99, 49.99, 'USD'),     -- Jeans on sale
(300003, 89.99, NULL, 'USD'),      -- Running shoes regular
(300004, 119.99, 149.99, 'USD'),   -- Winter jacket on sale
(300005, 29.99, NULL, 'USD'),      -- Athletic shorts regular

-- Sports & Outdoors
(400001, 34.99, NULL, 'USD'),      -- Yoga mat regular
(400002, 249.99, 299.99, 'USD'),   -- Dumbbells on sale
(400003, 109.99, 129.99, 'USD'),   -- Tent on sale
(400004, 79.99, NULL, 'USD'),      -- Hiking backpack regular
(400005, 19.99, 24.99, 'USD'),     -- Resistance bands on sale

-- Beauty & Personal Care
(500001, 49.99, 69.99, 'USD'),     -- Electric toothbrush on sale
(500002, 49.99, NULL, 'USD'),      -- Hair dryer regular
(500003, 29.99, 34.99, 'USD'),     -- Facial cleanser on sale
(500004, 79.99, NULL, 'USD'),      -- Grooming kit regular
(500005, 29.99, NULL, 'USD')       -- Moisturizer regular

ON CONFLICT (sku) DO NOTHING;
