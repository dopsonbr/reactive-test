package main

import (
	"flag"
	"log"

	"github.com/reactive-platform/peripheral-emulator/internal/server"
)

func main() {
	wsPort := flag.Int("port-ws", 9100, "WebSocket server port")
	httpPort := flag.Int("port-http", 9101, "HTTP control server port")
	deviceID := flag.String("device-id", "emulator-001", "Device ID for capabilities")

	flag.Parse()

	log.Printf("Starting Peripheral Emulator")
	log.Printf("  Device ID: %s", *deviceID)
	log.Printf("  WebSocket: ws://localhost:%d/stomp", *wsPort)
	log.Printf("  HTTP Control: http://localhost:%d", *httpPort)

	srv := server.NewServer(*wsPort, *httpPort, *deviceID)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
