package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"github.com/Swatantra-66/go-bookstore/pkg/models"
	"github.com/Swatantra-66/go-bookstore/pkg/utils"
)

var NewBook models.Book

func GetBooks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	newBooks := models.GetAllBooks()
	if err := json.NewEncoder(w).Encode(newBooks); err != nil {
		http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
		return
	}
}

func GetBookById(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	params := mux.Vars(r)
	bookId := params["bookId"]

	Id, err := strconv.ParseInt(bookId, 0, 0)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}
	bookDetails, _ := models.GetBookByID(Id)
	if res := json.NewEncoder(w).Encode(bookDetails); res != nil {
		http.Error(w, "Error: failed to fetch book", http.StatusInternalServerError)
		return
	}
}

func CreateBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	book := &models.Book{}
	if err := utils.ParseBody(r, book); err != nil {
		http.Error(w, "Error: invalid request body", http.StatusBadRequest)
		return
	}

	if msg := book.Validate(); msg != "" {
		utils.WriteError(w, http.StatusBadRequest, msg)
		return
	}

	createdBook := book.CreateBook()
	w.WriteHeader(http.StatusCreated) // 201 Created

	if res := json.NewEncoder(w).Encode(createdBook); res != nil {
		http.Error(w, "Error: failed to create book", http.StatusInternalServerError)
		return
	}
}

func DeleteBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	bookId := params["bookId"]
	Id, err := strconv.ParseInt(bookId, 0, 0)
	if err != nil {
		http.Error(w, "Error: invalid book id", http.StatusBadRequest)
		return
	}

	book := models.DeleteBook(Id)
	if res := json.NewEncoder(w).Encode(book); res != nil {
		http.Error(w, "Error: failed to encode response", http.StatusInternalServerError)
		return
	}
}

func UpdateBook(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	updatebook := &models.Book{}
	if err := utils.ParseBody(r, updatebook); err != nil {
		http.Error(w, "Error: invalid request body", http.StatusBadRequest)
		return
	}

	params := mux.Vars(r)
	bookId := params["bookId"]
	Id, err := strconv.ParseInt(bookId, 0, 0)
	if err != nil {
		http.Error(w, "Error: invalid book id", http.StatusBadRequest)
		return
	}

	bookDetails, db := models.GetBookByID(Id)
	if updatebook.Name != "" {
		bookDetails.Name = updatebook.Name
	}
	if updatebook.Author != "" {
		bookDetails.Author = updatebook.Author
	}
	if updatebook.Publication != "" {
		bookDetails.Publication = updatebook.Publication
	}

	bookDetails.IsFav = updatebook.IsFav //favourite book

	db.Save(&bookDetails)
	if res := json.NewEncoder(w).Encode(bookDetails); res != nil {
		http.Error(w, "error: failed to encode response", http.StatusInternalServerError)
		return
	}
}

func GetBookByUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userEmail := r.URL.Query().Get("user")
	newBooks := models.GetBooksByUser(userEmail)

	if err := json.NewEncoder(w).Encode(newBooks); err != nil {
		http.Error(w, "Failed to fetch book", http.StatusInternalServerError)
		return
	}
}

func SignUp(w http.ResponseWriter, r *http.Request) {
	CreateUser := &models.User{}

	utils.ParseBody(r, CreateUser)

	u := models.CreateUser(CreateUser)

	if u.ID == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict) // 409 Conflict
		json.NewEncoder(w).Encode(map[string]string{"message": "User already exists!"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(u); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func Login(w http.ResponseWriter, r *http.Request) {
	userLogin := &models.User{}
	utils.ParseBody(r, userLogin)

	foundUser, err := models.CheckLogin(userLogin.Email, userLogin.Password)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid Email or Password"})
		return
	}

	foundUser.Password = ""
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(foundUser); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}
