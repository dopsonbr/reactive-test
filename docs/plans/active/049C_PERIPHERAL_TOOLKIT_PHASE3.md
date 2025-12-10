# Peripheral Developer Toolkit - Phase 3: Payment Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement full payment terminal flow with state machine in Go, SDK Core service, React hook, and MSW handler.

**Architecture:** Payment is the most complex device with a multi-state flow: idle → card_presented → reading_card → pin_required → pin_entry → authorizing → approved/declined. The emulator must model realistic timing and allow forcing specific outcomes via the control API.

**Tech Stack:** Go, TypeScript, React, Vitest, MSW

**Parent Plan:** [049_PERIPHERAL_DEVELOPER_TOOLKIT.md](./049_PERIPHERAL_DEVELOPER_TOOLKIT.md)
**Previous Phase:** [049B - Phase 2: Scanner Implementation](./049B_PERIPHERAL_TOOLKIT_PHASE2.md)

---

## Task 1: Payment State Machine (Go)

**Files:**
- Create: `apps/peripheral-emulator/internal/payment/payment.go`
- Create: `apps/peripheral-emulator/internal/payment/payment_test.go`

**Step 1: Write failing tests for payment state machine**

Create `apps/peripheral-emulator/internal/payment/payment_test.go`:

```go
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
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/peripheral-emulator && go test ./internal/payment/... -v
```

Expected: FAIL - package not found

**Step 3: Implement payment state machine**

Create `apps/peripheral-emulator/internal/payment/payment.go`:

```go
package payment

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// State represents payment terminal states
type State string

const (
	StateIdle          State = "idle"
	StateCardPresented State = "card_presented"
	StateReadingCard   State = "reading_card"
	StatePinRequired   State = "pin_required"
	StatePinEntry      State = "pin_entry"
	StateAuthorizing   State = "authorizing"
	StateApproved      State = "approved"
	StateDeclined      State = "declined"
	StateCancelled     State = "cancelled"
	StateError         State = "error"
)

// PaymentMethod represents how the card was presented
type PaymentMethod string

const (
	MethodChip        PaymentMethod = "chip"
	MethodContactless PaymentMethod = "contactless"
	MethodSwipe       PaymentMethod = "swipe"
)

// EventType represents types of payment events
type EventType string

const (
	EventStateChange EventType = "state_change"
	EventResult      EventType = "result"
)

// Event represents a payment event
type Event struct {
	Type   EventType              `json:"type"`
	State  State                  `json:"state,omitempty"`
	Result *Result                `json:"result,omitempty"`
	Data   map[string]interface{} `json:"data,omitempty"`
}

// Request represents a payment collection request
type Request struct {
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	AllowCashback bool   `json:"allowCashback,omitempty"`
	Timeout       int64  `json:"timeout,omitempty"`
}

// Result represents the outcome of a payment
type Result struct {
	Approved      bool          `json:"approved"`
	TransactionID string        `json:"transactionId,omitempty"`
	Method        PaymentMethod `json:"method,omitempty"`
	CardBrand     string        `json:"cardBrand,omitempty"`
	Last4         string        `json:"last4,omitempty"`
	AuthCode      string        `json:"authCode,omitempty"`
	DeclineReason string        `json:"declineReason,omitempty"`
	Error         string        `json:"error,omitempty"`
}

// EventHandler handles payment events
type EventHandler func(Event)

// Config configures payment behavior
type Config struct {
	ReadingDelay     time.Duration
	PinDelay         time.Duration
	AuthorizingDelay time.Duration
	DeclineRate      float64 // 0.0 to 1.0
}

// Payment represents the payment terminal state machine
type Payment struct {
	config   Config
	state    State
	request  *Request
	method   PaymentMethod
	handlers []EventHandler
	cancel   chan struct{}
	mu       sync.RWMutex
}

// New creates a new payment terminal
func New(config Config) *Payment {
	// Set defaults
	if config.ReadingDelay == 0 {
		config.ReadingDelay = 500 * time.Millisecond
	}
	if config.PinDelay == 0 {
		config.PinDelay = 2 * time.Second
	}
	if config.AuthorizingDelay == 0 {
		config.AuthorizingDelay = 1 * time.Second
	}

	return &Payment{
		config:   config,
		state:    StateIdle,
		handlers: make([]EventHandler, 0),
	}
}

// State returns current state
func (p *Payment) State() State {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.state
}

// OnEvent registers an event handler
func (p *Payment) OnEvent(handler EventHandler) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.handlers = append(p.handlers, handler)
}

// StartCollection starts a payment collection
func (p *Payment) StartCollection(req Request) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.state != StateIdle {
		return fmt.Errorf("cannot start collection in state %s", p.state)
	}

	p.request = &req
	p.cancel = make(chan struct{})
	return nil
}

// InsertCard simulates card insertion
func (p *Payment) InsertCard(method string) error {
	p.mu.Lock()
	if p.request == nil {
		p.mu.Unlock()
		return fmt.Errorf("no active collection")
	}
	p.method = PaymentMethod(method)
	p.mu.Unlock()

	// Start the flow in background
	go p.runFlow()
	return nil
}

// Cancel cancels the current transaction
func (p *Payment) Cancel() {
	p.mu.Lock()
	if p.cancel != nil {
		close(p.cancel)
		p.cancel = nil
	}
	p.mu.Unlock()

	p.setState(StateCancelled)
}

// ForceApprove forces approval (for testing)
func (p *Payment) ForceApprove() {
	p.setState(StateApproved)
	p.emitResult(true)
	p.reset()
}

// ForceDecline forces decline (for testing)
func (p *Payment) ForceDecline(reason string) {
	p.setState(StateDeclined)
	p.emitResultWithReason(false, reason)
	p.reset()
}

func (p *Payment) runFlow() {
	// Card presented
	p.setState(StateCardPresented)

	// Reading card
	if !p.waitWithCancel(100 * time.Millisecond) {
		return
	}
	p.setState(StateReadingCard)

	if !p.waitWithCancel(p.config.ReadingDelay) {
		return
	}

	// PIN required (for chip)
	p.mu.RLock()
	method := p.method
	p.mu.RUnlock()

	if method == MethodChip {
		p.setState(StatePinRequired)
		if !p.waitWithCancel(100 * time.Millisecond) {
			return
		}
		p.setState(StatePinEntry)
		if !p.waitWithCancel(p.config.PinDelay) {
			return
		}
	}

	// Authorizing
	p.setState(StateAuthorizing)
	if !p.waitWithCancel(p.config.AuthorizingDelay) {
		return
	}

	// Decide outcome
	if rand.Float64() < p.config.DeclineRate {
		p.setState(StateDeclined)
		p.emitResultWithReason(false, "insufficient_funds")
	} else {
		p.setState(StateApproved)
		p.emitResult(true)
	}

	p.reset()
}

func (p *Payment) waitWithCancel(d time.Duration) bool {
	p.mu.RLock()
	cancel := p.cancel
	p.mu.RUnlock()

	if cancel == nil {
		return false
	}

	select {
	case <-time.After(d):
		return true
	case <-cancel:
		return false
	}
}

func (p *Payment) setState(state State) {
	p.mu.Lock()
	p.state = state
	handlers := make([]EventHandler, len(p.handlers))
	copy(handlers, p.handlers)
	p.mu.Unlock()

	event := Event{
		Type:  EventStateChange,
		State: state,
	}

	for _, h := range handlers {
		h(event)
	}
}

func (p *Payment) emitResult(approved bool) {
	p.emitResultWithReason(approved, "")
}

func (p *Payment) emitResultWithReason(approved bool, reason string) {
	p.mu.RLock()
	method := p.method
	handlers := make([]EventHandler, len(p.handlers))
	copy(handlers, p.handlers)
	p.mu.RUnlock()

	result := &Result{
		Approved:      approved,
		Method:        method,
		CardBrand:     "visa",
		Last4:         "4242",
		DeclineReason: reason,
	}

	if approved {
		result.TransactionID = fmt.Sprintf("txn-%d", time.Now().UnixNano())
		result.AuthCode = fmt.Sprintf("AUTH%d", rand.Intn(100000))
	}

	event := Event{
		Type:   EventResult,
		Result: result,
	}

	for _, h := range handlers {
		h(event)
	}
}

func (p *Payment) reset() {
	p.mu.Lock()
	p.request = nil
	p.method = ""
	p.cancel = nil
	p.state = StateIdle
	p.mu.Unlock()
}
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/peripheral-emulator && go test ./internal/payment/... -v
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/peripheral-emulator/internal/payment
git commit -m "feat(peripheral-emulator): implement payment state machine"
```

---

## Task 2: Wire Payment to Server

**Files:**
- Modify: `apps/peripheral-emulator/internal/server/server.go`

**Step 1: Update server to include payment**

Add import:
```go
import (
	// ... existing imports
	"github.com/reactive-platform/peripheral-emulator/internal/payment"
)
```

Add payment field to Server:
```go
type Server struct {
	// ... existing fields
	payment *payment.Payment
}
```

Update NewServer:
```go
func NewServer(wsPort, httpPort int, deviceID string) *Server {
	s := &Server{
		// ... existing initialization
		payment: payment.New(payment.Config{
			ReadingDelay:     500 * time.Millisecond,
			PinDelay:         2 * time.Second,
			AuthorizingDelay: 1 * time.Second,
			DeclineRate:      0.1, // 10% decline rate by default
		}),
	}

	// Wire scanner events
	s.scanner.OnScan(func(e scanner.ScanEvent) {
		s.broadcastScanEvent(e)
	})

	// Wire payment events
	s.payment.OnEvent(func(e payment.Event) {
		s.broadcastPaymentEvent(e)
	})

	return s
}
```

Add payment broadcast method:
```go
func (s *Server) broadcastPaymentEvent(e payment.Event) {
	frame, err := stomp.NewMessageFrame("/topic/payment/events", e)
	if err != nil {
		log.Printf("Error creating payment frame: %v", err)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for conn, subs := range s.clients {
		if subs["/topic/payment/events"] {
			conn.WriteMessage(websocket.TextMessage, frame.Serialize())
		}
	}
}
```

Add payment control endpoints:
```go
func (s *Server) Start() error {
	// ... existing setup

	// HTTP control server - add payment endpoints
	httpMux.HandleFunc("/control/payment/insert", s.handlePaymentInsert)
	httpMux.HandleFunc("/control/payment/approve", s.handlePaymentApprove)
	httpMux.HandleFunc("/control/payment/decline", s.handlePaymentDecline)

	// ... rest of Start()
}

func (s *Server) handlePaymentInsert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Method string `json:"method"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.Method == "" {
		req.Method = "chip"
	}

	if err := s.payment.InsertCard(req.Method); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) handlePaymentApprove(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.payment.ForceApprove()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

func (s *Server) handlePaymentDecline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.Reason == "" {
		req.Reason = "declined_by_test"
	}

	s.payment.ForceDecline(req.Reason)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "declined"})
}
```

Handle SEND messages for payment:
```go
func (s *Server) handleFrame(conn *websocket.Conn, frame *stomp.Frame) {
	switch frame.Command {
	// ... existing cases

	case "SEND":
		dest := frame.Headers["destination"]
		log.Printf("Received SEND to %s: %s", dest, string(frame.Body))

		switch dest {
		case "/app/scanner/enable":
			s.scanner.Enable()
		case "/app/scanner/disable":
			s.scanner.Disable()
		case "/app/payment/collect":
			var req payment.Request
			if err := json.Unmarshal(frame.Body, &req); err == nil {
				s.payment.StartCollection(req)
			}
		case "/app/payment/cancel":
			s.payment.Cancel()
		}
	}
}
```

Update handleState:
```go
func (s *Server) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"deviceId":       s.deviceID,
		"capabilities":   s.caps,
		"clients":        len(s.clients),
		"scannerEnabled": s.scanner.Enabled(),
		"paymentState":   s.payment.State(),
	})
}
```

**Step 2: Verify build**

```bash
cd apps/peripheral-emulator && go build .
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/peripheral-emulator/internal/server/server.go
git commit -m "feat(peripheral-emulator): wire payment to server"
```

---

## Task 3: Payment Service (SDK Core)

**Files:**
- Create: `libs/frontend/peripheral-sdk/core/src/services/payment-service.ts`
- Create: `libs/frontend/peripheral-sdk/core/src/services/payment-service.spec.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/services/index.ts`
- Modify: `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`

**Step 1: Write failing test for PaymentService**

Create `libs/frontend/peripheral-sdk/core/src/services/payment-service.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from './payment-service';
import { StompClient } from '../client';
import {
  PaymentState,
  PaymentEvent,
  PaymentStateEvent,
  PaymentResultEvent,
  PaymentRequest,
} from '../types';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockStomp: {
    subscribe: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStomp = {
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      publish: vi.fn(),
    };
    service = new PaymentService(mockStomp as unknown as StompClient);
  });

  describe('collect', () => {
    it('should publish collect command and return promise', async () => {
      const request: PaymentRequest = {
        amount: 4750,
        currency: 'USD',
      };

      // Simulate approval after publish
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const resultPromise = service.collect(request);

      // Trigger the subscription first
      await new Promise((r) => setTimeout(r, 0));

      // Simulate approval
      const resultEvent: PaymentResultEvent = {
        type: 'result',
        result: {
          approved: true,
          transactionId: 'txn-123',
          method: 'chip',
          cardBrand: 'visa',
          last4: '4242',
          authCode: 'ABC123',
        },
      };
      stompHandler!(resultEvent);

      const result = await resultPromise;

      expect(mockStomp.publish).toHaveBeenCalledWith('/app/payment/collect', {
        action: 'collect',
        request,
      });
      expect(result.approved).toBe(true);
      expect(result.transactionId).toBe('txn-123');
    });

    it('should reject on decline', async () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const resultPromise = service.collect({
        amount: 4750,
        currency: 'USD',
      });

      await new Promise((r) => setTimeout(r, 0));

      const resultEvent: PaymentResultEvent = {
        type: 'result',
        result: {
          approved: false,
          declineReason: 'insufficient_funds',
        },
      };
      stompHandler!(resultEvent);

      const result = await resultPromise;
      expect(result.approved).toBe(false);
      expect(result.declineReason).toBe('insufficient_funds');
    });
  });

  describe('cancel', () => {
    it('should publish cancel command', async () => {
      await service.cancel();

      expect(mockStomp.publish).toHaveBeenCalledWith('/app/payment/cancel', {
        action: 'cancel',
      });
    });
  });

  describe('onStateChange', () => {
    it('should call handler on state changes', () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      const stateHandler = vi.fn();
      service.onStateChange(stateHandler);

      const stateEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'card_presented',
      };
      stompHandler!(stateEvent);

      expect(stateHandler).toHaveBeenCalledWith('card_presented');
    });
  });

  describe('state', () => {
    it('should track current state', () => {
      let stompHandler: (msg: PaymentEvent) => void;
      mockStomp.subscribe.mockImplementation((dest, handler) => {
        if (dest === '/topic/payment/events') {
          stompHandler = handler;
        }
        return vi.fn();
      });

      // Initialize subscription
      service.onStateChange(() => {});

      expect(service.state).toBe('idle');

      const stateEvent: PaymentStateEvent = {
        type: 'state_change',
        state: 'authorizing',
      };
      stompHandler!(stateEvent);

      expect(service.state).toBe('authorizing');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-core -- --run`

Expected: FAIL - module './payment-service' not found

**Step 3: Implement PaymentService**

Create `libs/frontend/peripheral-sdk/core/src/services/payment-service.ts`:

```typescript
import { StompClient, Unsubscribe } from '../client';
import {
  PaymentState,
  PaymentRequest,
  PaymentResult,
  PaymentEvent,
  PaymentCommand,
} from '../types';

/**
 * Handler for payment state changes
 */
export type PaymentStateHandler = (state: PaymentState) => void;

/**
 * Service for payment operations
 */
export class PaymentService {
  private stomp: StompClient;
  private _state: PaymentState = 'idle';
  private subscription: Unsubscribe | null = null;
  private stateHandlers: Set<PaymentStateHandler> = new Set();
  private pendingResolve: ((result: PaymentResult) => void) | null = null;

  constructor(stomp: StompClient) {
    this.stomp = stomp;
  }

  /**
   * Current payment state
   */
  get state(): PaymentState {
    return this._state;
  }

  /**
   * Collect payment
   */
  async collect(request: PaymentRequest): Promise<PaymentResult> {
    // Ensure we're subscribed to events
    this.ensureSubscribed();

    // Reset state
    this._state = 'idle';

    // Create promise for result
    const resultPromise = new Promise<PaymentResult>((resolve) => {
      this.pendingResolve = resolve;
    });

    // Send collect command
    const command: PaymentCommand = {
      action: 'collect',
      request,
    };
    this.stomp.publish('/app/payment/collect', command);

    return resultPromise;
  }

  /**
   * Cancel current payment
   */
  async cancel(): Promise<void> {
    const command: PaymentCommand = { action: 'cancel' };
    this.stomp.publish('/app/payment/cancel', command);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: PaymentStateHandler): Unsubscribe {
    this.stateHandlers.add(handler);
    this.ensureSubscribed();

    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  /**
   * Clean up subscriptions
   */
  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.stateHandlers.clear();
    this.pendingResolve = null;
  }

  private ensureSubscribed(): void {
    if (this.subscription) return;

    this.subscription = this.stomp.subscribe<PaymentEvent>(
      '/topic/payment/events',
      (event) => {
        this.handleEvent(event);
      }
    );
  }

  private handleEvent(event: PaymentEvent): void {
    if (event.type === 'state_change') {
      this._state = event.state;
      this.stateHandlers.forEach((h) => h(event.state));
    } else if (event.type === 'result') {
      if (this.pendingResolve) {
        this.pendingResolve(event.result);
        this.pendingResolve = null;
      }
      // Reset state after result
      this._state = 'idle';
    }
  }
}
```

**Step 4: Update services index**

Modify `libs/frontend/peripheral-sdk/core/src/services/index.ts`:

```typescript
export * from './scanner-service';
export * from './payment-service';
```

**Step 5: Add payment to PeripheralClient**

Modify `libs/frontend/peripheral-sdk/core/src/peripheral-client.ts`:

Add import:
```typescript
import { ScannerService, PaymentService } from './services';
```

Add payment field:
```typescript
export class PeripheralClient {
  private _payment: PaymentService;
  // ... existing fields
```

Update constructor:
```typescript
constructor(endpoint: string, options: PeripheralClientOptions = {}) {
  this.stomp = new StompClient(endpoint, options);
  this._scanner = new ScannerService(this.stomp);
  this._payment = new PaymentService(this.stomp);
  // ... rest
}
```

Add getter:
```typescript
/**
 * Payment service
 */
get payment(): PaymentService {
  return this._payment;
}
```

Update disconnect:
```typescript
async disconnect(): Promise<void> {
  this._scanner.destroy();
  this._payment.destroy();
  // ... rest
}
```

**Step 6: Run tests to verify they pass**

Run: `pnpm nx test peripheral-core -- --run`

Expected: All tests pass

**Step 7: Commit**

```bash
git add libs/frontend/peripheral-sdk/core/src/services
git add libs/frontend/peripheral-sdk/core/src/peripheral-client.ts
git commit -m "feat(peripheral-core): implement PaymentService"
```

---

## Task 4: usePayment Hook

**Files:**
- Create: `libs/frontend/peripheral-sdk/react/src/hooks/use-payment.ts`
- Create: `libs/frontend/peripheral-sdk/react/src/hooks/use-payment.spec.tsx`
- Modify: `libs/frontend/peripheral-sdk/react/src/hooks/index.ts`

**Step 1: Write failing test for usePayment**

Create `libs/frontend/peripheral-sdk/react/src/hooks/use-payment.spec.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { usePayment } from './use-payment';
import { PeripheralProvider } from '../context';
import { PaymentState, PaymentResult } from '@reactive-platform/peripheral-core';

const mockPayment = {
  collect: vi.fn(),
  cancel: vi.fn(),
  state: 'idle' as PaymentState,
  onStateChange: vi.fn().mockReturnValue(vi.fn()),
  destroy: vi.fn(),
};

vi.mock('@reactive-platform/peripheral-core', () => ({
  PeripheralClient: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    capabilities: { payment: { available: true, methods: ['chip', 'contactless'] } },
    connected: true,
    onCapabilities: vi.fn().mockReturnValue(vi.fn()),
    onConnectionChange: vi.fn().mockReturnValue(vi.fn()),
    scanner: {
      enable: vi.fn(),
      disable: vi.fn(),
      enabled: false,
      onScan: vi.fn().mockReturnValue(vi.fn()),
      destroy: vi.fn(),
    },
    payment: mockPayment,
  })),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      {children}
    </PeripheralProvider>
  );
}

describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPayment.state = 'idle';
  });

  it('should return payment state', async () => {
    const { result } = renderHook(() => usePayment(), { wrapper });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
  });

  it('should call collect', async () => {
    const mockResult: PaymentResult = {
      approved: true,
      transactionId: 'txn-123',
    };
    mockPayment.collect.mockResolvedValue(mockResult);

    const { result } = renderHook(() => usePayment(), { wrapper });

    let collectResult: PaymentResult | undefined;
    await act(async () => {
      collectResult = await result.current.collect({
        amount: 4750,
        currency: 'USD',
      });
    });

    expect(mockPayment.collect).toHaveBeenCalledWith({
      amount: 4750,
      currency: 'USD',
    });
    expect(collectResult?.approved).toBe(true);
  });

  it('should call cancel', async () => {
    mockPayment.cancel.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePayment(), { wrapper });

    await act(async () => {
      await result.current.cancel();
    });

    expect(mockPayment.cancel).toHaveBeenCalled();
  });

  it('should track state changes', async () => {
    let stateHandler: ((state: PaymentState) => void) | null = null;
    mockPayment.onStateChange.mockImplementation((handler) => {
      stateHandler = handler;
      return vi.fn();
    });

    const { result } = renderHook(() => usePayment(), { wrapper });

    await act(async () => {
      stateHandler?.('authorizing');
    });

    expect(result.current.state).toBe('authorizing');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm nx test peripheral-react -- --run`

Expected: FAIL - module './use-payment' not found

**Step 3: Implement usePayment**

Create `libs/frontend/peripheral-sdk/react/src/hooks/use-payment.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  PaymentState,
  PaymentRequest,
  PaymentResult,
} from '@reactive-platform/peripheral-core';
import { usePeripherals } from '../context';

/**
 * Return type for usePayment hook
 */
export interface UsePaymentReturn {
  /** Collect payment */
  collect: (request: PaymentRequest) => Promise<PaymentResult>;
  /** Cancel current payment */
  cancel: () => Promise<void>;
  /** Current payment state */
  state: PaymentState;
  /** Most recent payment result */
  result: PaymentResult | null;
  /** Whether payment capability is available */
  available: boolean;
  /** Available payment methods */
  methods: string[];
}

/**
 * Hook for payment operations
 */
export function usePayment(): UsePaymentReturn {
  const { client, capabilities } = usePeripherals();
  const [state, setState] = useState<PaymentState>('idle');
  const [result, setResult] = useState<PaymentResult | null>(null);

  // Subscribe to state changes
  useEffect(() => {
    const payment = client?.payment;
    if (!payment) return;

    const unsubscribe = payment.onStateChange((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [client]);

  const collect = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      const payment = client?.payment;
      if (!payment) {
        throw new Error('Payment service not available');
      }

      const paymentResult = await payment.collect(request);
      setResult(paymentResult);
      return paymentResult;
    },
    [client]
  );

  const cancel = useCallback(async () => {
    const payment = client?.payment;
    if (!payment) return;
    await payment.cancel();
  }, [client]);

  return {
    collect,
    cancel,
    state,
    result,
    available: capabilities.payment?.available ?? false,
    methods: capabilities.payment?.methods ?? [],
  };
}
```

**Step 4: Update hooks index**

Modify `libs/frontend/peripheral-sdk/react/src/hooks/index.ts`:

```typescript
export * from './use-scanner';
export * from './use-payment';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm nx test peripheral-react -- --run`

Expected: All tests pass

**Step 6: Commit**

```bash
git add libs/frontend/peripheral-sdk/react/src/hooks
git commit -m "feat(peripheral-react): implement usePayment hook"
```

---

## Task 5: MSW Payment Handlers

**Files:**
- Create: `libs/frontend/peripheral-mocks/src/payment.ts`
- Create: `libs/frontend/peripheral-mocks/src/payment.spec.ts`
- Modify: `libs/frontend/peripheral-mocks/src/index.ts`

**Step 1: Implement payment mock utilities**

Create `libs/frontend/peripheral-mocks/src/payment.ts`:

```typescript
import { PaymentResult, PaymentState } from '@reactive-platform/peripheral-core';

/**
 * Mock payment configuration
 */
export interface MockPaymentConfig {
  /** Default outcome */
  defaultOutcome?: 'approved' | 'declined';
  /** Decline reason when declined */
  declineReason?: string;
  /** Delay before result (ms) */
  resultDelay?: number;
}

// Global mock state
let mockConfig: MockPaymentConfig = {
  defaultOutcome: 'approved',
  resultDelay: 100,
};

let pendingResolve: ((result: PaymentResult) => void) | null = null;
let currentState: PaymentState = 'idle';
const stateListeners: Set<(state: PaymentState) => void> = new Set();

/**
 * Configure mock payment behavior
 */
export function configureMockPayment(config: MockPaymentConfig): void {
  mockConfig = { ...mockConfig, ...config };
}

/**
 * Force payment approval
 */
export function forcePaymentApprove(
  overrides: Partial<PaymentResult> = {}
): PaymentResult {
  const result: PaymentResult = {
    approved: true,
    transactionId: `mock-txn-${Date.now()}`,
    method: 'chip',
    cardBrand: 'visa',
    last4: '4242',
    authCode: `MOCK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    ...overrides,
  };

  setMockPaymentState('approved');

  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }

  setTimeout(() => setMockPaymentState('idle'), 100);

  return result;
}

/**
 * Force payment decline
 */
export function forcePaymentDecline(
  options: { reason?: string } = {}
): PaymentResult {
  const result: PaymentResult = {
    approved: false,
    declineReason: options.reason ?? mockConfig.declineReason ?? 'declined_by_test',
  };

  setMockPaymentState('declined');

  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }

  setTimeout(() => setMockPaymentState('idle'), 100);

  return result;
}

/**
 * Set mock payment state (for testing intermediate states)
 */
export function setMockPaymentState(state: PaymentState): void {
  currentState = state;
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Get current mock payment state
 */
export function getMockPaymentState(): PaymentState {
  return currentState;
}

/**
 * Register state change listener
 */
export function onMockPaymentStateChange(
  listener: (state: PaymentState) => void
): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/**
 * Simulate starting a payment (for internal use)
 */
export function startMockPayment(): Promise<PaymentResult> {
  return new Promise((resolve) => {
    pendingResolve = resolve;

    // Auto-resolve based on config if no manual intervention
    setTimeout(() => {
      if (pendingResolve) {
        if (mockConfig.defaultOutcome === 'declined') {
          forcePaymentDecline();
        } else {
          forcePaymentApprove();
        }
      }
    }, mockConfig.resultDelay ?? 100);
  });
}

/**
 * Reset mock payment state
 */
export function resetMockPayment(): void {
  mockConfig = {
    defaultOutcome: 'approved',
    resultDelay: 100,
  };
  pendingResolve = null;
  currentState = 'idle';
  stateListeners.clear();
}
```

**Step 2: Write tests for payment mocks**

Create `libs/frontend/peripheral-mocks/src/payment.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  forcePaymentApprove,
  forcePaymentDecline,
  setMockPaymentState,
  getMockPaymentState,
  onMockPaymentStateChange,
  configureMockPayment,
  startMockPayment,
  resetMockPayment,
} from './payment';

describe('Mock Payment', () => {
  beforeEach(() => {
    resetMockPayment();
  });

  describe('forcePaymentApprove', () => {
    it('should return approved result', () => {
      const result = forcePaymentApprove();

      expect(result.approved).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.cardBrand).toBe('visa');
    });

    it('should accept overrides', () => {
      const result = forcePaymentApprove({ cardBrand: 'mastercard' });

      expect(result.cardBrand).toBe('mastercard');
    });

    it('should update state to approved', () => {
      forcePaymentApprove();

      expect(getMockPaymentState()).toBe('approved');
    });
  });

  describe('forcePaymentDecline', () => {
    it('should return declined result', () => {
      const result = forcePaymentDecline({ reason: 'insufficient_funds' });

      expect(result.approved).toBe(false);
      expect(result.declineReason).toBe('insufficient_funds');
    });

    it('should update state to declined', () => {
      forcePaymentDecline();

      expect(getMockPaymentState()).toBe('declined');
    });
  });

  describe('state management', () => {
    it('should track state changes', () => {
      setMockPaymentState('authorizing');

      expect(getMockPaymentState()).toBe('authorizing');
    });

    it('should notify state listeners', () => {
      const listener = vi.fn();
      onMockPaymentStateChange(listener);

      setMockPaymentState('pin_required');

      expect(listener).toHaveBeenCalledWith('pin_required');
    });

    it('should unsubscribe listener', () => {
      const listener = vi.fn();
      const unsubscribe = onMockPaymentStateChange(listener);

      unsubscribe();
      setMockPaymentState('authorizing');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('startMockPayment', () => {
    it('should auto-approve with default config', async () => {
      const result = await startMockPayment();

      expect(result.approved).toBe(true);
    });

    it('should auto-decline when configured', async () => {
      configureMockPayment({ defaultOutcome: 'declined' });

      const result = await startMockPayment();

      expect(result.approved).toBe(false);
    });
  });
});
```

**Step 3: Update main index**

Modify `libs/frontend/peripheral-mocks/src/index.ts`:

```typescript
// @reactive-platform/peripheral-mocks
// MSW handlers for peripheral SDK testing

export * from './scanner';
export * from './payment';
```

**Step 4: Run tests**

Run: `pnpm nx test peripheral-mocks -- --run`

Expected: All tests pass

**Step 5: Commit**

```bash
git add libs/frontend/peripheral-mocks/src/payment.ts
git add libs/frontend/peripheral-mocks/src/payment.spec.ts
git add libs/frontend/peripheral-mocks/src/index.ts
git commit -m "feat(peripheral-mocks): implement MSW payment mock utilities"
```

---

## Phase 3 Complete

**What was built:**
- Full payment state machine in Go emulator with realistic flow
- HTTP control endpoints for payment (insert, approve, decline)
- PaymentService in SDK Core with state tracking
- usePayment React hook
- MSW payment mock utilities (forceApprove, forceDecline, etc.)

**Next Phase:** [049D - Developer Experience](./049D_PERIPHERAL_TOOLKIT_PHASE4.md)
