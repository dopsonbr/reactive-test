package server

import (
	"database/sql"
	"embed"
	"net/http"

	"github.com/example/offline-pos/internal/sync"
)

type Server struct {
	port        string
	db          *sql.DB
	syncSvc     *sync.Service
	router      *http.ServeMux
	templatesFS embed.FS
	staticFS    embed.FS
	devMode     bool
}

func New(port string, db *sql.DB, templatesFS, staticFS embed.FS, syncSvc *sync.Service, devMode bool) *Server {
	s := &Server{
		port:        port,
		db:          db,
		syncSvc:     syncSvc,
		router:      http.NewServeMux(),
		templatesFS: templatesFS,
		staticFS:    staticFS,
		devMode:     devMode,
	}
	s.registerRoutes()
	return s
}

func (s *Server) Run() error {
	handler := s.applyMiddleware(s.router)
	return http.ListenAndServe(":"+s.port, handler)
}
