package scanner

import (
	"testing"
)

func TestScanner_InitialState(t *testing.T) {
	s := New()
	if s.Enabled() {
		t.Error("expected scanner to start disabled")
	}
}

func TestScanner_Enable(t *testing.T) {
	s := New()
	s.Enable()
	if !s.Enabled() {
		t.Error("expected scanner to be enabled after Enable()")
	}
}

func TestScanner_Disable(t *testing.T) {
	s := New()
	s.Enable()
	s.Disable()
	if s.Enabled() {
		t.Error("expected scanner to be disabled after Disable()")
	}
}

func TestScanner_Scan(t *testing.T) {
	s := New()
	events := make(chan ScanEvent, 1)
	s.OnScan(func(e ScanEvent) {
		events <- e
	})

	s.Enable()
	s.TriggerScan("1234567890123", "ean13")

	select {
	case e := <-events:
		if e.Barcode != "1234567890123" {
			t.Errorf("expected barcode 1234567890123, got %s", e.Barcode)
		}
		if e.Symbology != "ean13" {
			t.Errorf("expected symbology ean13, got %s", e.Symbology)
		}
	default:
		t.Error("expected scan event")
	}
}

func TestScanner_ScanWhenDisabled(t *testing.T) {
	s := New()
	events := make(chan ScanEvent, 1)
	s.OnScan(func(e ScanEvent) {
		events <- e
	})

	// Scanner is disabled by default
	s.TriggerScan("1234567890123", "ean13")

	select {
	case <-events:
		t.Error("should not receive scan event when disabled")
	default:
		// Expected - no event
	}
}
