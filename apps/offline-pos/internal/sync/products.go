package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/example/offline-pos/internal/db"
)

// httpClient with timeout for catalog sync operations
var syncClient = &http.Client{Timeout: 30 * time.Second}

func (s *Service) syncLoop(ctx context.Context) {
	// Initial sync on startup
	s.syncCatalog()

	ticker := time.NewTicker(s.syncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if s.IsOnline() {
				s.syncCatalog()
			}
		}
	}
}

func (s *Service) syncCatalog() {
	if !s.IsOnline() {
		return
	}

	log.Println("Starting catalog sync...")

	if err := s.syncProducts(); err != nil {
		log.Printf("Product sync failed: %v", err)
	}

	if err := s.syncOperators(); err != nil {
		log.Printf("Operator sync failed: %v", err)
	}

	db.SetSyncStatus(s.db, "last_product_sync", time.Now().Format(time.RFC3339))
	log.Println("Catalog sync complete")
}

func (s *Service) syncProducts() error {
	resp, err := syncClient.Get(s.centralURL + "/api/products")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("product sync failed: status %d", resp.StatusCode)
	}

	var products []db.Product
	if err := json.NewDecoder(resp.Body).Decode(&products); err != nil {
		return err
	}

	return db.ReplaceAllProducts(s.db, products)
}

func (s *Service) syncOperators() error {
	resp, err := syncClient.Get(s.centralURL + "/api/operators")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("operator sync failed: status %d", resp.StatusCode)
	}

	var operators []db.Operator
	if err := json.NewDecoder(resp.Body).Decode(&operators); err != nil {
		return err
	}

	return db.ReplaceAllOperators(s.db, operators)
}
