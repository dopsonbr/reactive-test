package server

import (
	"io/fs"
	"net/http"

	"github.com/example/offline-pos/internal/handlers"
)

func (s *Server) registerRoutes() {
	// Static assets - strip "static" prefix from embedded FS
	staticContent, _ := fs.Sub(s.staticFS, "static")
	s.router.Handle("GET /static/", http.StripPrefix("/static/",
		http.FileServer(http.FS(staticContent))))

	// Pages
	pages := handlers.NewPageHandlers(s.db, s.templatesFS)
	s.router.HandleFunc("GET /", pages.Login)
	s.router.HandleFunc("POST /login", pages.HandleLogin)
	s.router.HandleFunc("GET /scan", pages.Scan)
	s.router.HandleFunc("GET /cart", pages.Cart)
	s.router.HandleFunc("GET /payment", pages.Payment)
	s.router.HandleFunc("GET /complete", pages.Complete)
	s.router.HandleFunc("POST /logout", pages.Logout)

	// API
	api := handlers.NewAPIHandlers(s.db, s.syncSvc)
	s.router.HandleFunc("GET /api/status", api.Status)
	s.router.HandleFunc("GET /api/products/search", api.SearchProducts)
	s.router.HandleFunc("GET /api/products/{upc}", api.GetProduct)
	s.router.HandleFunc("POST /api/cart/add", api.AddToCart)
	s.router.HandleFunc("POST /api/cart/update", api.UpdateCart)
	s.router.HandleFunc("POST /api/cart/remove", api.RemoveFromCart)
	s.router.HandleFunc("GET /api/cart", api.GetCart)
	s.router.HandleFunc("POST /api/transaction/complete", api.CompleteTransaction)
}
