package db

import (
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
)

type LineItem struct {
	UPC         string `json:"upc"`
	Name        string `json:"name"`
	PriceCents  int    `json:"price_cents"`
	Quantity    int    `json:"quantity"`
	ManualEntry bool   `json:"manual_entry,omitempty"`
}

type Transaction struct {
	ID            string
	OperatorPIN   string
	Items         []LineItem
	Subtotal      int
	Tax           int
	Total         int
	PaymentMethod string
	PaymentRef    string
	CustomerEmail string
	CustomerPhone string
	Status        string
	CreatedAt     string
}

func CreateTransaction(db *sql.DB, t *Transaction) error {
	t.ID = uuid.New().String()
	itemsJSON, err := json.Marshal(t.Items)
	if err != nil {
		return err
	}
	_, err = db.Exec(
		`INSERT INTO transactions
         (id, operator_pin, items_json, subtotal, tax, total, payment_method,
          payment_ref, customer_email, customer_phone, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
		t.ID, t.OperatorPIN, itemsJSON, t.Subtotal, t.Tax, t.Total,
		t.PaymentMethod, t.PaymentRef, t.CustomerEmail, t.CustomerPhone,
	)
	return err
}

func GetPendingTransactions(db *sql.DB) ([]Transaction, error) {
	rows, err := db.Query(
		`SELECT id, operator_pin, items_json, subtotal, tax, total,
                payment_method, payment_ref, customer_email, customer_phone, created_at
         FROM transactions WHERE status = 'pending'`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txns []Transaction
	for rows.Next() {
		var t Transaction
		var itemsJSON string
		if err := rows.Scan(&t.ID, &t.OperatorPIN, &itemsJSON, &t.Subtotal, &t.Tax, &t.Total,
			&t.PaymentMethod, &t.PaymentRef, &t.CustomerEmail, &t.CustomerPhone, &t.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal([]byte(itemsJSON), &t.Items); err != nil {
			return nil, err
		}
		t.Status = "pending"
		txns = append(txns, t)
	}
	return txns, rows.Err()
}

func MarkTransactionSynced(db *sql.DB, id string) error {
	_, err := db.Exec(
		`UPDATE transactions SET status = 'synced', synced_at = datetime('now') WHERE id = ?`, id,
	)
	return err
}

func CountPendingTransactions(db *sql.DB) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM transactions WHERE status = 'pending'`).Scan(&count)
	return count, err
}
