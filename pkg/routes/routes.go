package routes

import (
	"net/http"

	"github.com/Swatantra-66/go-bookstore/pkg/handlers"
	"github.com/gorilla/mux"
)

// book routing
func RegisterBookRoutes(router *mux.Router) {
	router.HandleFunc("/book", handlers.GetBooks).Methods("GET")
	router.HandleFunc("/book/{bookId}", handlers.GetBookById).Methods("GET")
	router.HandleFunc("/book", handlers.CreateBook).Methods("POST")
	router.HandleFunc("/book/{bookId}", handlers.UpdateBook).Methods("PUT")
	router.HandleFunc("/book/{bookId}", handlers.DeleteBook).Methods("DELETE")
	router.HandleFunc("/book", handlers.GetBookByUser).Methods("GET")

	fileServer := http.FileServer(http.Dir("./static"))
	router.PathPrefix("/").Handler(http.StripPrefix("/", fileServer))
}
