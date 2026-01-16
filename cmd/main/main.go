package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Swatantra-66/go-bookstore/pkg/middleware"
	"github.com/Swatantra-66/go-bookstore/pkg/routes"
	"github.com/gorilla/mux"
)

func main() {
	router := mux.NewRouter()
	router.Use(middleware.LoggingMiddleware)
	routes.RegisterBookRoutes(router)

	fmt.Printf("Server running on http://localhost:8000\n")
	log.Fatal(http.ListenAndServe(":8000", router))
}
