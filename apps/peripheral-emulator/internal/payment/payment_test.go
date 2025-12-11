package payment

import (
	"testing"
	"time"
)

func TestPayment_InitialState(t *testing.T) {
	p := New(Config{})
	if p.State() != StateIdle {
		t.Errorf("expected initial state idle, got %s", p.State())
	}
}

func TestPayment_StartCollection(t *testing.T) {
	p := New(Config{})

	events := make(chan Event, 10)
	p.OnEvent(func(e Event) {
		events <- e
	})

	err := p.StartCollection(Request{
		Amount:   4750,
		Currency: "USD",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be waiting for card
	if p.State() != StateIdle {
		t.Errorf("expected state to be idle (waiting for card), got %s", p.State())
	}
}

func TestPayment_FullFlow(t *testing.T) {
	p := New(Config{
		ReadingDelay:     10 * time.Millisecond,
		PinDelay:         10 * time.Millisecond,
		AuthorizingDelay: 10 * time.Millisecond,
	})

	events := make(chan Event, 10)
	p.OnEvent(func(e Event) {
		events <- e
	})

	// Start collection
	p.StartCollection(Request{Amount: 4750, Currency: "USD"})

	// Insert card
	p.InsertCard("chip")

	// Collect events - should go through: presented → reading → pin_required → pin_entry → authorizing → approved
	statesSeen := make([]State, 0)
	timeout := time.After(500 * time.Millisecond)

	for {
		select {
		case e := <-events:
			if e.Type == EventStateChange {
				statesSeen = append(statesSeen, e.State)
				if e.State == StateApproved || e.State == StateDeclined {
					goto done
				}
			}
		case <-timeout:
			t.Fatalf("timeout waiting for events, got states: %v", statesSeen)
		}
	}
done:

	// Verify we saw the full flow
	expected := []State{
		StateCardPresented,
		StateReadingCard,
		StatePinRequired,
		StatePinEntry,
		StateAuthorizing,
		StateApproved,
	}

	if len(statesSeen) != len(expected) {
		t.Errorf("expected %d states, got %d: %v", len(expected), len(statesSeen), statesSeen)
	}

	for i, s := range expected {
		if i < len(statesSeen) && statesSeen[i] != s {
			t.Errorf("state %d: expected %s, got %s", i, s, statesSeen[i])
		}
	}
}

func TestPayment_ForceDecline(t *testing.T) {
	p := New(Config{
		ReadingDelay:     10 * time.Millisecond,
		PinDelay:         10 * time.Millisecond,
		AuthorizingDelay: 10 * time.Millisecond,
		DeclineRate:      1.0, // Always decline
	})

	events := make(chan Event, 10)
	p.OnEvent(func(e Event) {
		events <- e
	})

	p.StartCollection(Request{Amount: 4750, Currency: "USD"})
	p.InsertCard("chip")

	// Wait for final state
	timeout := time.After(500 * time.Millisecond)
	for {
		select {
		case e := <-events:
			if e.Type == EventStateChange && e.State == StateDeclined {
				return // Success
			}
			if e.Type == EventStateChange && e.State == StateApproved {
				t.Fatal("expected decline but got approved")
			}
		case <-timeout:
			t.Fatal("timeout waiting for decline")
		}
	}
}

func TestPayment_Cancel(t *testing.T) {
	p := New(Config{
		ReadingDelay: 1 * time.Second, // Long delay
	})

	events := make(chan Event, 10)
	p.OnEvent(func(e Event) {
		events <- e
	})

	p.StartCollection(Request{Amount: 4750, Currency: "USD"})
	p.InsertCard("chip")

	// Cancel while reading
	time.Sleep(10 * time.Millisecond)
	p.Cancel()

	// Should see cancelled state
	timeout := time.After(100 * time.Millisecond)
	for {
		select {
		case e := <-events:
			if e.Type == EventStateChange && e.State == StateCancelled {
				return // Success
			}
		case <-timeout:
			t.Fatal("timeout waiting for cancelled state")
		}
	}
}
