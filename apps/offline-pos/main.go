package main

import (
	"context"
	"embed"
	"log"
	"os"

	"github.com/example/offline-pos/internal/db"
	"github.com/example/offline-pos/internal/server"
	"github.com/example/offline-pos/internal/sync"
)

//go:embed templates/*
var templatesFS embed.FS

//go:embed static/*
var staticFS embed.FS

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // Use PORT env var if there's a conflict
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./offline-pos.db"
	}

	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	centralURL := os.Getenv("CENTRAL_URL")
	if centralURL == "" {
		centralURL = "http://localhost:8080" // default for dev
	}

	syncSvc := sync.NewService(database, centralURL)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	syncSvc.Start(ctx)

	srv := server.New(port, database, templatesFS, staticFS, syncSvc)
	log.Printf("Starting Offline POS on :%s", port)
	if err := srv.Run(); err != nil {
		log.Fatal(err)
	}
}
