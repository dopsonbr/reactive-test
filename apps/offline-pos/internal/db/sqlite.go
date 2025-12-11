package db

import (
	"database/sql"
	"log"
	"sync"

	_ "modernc.org/sqlite"
)

var (
	instance *sql.DB
	once     sync.Once
)

func Open(path string) (*sql.DB, error) {
	var err error
	once.Do(func() {
		instance, err = sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)")
		if err != nil {
			return
		}
		if err = instance.Ping(); err != nil {
			return
		}
		if err = runMigrations(instance); err != nil {
			return
		}
		log.Printf("Database opened: %s", path)
	})
	return instance, err
}

func Close() error {
	if instance != nil {
		return instance.Close()
	}
	return nil
}
