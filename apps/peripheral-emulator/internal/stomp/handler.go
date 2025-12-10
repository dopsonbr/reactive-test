package stomp

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// Frame represents a STOMP frame
type Frame struct {
	Command string
	Headers map[string]string
	Body    []byte
}

// ParseFrame parses a STOMP frame from bytes
func ParseFrame(data []byte) (*Frame, error) {
	str := string(data)
	lines := strings.Split(str, "\n")

	if len(lines) < 1 {
		return nil, fmt.Errorf("invalid frame: no command")
	}

	frame := &Frame{
		Command: strings.TrimSpace(lines[0]),
		Headers: make(map[string]string),
	}

	bodyStart := 1
	for i := 1; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if line == "" {
			bodyStart = i + 1
			break
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			frame.Headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}

	if bodyStart < len(lines) {
		body := strings.Join(lines[bodyStart:], "\n")
		// Remove null terminator if present
		body = strings.TrimSuffix(body, "\x00")
		frame.Body = []byte(body)
	}

	return frame, nil
}

// Serialize serializes a STOMP frame to bytes
func (f *Frame) Serialize() []byte {
	var sb strings.Builder
	sb.WriteString(f.Command)
	sb.WriteString("\n")

	for k, v := range f.Headers {
		sb.WriteString(k)
		sb.WriteString(":")
		sb.WriteString(v)
		sb.WriteString("\n")
	}

	sb.WriteString("\n")

	if len(f.Body) > 0 {
		sb.Write(f.Body)
	}

	sb.WriteString("\x00")

	return []byte(sb.String())
}

// NewConnectedFrame creates a CONNECTED response frame
func NewConnectedFrame() *Frame {
	return &Frame{
		Command: "CONNECTED",
		Headers: map[string]string{
			"version":    "1.2",
			"heart-beat": "10000,10000",
		},
	}
}

// NewMessageFrame creates a MESSAGE frame
func NewMessageFrame(destination string, body interface{}) (*Frame, error) {
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	return &Frame{
		Command: "MESSAGE",
		Headers: map[string]string{
			"destination":  destination,
			"content-type": "application/json",
			"message-id":   fmt.Sprintf("msg-%d", time.Now().UnixNano()),
		},
		Body: bodyBytes,
	}, nil
}
