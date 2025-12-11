package db

import "database/sql"

type Product struct {
	UPC        string
	SKU        string
	Name       string
	PriceCents int
	Department string
	TaxRate    int // × 10000 (e.g., 8.25% = 82500)
}

func GetProductByUPC(db *sql.DB, upc string) (*Product, error) {
	var p Product
	err := db.QueryRow(
		`SELECT upc, sku, name, price_cents, department, tax_rate
         FROM products WHERE upc = ?`, upc,
	).Scan(&p.UPC, &p.SKU, &p.Name, &p.PriceCents, &p.Department, &p.TaxRate)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, err
}

func SearchProducts(db *sql.DB, query string, limit int) ([]Product, error) {
	rows, err := db.Query(
		`SELECT upc, sku, name, price_cents, department, tax_rate
         FROM products WHERE name LIKE ? OR upc LIKE ? LIMIT ?`,
		"%"+query+"%", "%"+query+"%", limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Initialize to empty slice (not nil) so JSON serializes as [] not null
	products := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.UPC, &p.SKU, &p.Name, &p.PriceCents, &p.Department, &p.TaxRate); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func ReplaceAllProducts(db *sql.DB, products []Product) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM products"); err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`INSERT INTO products (upc, sku, name, price_cents, department, tax_rate, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
	)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, p := range products {
		if _, err := stmt.Exec(p.UPC, p.SKU, p.Name, p.PriceCents, p.Department, p.TaxRate); err != nil {
			return err
		}
	}
	return tx.Commit()
}
