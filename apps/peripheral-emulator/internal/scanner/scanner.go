package scanner

import (
	"sync"
	"time"
)

// ScanEvent represents a barcode scan
type ScanEvent struct {
	Barcode   string `json:"barcode"`
	Symbology string `json:"symbology"`
	Timestamp string `json:"timestamp"`
}

// ScanHandler is called when a scan occurs
type ScanHandler func(ScanEvent)

// Scanner represents the scanner state machine
type Scanner struct {
	enabled  bool
	handlers []ScanHandler
	mu       sync.RWMutex
}

// New creates a new scanner (disabled by default)
func New() *Scanner {
	return &Scanner{
		enabled:  false,
		handlers: make([]ScanHandler, 0),
	}
}

// Enabled returns whether the scanner is enabled
func (s *Scanner) Enabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.enabled
}

// Enable enables the scanner
func (s *Scanner) Enable() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enabled = true
}

// Disable disables the scanner
func (s *Scanner) Disable() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enabled = false
}

// OnScan registers a handler for scan events
func (s *Scanner) OnScan(handler ScanHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers = append(s.handlers, handler)
}

// TriggerScan triggers a scan event (if enabled)
func (s *Scanner) TriggerScan(barcode, symbology string) {
	s.mu.RLock()
	if !s.enabled {
		s.mu.RUnlock()
		return
	}
	handlers := make([]ScanHandler, len(s.handlers))
	copy(handlers, s.handlers)
	s.mu.RUnlock()

	event := ScanEvent{
		Barcode:   barcode,
		Symbology: symbology,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	for _, h := range handlers {
		h(event)
	}
}
