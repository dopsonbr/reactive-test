package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/example/offline-pos/internal/db"
	"github.com/example/offline-pos/internal/session"
	"github.com/example/offline-pos/internal/sync"
)

type APIHandlers struct {
	db      *sql.DB
	syncSvc *sync.Service
}

func NewAPIHandlers(database *sql.DB, syncSvc *sync.Service) *APIHandlers {
	return &APIHandlers{
		db:      database,
		syncSvc: syncSvc,
	}
}

func (h *APIHandlers) Status(w http.ResponseWriter, r *http.Request) {
	status := h.syncSvc.Status()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (h *APIHandlers) SearchProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]any{})
		return
	}

	products, err := db.SearchProducts(h.db, query, 20)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *APIHandlers) GetProduct(w http.ResponseWriter, r *http.Request) {
	upc := r.PathValue("upc")
	product, err := db.GetProductByUPC(h.db, upc)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if product == nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *APIHandlers) AddToCart(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No session", http.StatusUnauthorized)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	var req struct {
		UPC      string `json:"upc"`
		Quantity int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Default quantity to 1 if not specified
	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	product, err := db.GetProductByUPC(h.db, req.UPC)
	if err != nil || product == nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	// Add to cart or update quantity
	found := false
	for i := range sess.Cart {
		if sess.Cart[i].UPC == product.UPC {
			sess.Cart[i].Quantity += req.Quantity
			found = true
			break
		}
	}

	if !found {
		sess.Cart = append(sess.Cart, db.LineItem{
			UPC:        product.UPC,
			Name:       product.Name,
			PriceCents: product.PriceCents,
			Quantity:   req.Quantity,
		})
	}

	w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) UpdateCart(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No session", http.StatusUnauthorized)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	var req struct {
		UPC      string `json:"upc"`
		Quantity int    `json:"quantity"` // Absolute value if provided
		Delta    int    `json:"delta"`    // Increment/decrement if provided
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	for i := range sess.Cart {
		if sess.Cart[i].UPC == req.UPC {
			if req.Delta != 0 {
				// Apply delta (increment/decrement)
				sess.Cart[i].Quantity += req.Delta
			} else if req.Quantity > 0 {
				// Set absolute quantity
				sess.Cart[i].Quantity = req.Quantity
			}
			break
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) RemoveFromCart(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No session", http.StatusUnauthorized)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	var req struct {
		UPC string `json:"upc"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	for i, item := range sess.Cart {
		if item.UPC == req.UPC {
			sess.Cart = append(sess.Cart[:i], sess.Cart[i+1:]...)
			break
		}
	}

	w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) GetCart(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"items":    []any{},
			"subtotal": 0,
			"tax":      0,
			"total":    0,
		})
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"items":    []any{},
			"subtotal": 0,
			"tax":      0,
			"total":    0,
		})
		return
	}

	// Calculate totals
	subtotal := 0
	for _, item := range sess.Cart {
		subtotal += item.PriceCents * item.Quantity
	}
	tax := subtotal * 825 / 10000 // 8.25% tax rate
	total := subtotal + tax

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"items":    sess.Cart,
		"subtotal": subtotal,
		"tax":      tax,
		"total":    total,
	})
}

func (h *APIHandlers) CompleteTransaction(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Error(w, "No session", http.StatusUnauthorized)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	var req struct {
		PaymentMethod string `json:"payment_method"`
		PaymentRef    string `json:"payment_ref"`
		CustomerEmail string `json:"customer_email"`
		CustomerPhone string `json:"customer_phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Calculate totals
	subtotal := 0
	for _, item := range sess.Cart {
		subtotal += item.PriceCents * item.Quantity
	}
	tax := subtotal * 825 / 10000 // 8.25% tax rate
	total := subtotal + tax

	txn := &db.Transaction{
		OperatorPIN:   sess.OperatorPIN,
		Items:         sess.Cart,
		Subtotal:      subtotal,
		Tax:           tax,
		Total:         total,
		PaymentMethod: req.PaymentMethod,
		PaymentRef:    req.PaymentRef,
		CustomerEmail: req.CustomerEmail,
		CustomerPhone: req.CustomerPhone,
	}

	if err := db.CreateTransaction(h.db, txn); err != nil {
		http.Error(w, "Failed to save transaction", http.StatusInternalServerError)
		return
	}

	// Clear cart
	sess.Cart = []db.LineItem{}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"transaction_id": txn.ID,
		"total":          strconv.Itoa(total),
	})
}
