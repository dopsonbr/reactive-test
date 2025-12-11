package session

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/example/offline-pos/internal/db"
)

type Session struct {
	ID          string
	OperatorPIN string
	Operator    *db.Operator
	Cart        []db.LineItem
	CreatedAt   time.Time
	LastAccess  time.Time
}

var (
	sessions = make(map[string]*Session)
	mu       sync.RWMutex
)

func Create(op *db.Operator) *Session {
	id := generateID()
	s := &Session{
		ID:          id,
		OperatorPIN: op.PIN,
		Operator:    op,
		Cart:        []db.LineItem{},
		CreatedAt:   time.Now(),
		LastAccess:  time.Now(),
	}
	mu.Lock()
	sessions[id] = s
	mu.Unlock()
	return s
}

func Get(id string) *Session {
	mu.Lock()
	defer mu.Unlock()
	if s, ok := sessions[id]; ok {
		s.LastAccess = time.Now()
		return s
	}
	return nil
}

func Delete(id string) {
	mu.Lock()
	delete(sessions, id)
	mu.Unlock()
}

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
