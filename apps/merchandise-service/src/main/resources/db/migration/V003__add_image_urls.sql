-- V003__add_image_urls.sql
-- Add image URLs to existing products for frontend display

-- Electronics (100001-100005)
UPDATE products SET image_url = 'https://picsum.photos/seed/headphones/400/400' WHERE sku = 100001;
UPDATE products SET image_url = 'https://picsum.photos/seed/smarttv/400/400' WHERE sku = 100002;
UPDATE products SET image_url = 'https://picsum.photos/seed/speaker/400/400' WHERE sku = 100003;
UPDATE products SET image_url = 'https://picsum.photos/seed/mouse/400/400' WHERE sku = 100004;
UPDATE products SET image_url = 'https://picsum.photos/seed/keyboard/400/400' WHERE sku = 100005;

-- Home & Kitchen (200001-200005)
UPDATE products SET image_url = 'https://picsum.photos/seed/coffeemaker/400/400' WHERE sku = 200001;
UPDATE products SET image_url = 'https://picsum.photos/seed/airfryer/400/400' WHERE sku = 200002;
UPDATE products SET image_url = 'https://picsum.photos/seed/vacuum/400/400' WHERE sku = 200003;
UPDATE products SET image_url = 'https://picsum.photos/seed/standmixer/400/400' WHERE sku = 200004;
UPDATE products SET image_url = 'https://picsum.photos/seed/instantpot/400/400' WHERE sku = 200005;

-- Clothing (300001-300005)
UPDATE products SET image_url = 'https://picsum.photos/seed/tshirt/400/400' WHERE sku = 300001;
UPDATE products SET image_url = 'https://picsum.photos/seed/jeans/400/400' WHERE sku = 300002;
UPDATE products SET image_url = 'https://picsum.photos/seed/runningshoes/400/400' WHERE sku = 300003;
UPDATE products SET image_url = 'https://picsum.photos/seed/winterjacket/400/400' WHERE sku = 300004;
UPDATE products SET image_url = 'https://picsum.photos/seed/shorts/400/400' WHERE sku = 300005;

-- Sports & Outdoors (400001-400005)
UPDATE products SET image_url = 'https://picsum.photos/seed/yogamat/400/400' WHERE sku = 400001;
UPDATE products SET image_url = 'https://picsum.photos/seed/dumbbells/400/400' WHERE sku = 400002;
UPDATE products SET image_url = 'https://picsum.photos/seed/tent/400/400' WHERE sku = 400003;
UPDATE products SET image_url = 'https://picsum.photos/seed/backpack/400/400' WHERE sku = 400004;
UPDATE products SET image_url = 'https://picsum.photos/seed/resistancebands/400/400' WHERE sku = 400005;

-- Beauty & Personal Care (500001-500005)
UPDATE products SET image_url = 'https://picsum.photos/seed/toothbrush/400/400' WHERE sku = 500001;
UPDATE products SET image_url = 'https://picsum.photos/seed/hairdryer/400/400' WHERE sku = 500002;
UPDATE products SET image_url = 'https://picsum.photos/seed/cleanser/400/400' WHERE sku = 500003;
UPDATE products SET image_url = 'https://picsum.photos/seed/groomingkit/400/400' WHERE sku = 500004;
UPDATE products SET image_url = 'https://picsum.photos/seed/moisturizer/400/400' WHERE sku = 500005;
