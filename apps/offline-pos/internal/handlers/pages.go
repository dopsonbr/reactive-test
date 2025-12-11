package handlers

import (
	"database/sql"
	"embed"
	"fmt"
	"html/template"
	"net/http"

	"github.com/example/offline-pos/internal/db"
	"github.com/example/offline-pos/internal/session"
)

type PageHandlers struct {
	db        *sql.DB
	fs        embed.FS
	funcMap   template.FuncMap
	templates map[string]*template.Template
}

func NewPageHandlers(database *sql.DB, fs embed.FS) *PageHandlers {
	// Add helper functions
	funcMap := template.FuncMap{
		"formatPrice": formatPrice,
	}

	// Pre-parse templates: each page needs its own template set
	// because Go templates share namespace for {{define}} blocks
	pages := []string{"login", "scan", "cart", "payment", "complete"}
	templates := make(map[string]*template.Template)

	for _, page := range pages {
		tmpl := template.Must(
			template.New("").Funcs(funcMap).ParseFS(fs,
				"templates/layout.html",
				"templates/"+page+".html",
			),
		)
		templates[page] = tmpl
	}

	return &PageHandlers{
		db:        database,
		fs:        fs,
		funcMap:   funcMap,
		templates: templates,
	}
}

func (h *PageHandlers) render(w http.ResponseWriter, page string, data map[string]interface{}) {
	tmpl, ok := h.templates[page]
	if !ok {
		http.Error(w, "Template not found", http.StatusInternalServerError)
		return
	}
	if err := tmpl.ExecuteTemplate(w, "layout", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

// formatPrice converts cents to dollars (e.g., 1299 -> "12.99")
func formatPrice(cents int) string {
	dollars := float64(cents) / 100.0
	return fmt.Sprintf("%.2f", dollars)
}

func (h *PageHandlers) Login(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title":       "Login",
		"StoreNumber": "0001", // TODO: Get from config
	}
	h.render(w, "login", data)
}

func (h *PageHandlers) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form", http.StatusBadRequest)
		return
	}

	pin := r.FormValue("pin")
	operator, err := db.ValidateOperator(h.db, pin)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if operator == nil {
		http.Error(w, "Invalid PIN", http.StatusUnauthorized)
		return
	}

	// Create session
	sess := session.Create(operator)

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sess.ID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	http.Redirect(w, r, "/scan", http.StatusSeeOther)
}

func (h *PageHandlers) Scan(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	data := map[string]interface{}{
		"Title":       "Scan",
		"StoreNumber": "0001", // TODO: Get from config
		"Operator":    sess.Operator,
		"CartCount":   len(sess.Cart),
	}

	h.render(w, "scan", data)
}

func (h *PageHandlers) Cart(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	// Calculate totals
	subtotal := 0
	for _, item := range sess.Cart {
		subtotal += item.PriceCents * item.Quantity
	}
	tax := subtotal * 825 / 10000 // 8.25% tax
	total := subtotal + tax

	data := map[string]interface{}{
		"Title":       "Cart",
		"StoreNumber": "0001", // TODO: Get from config
		"Operator":    sess.Operator,
		"Cart":        sess.Cart,
		"Subtotal":    subtotal,
		"Tax":         tax,
		"Total":       total,
	}

	h.render(w, "cart", data)
}

func (h *PageHandlers) Payment(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	// Calculate total
	subtotal := 0
	for _, item := range sess.Cart {
		subtotal += item.PriceCents * item.Quantity
	}
	tax := subtotal * 825 / 10000 // 8.25% tax
	total := subtotal + tax

	data := map[string]interface{}{
		"Title":       "Payment",
		"StoreNumber": "0001", // TODO: Get from config
		"Operator":    sess.Operator,
		"Total":       total,
	}

	h.render(w, "payment", data)
}

func (h *PageHandlers) Complete(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err != nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	sess := session.Get(cookie.Value)
	if sess == nil {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	// Calculate total
	subtotal := 0
	for _, item := range sess.Cart {
		subtotal += item.PriceCents * item.Quantity
	}
	tax := subtotal * 825 / 10000 // 8.25% tax
	total := subtotal + tax

	data := map[string]interface{}{
		"Title":         "Complete",
		"StoreNumber":   "0001", // TODO: Get from config
		"Operator":      sess.Operator,
		"TransactionID": "TXN-12345678", // TODO: Get from last transaction
		"Total":         total,
		"ItemsJSON":     "[]", // TODO: Serialize cart items as JSON
	}

	h.render(w, "complete", data)
}

func (h *PageHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_id")
	if err == nil {
		session.Delete(cookie.Value)
	}

	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	http.Redirect(w, r, "/", http.StatusSeeOther)
}
