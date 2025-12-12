package db

import "database/sql"

func runMigrations(db *sql.DB) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS products (
            upc TEXT PRIMARY KEY,
            sku TEXT,
            name TEXT NOT NULL,
            price_cents INTEGER NOT NULL,
            department TEXT,
            tax_rate INTEGER DEFAULT 0,
            updated_at TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS operators (
            pin TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            employee_id TEXT,
            is_manager INTEGER DEFAULT 0,
            updated_at TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            operator_pin TEXT NOT NULL,
            items_json TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            tax INTEGER NOT NULL,
            total INTEGER NOT NULL,
            payment_method TEXT,
            payment_ref TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            synced_at TEXT
        )`,
		`CREATE TABLE IF NOT EXISTS sync_status (
            key TEXT PRIMARY KEY,
            value TEXT
        )`,
		`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
		`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`,
	}

	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			return err
		}
	}

	// Seed default data
	if err := seedData(db); err != nil {
		return err
	}

	return nil
}

func seedData(db *sql.DB) error {
	// Seed operators (PIN codes for login)
	operators := `
		INSERT OR IGNORE INTO operators (pin, name, employee_id, is_manager, updated_at) VALUES
		('1234', 'John Smith', 'EMP001', 0, datetime('now')),
		('5678', 'Jane Doe', 'EMP002', 0, datetime('now')),
		('9999', 'Manager Mike', 'MGR001', 1, datetime('now')),
		('0000', 'Test User', 'TEST01', 0, datetime('now'))
	`
	if _, err := db.Exec(operators); err != nil {
		return err
	}

	// Seed products
	products := `
		INSERT OR IGNORE INTO products (upc, sku, name, price_cents, department, tax_rate, updated_at) VALUES
		-- Grocery
		('012345678901', 'GRO-001', 'Organic Bananas (bunch)', 199, 'Grocery', 0, datetime('now')),
		('012345678902', 'GRO-002', 'Whole Milk 1 Gallon', 449, 'Grocery', 0, datetime('now')),
		('012345678903', 'GRO-003', 'Large Eggs (dozen)', 399, 'Grocery', 0, datetime('now')),
		('012345678904', 'GRO-004', 'Sliced Bread', 329, 'Grocery', 0, datetime('now')),
		('012345678905', 'GRO-005', 'Butter (1 lb)', 549, 'Grocery', 0, datetime('now')),
		('012345678906', 'GRO-006', 'Cheddar Cheese Block', 699, 'Grocery', 0, datetime('now')),
		('012345678907', 'GRO-007', 'Ground Coffee 12oz', 899, 'Grocery', 0, datetime('now')),
		('012345678908', 'GRO-008', 'Orange Juice 64oz', 499, 'Grocery', 0, datetime('now')),
		-- Snacks (taxable)
		('023456789012', 'SNK-001', 'Potato Chips Family Size', 449, 'Snacks', 82500, datetime('now')),
		('023456789013', 'SNK-002', 'Chocolate Bar', 199, 'Snacks', 82500, datetime('now')),
		('023456789014', 'SNK-003', 'Soda 2 Liter', 249, 'Snacks', 82500, datetime('now')),
		('023456789015', 'SNK-004', 'Candy Bag', 349, 'Snacks', 82500, datetime('now')),
		('023456789016', 'SNK-005', 'Energy Drink', 299, 'Snacks', 82500, datetime('now')),
		-- Household (taxable)
		('034567890123', 'HOU-001', 'Paper Towels 6-pack', 899, 'Household', 82500, datetime('now')),
		('034567890124', 'HOU-002', 'Dish Soap', 349, 'Household', 82500, datetime('now')),
		('034567890125', 'HOU-003', 'Laundry Detergent', 1199, 'Household', 82500, datetime('now')),
		('034567890126', 'HOU-004', 'Trash Bags 30ct', 799, 'Household', 82500, datetime('now')),
		('034567890127', 'HOU-005', 'All-Purpose Cleaner', 449, 'Household', 82500, datetime('now')),
		-- Produce
		('045678901234', 'PRD-001', 'Apples (per lb)', 199, 'Produce', 0, datetime('now')),
		('045678901235', 'PRD-002', 'Avocados (each)', 150, 'Produce', 0, datetime('now')),
		('045678901236', 'PRD-003', 'Tomatoes (per lb)', 249, 'Produce', 0, datetime('now')),
		('045678901237', 'PRD-004', 'Lettuce Head', 199, 'Produce', 0, datetime('now')),
		('045678901238', 'PRD-005', 'Onions (3 lb bag)', 299, 'Produce', 0, datetime('now')),
		-- Deli
		('056789012345', 'DEL-001', 'Rotisserie Chicken', 799, 'Deli', 82500, datetime('now')),
		('056789012346', 'DEL-002', 'Sliced Ham (1 lb)', 899, 'Deli', 82500, datetime('now')),
		('056789012347', 'DEL-003', 'Sliced Turkey (1 lb)', 999, 'Deli', 82500, datetime('now'))
	`
	if _, err := db.Exec(products); err != nil {
		return err
	}

	return nil
}
