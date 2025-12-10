package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
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
	mu       sync.RWMutex
}

// NewServer creates a new emulator server
func NewServer(wsPort, httpPort int, deviceID string) *Server {
	return &Server{
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
	}
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
	httpMux.HandleFunc("/control/state", s.handleState)
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
		// Handle app messages (future: scanner enable, payment collect, etc.)

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
		"deviceId":     s.deviceID,
		"capabilities": s.caps,
		"clients":      len(s.clients),
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
