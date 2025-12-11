package sync

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/example/offline-pos/internal/db"
)

type Service struct {
	db            *sql.DB
	centralURL    string
	online        atomic.Bool
	lastOnline    atomic.Value // time.Time
	checkInterval time.Duration
	syncInterval  time.Duration
}

func NewService(database *sql.DB, centralURL string) *Service {
	s := &Service{
		db:            database,
		centralURL:    centralURL,
		checkInterval: 30 * time.Second,
		syncInterval:  4 * time.Hour,
	}
	s.lastOnline.Store(time.Time{})
	return s
}

func (s *Service) Start(ctx context.Context) {
	go s.connectivityLoop(ctx)
	go s.syncLoop(ctx)
	log.Println("Sync service started")
}

func (s *Service) IsOnline() bool {
	return s.online.Load()
}

func (s *Service) LastOnline() time.Time {
	return s.lastOnline.Load().(time.Time)
}

func (s *Service) Status() map[string]any {
	pending, _ := db.CountPendingTransactions(s.db)
	lastSync, _ := db.GetSyncStatus(s.db, "last_product_sync")
	return map[string]any{
		"online":              s.IsOnline(),
		"lastOnline":          s.LastOnline(),
		"pendingTransactions": pending,
		"lastProductSync":     lastSync,
	}
}

func (s *Service) connectivityLoop(ctx context.Context) {
	ticker := time.NewTicker(s.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.checkConnectivity()
		}
	}
}

func (s *Service) checkConnectivity() {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(s.centralURL + "/health")

	wasOnline := s.online.Load()
	nowOnline := err == nil && resp != nil && resp.StatusCode == 200

	// Close response body to prevent connection leak
	if resp != nil && resp.Body != nil {
		resp.Body.Close()
	}

	s.online.Store(nowOnline)
	if nowOnline {
		s.lastOnline.Store(time.Now())
	}

	// Trigger sync on connectivity restored
	if !wasOnline && nowOnline {
		log.Println("Connectivity restored - triggering sync")
		go s.syncTransactions()
	}
}
