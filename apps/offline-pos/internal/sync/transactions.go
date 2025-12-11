package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/example/offline-pos/internal/db"
)

func (s *Service) syncTransactions() {
	if !s.IsOnline() {
		return
	}

	txns, err := db.GetPendingTransactions(s.db)
	if err != nil {
		log.Printf("Failed to get pending transactions: %v", err)
		return
	}

	if len(txns) == 0 {
		return
	}

	log.Printf("Uploading %d pending transactions...", len(txns))

	for _, txn := range txns {
		if err := s.uploadTransaction(txn); err != nil {
			log.Printf("Failed to upload transaction %s: %v", txn.ID, err)
			continue
		}

		if err := db.MarkTransactionSynced(s.db, txn.ID); err != nil {
			log.Printf("Failed to mark transaction %s synced: %v", txn.ID, err)
		}
	}

	log.Println("Transaction sync complete")
}

func (s *Service) uploadTransaction(txn db.Transaction) error {
	body, _ := json.Marshal(txn)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(
		s.centralURL+"/api/transactions",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("upload failed: %d", resp.StatusCode)
	}
	return nil
}
