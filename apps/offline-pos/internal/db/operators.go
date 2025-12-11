package db

import "database/sql"

type Operator struct {
	PIN        string
	Name       string
	EmployeeID string
	IsManager  bool
}

func ValidateOperator(db *sql.DB, pin string) (*Operator, error) {
	var o Operator
	var isManager int
	err := db.QueryRow(
		`SELECT pin, name, employee_id, is_manager FROM operators WHERE pin = ?`, pin,
	).Scan(&o.PIN, &o.Name, &o.EmployeeID, &isManager)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	o.IsManager = isManager == 1
	return &o, err
}

func ReplaceAllOperators(db *sql.DB, operators []Operator) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM operators"); err != nil {
		return err
	}
	stmt, err := tx.Prepare(
		`INSERT INTO operators (pin, name, employee_id, is_manager, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
	)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, o := range operators {
		manager := 0
		if o.IsManager {
			manager = 1
		}
		if _, err := stmt.Exec(o.PIN, o.Name, o.EmployeeID, manager); err != nil {
			return err
		}
	}
	return tx.Commit()
}
