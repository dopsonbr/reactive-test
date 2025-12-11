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
	return nil
}
