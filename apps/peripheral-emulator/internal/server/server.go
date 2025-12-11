package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/reactive-platform/peripheral-emulator/internal/dashboard"
	"github.com/reactive-platform/peripheral-emulator/internal/payment"
	"github.com/reactive-platform/peripheral-emulator/internal/scanner"
	"github.com/reactive-platform/peripheral-emulator/internal/stomp"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Capabilities represents device capabilities
type Capabilities struct {
	Scanner *ScannerCapability `json:"scanner,omitempty"`
	Payment *PaymentCapability `json:"payment,omitempty"`
}

// ScannerCapability represents scanner capabilities
type ScannerCapability struct {
	Available   bool     `json:"available"`
	Mode        string   `json:"mode,omitempty"`
	Symbologies []string `json:"symbologies,omitempty"`
}

// PaymentCapability represents payment capabilities
type PaymentCapability struct {
	Available bool     `json:"available"`
	Methods   []string `json:"methods,omitempty"`
	Cashback  bool     `json:"cashback,omitempty"`
}

// CapabilitiesMessage is sent to clients on connect
type CapabilitiesMessage struct {
	Type         string       `json:"type"`
	Timestamp    string       `json:"timestamp"`
	DeviceID     string       `json:"deviceId"`
	Capabilities Capabilities `json:"capabilities"`
}

// Server represents the emulator server
type Server struct {
	wsPort   int
	httpPort int
	deviceID string
	caps     Capabilities
	clients  map[*websocket.Conn]map[string]bool // conn -> subscribed destinations
	scanner  *scanner.Scanner
	payment  *payment.Payment
	mu       sync.RWMutex
}

// NewServer creates a new emulator server
func NewServer(wsPort, httpPort int, deviceID string) *Server {
	s := &Server{
		wsPort:   wsPort,
		httpPort: httpPort,
		deviceID: deviceID,
		caps: Capabilities{
			Scanner: &ScannerCapability{
				Available:   true,
				Mode:        "bridge",
				Symbologies: []string{"ean13", "upc-a", "qr", "pdf417"},
			},
			Payment: &PaymentCapability{
				Available: true,
				Methods:   []string{"chip", "contactless", "swipe"},
				Cashback:  true,
			},
		},
		clients: make(map[*websocket.Conn]map[string]bool),
		scanner: scanner.New(),
		payment: payment.New(payment.Config{
			ReadingDelay:     500 * time.Millisecond,
			PinDelay:         2 * time.Second,
			AuthorizingDelay: 1 * time.Second,
			DeclineRate:      0.1, // 10% decline rate by default
		}),
	}

	// Wire scanner events to broadcast
	s.scanner.OnScan(func(e scanner.ScanEvent) {
		s.broadcastScanEvent(e)
	})

	// Wire payment events to broadcast
	s.payment.OnEvent(func(e payment.Event) {
		s.broadcastPaymentEvent(e)
	})

	return s
}

// Start starts the server
func (s *Server) Start() error {
	// WebSocket server
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/stomp", s.handleWebSocket)

	go func() {
		addr := fmt.Sprintf(":%d", s.wsPort)
		log.Printf("WebSocket server starting on %s", addr)
		if err := http.ListenAndServe(addr, wsMux); err != nil {
			log.Fatalf("WebSocket server error: %v", err)
		}
	}()

	// HTTP control server
	httpMux := http.NewServeMux()

	// Dashboard (serve at root)
	httpMux.Handle("/", dashboard.Handler())

	// Control endpoints
	httpMux.HandleFunc("/control/state", s.handleState)
	httpMux.HandleFunc("/control/scanner/scan", s.handleTriggerScan)
	httpMux.HandleFunc("/control/scanner/enable", s.handleScannerEnable)
	httpMux.HandleFunc("/control/scanner/disable", s.handleScannerDisable)
	httpMux.HandleFunc("/control/payment/insert", s.handlePaymentInsert)
	httpMux.HandleFunc("/control/payment/approve", s.handlePaymentApprove)
	httpMux.HandleFunc("/control/payment/decline", s.handlePaymentDecline)
	httpMux.HandleFunc("/health", s.handleHealth)

	addr := fmt.Sprintf(":%d", s.httpPort)
	log.Printf("HTTP control server starting on %s", addr)
	return http.ListenAndServe(addr, httpMux)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	s.mu.Lock()
	s.clients[conn] = make(map[string]bool)
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.clients, conn)
		s.mu.Unlock()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		frame, err := stomp.ParseFrame(message)
		if err != nil {
			log.Printf("Frame parse error: %v", err)
			continue
		}

		s.handleFrame(conn, frame)
	}
}

func (s *Server) handleFrame(conn *websocket.Conn, frame *stomp.Frame) {
	switch frame.Command {
	case "CONNECT":
		// Send CONNECTED
		response := stomp.NewConnectedFrame()
		conn.WriteMessage(websocket.TextMessage, response.Serialize())

	case "SUBSCRIBE":
		dest := frame.Headers["destination"]
		s.mu.Lock()
		s.clients[conn][dest] = true
		s.mu.Unlock()

		// If subscribing to capabilities, send current caps
		if dest == "/topic/capabilities" {
			s.sendCapabilities(conn)
		}

	case "UNSUBSCRIBE":
		dest := frame.Headers["destination"]
		s.mu.Lock()
		delete(s.clients[conn], dest)
		s.mu.Unlock()

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
			if err := json.Unmarshal(frame.Body, &req); err != nil {
				log.Printf("Error unmarshaling payment request: %v", err)
			} else if err := s.payment.StartCollection(req); err != nil {
				log.Printf("Error starting payment collection: %v", err)
			}
		case "/app/payment/cancel":
			s.payment.Cancel()
		}

	case "DISCONNECT":
		log.Printf("Client disconnected")
	}
}

func (s *Server) sendCapabilities(conn *websocket.Conn) {
	msg := CapabilitiesMessage{
		Type:         "capabilities",
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
		DeviceID:     s.deviceID,
		Capabilities: s.caps,
	}

	frame, err := stomp.NewMessageFrame("/topic/capabilities", msg)
	if err != nil {
		log.Printf("Error creating capabilities frame: %v", err)
		return
	}

	conn.WriteMessage(websocket.TextMessage, frame.Serialize())
}

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

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func (s *Server) broadcastScanEvent(e scanner.ScanEvent) {
	msg := struct {
		Type  string             `json:"type"`
		Event scanner.ScanEvent `json:"event"`
	}{
		Type:  "scan",
		Event: e,
	}

	frame, err := stomp.NewMessageFrame("/topic/scanner/events", msg)
	if err != nil {
		log.Printf("Error creating scan frame: %v", err)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for conn, subs := range s.clients {
		if subs["/topic/scanner/events"] {
			conn.WriteMessage(websocket.TextMessage, frame.Serialize())
		}
	}
}

func (s *Server) handleTriggerScan(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Barcode   string `json:"barcode"`
		Symbology string `json:"symbology"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Barcode == "" {
		req.Barcode = "0012345678905"
	}
	if req.Symbology == "" {
		req.Symbology = "ean13"
	}

	s.scanner.TriggerScan(req.Barcode, req.Symbology)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *Server) handleScannerEnable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.scanner.Enable()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"enabled": true})
}

func (s *Server) handleScannerDisable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.scanner.Disable()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"enabled": false})
}

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
