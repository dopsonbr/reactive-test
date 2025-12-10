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
