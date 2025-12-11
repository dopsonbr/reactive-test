package db

import "database/sql"

func GetSyncStatus(db *sql.DB, key string) (string, error) {
	var value string
	err := db.QueryRow(`SELECT value FROM sync_status WHERE key = ?`, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return value, err
}

func SetSyncStatus(db *sql.DB, key, value string) error {
	_, err := db.Exec(
		`INSERT INTO sync_status (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		key, value,
	)
	return err
}
