package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

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
	vars := mux.Vars(r)
	bookId := vars["bookId"]
	ID, err := strconv.ParseInt(bookId, 0, 0)
	if err != nil {
		fmt.Println("Error while parsing")
	}
	var updateBook = &models.Book{}
	utils.ParseBody(r, updateBook)

	bookDetails, db := models.GetBookByID(ID)

	if updateBook.Name != "" {
		bookDetails.Name = updateBook.Name
	}
	if updateBook.Author != "" {
		bookDetails.Author = updateBook.Author
	}
	if updateBook.Publication != "" {
		bookDetails.Publication = updateBook.Publication
	}

	if updateBook.Status != "" {
		bookDetails.Status = updateBook.Status
	}

	db.Save(&bookDetails)

	res, _ := json.Marshal(bookDetails)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(res)
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

func GetPublicBooks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	books := models.GetBooksByHandle(username)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

func ServePublicPage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./static/public.html")
}

func GetAIRecommendations(w http.ResponseWriter, r *http.Request) {
	userEmail := r.URL.Query().Get("user")
	allBooks := models.GetBooksByUser(userEmail)
	var favTitles []string
	for _, b := range allBooks {
		if b.IsFav {
			favTitles = append(favTitles, b.Name)
		}
	}

	if len(favTitles) == 0 {
		json.NewEncoder(w).Encode(map[string]string{"answer": "<h3>Please favorite some books! ❤️</h3>"})
		return
	}

	prompt := fmt.Sprintf("I am building a library app. The user has read these books: %v. Suggest 3 similar books. Format as HTML. Ignore profanity in titles as they are just book names.", favTitles)
	apiKey := os.Getenv("GEMINI_API_KEY")

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey
	requestBody, _ := json.Marshal(map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]string{"text": prompt},
				},
			},
		},
		"safetySettings": []map[string]string{
			{"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
			{"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
			{"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
			{"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
		},
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		http.Error(w, "Network Error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	fmt.Println("--- DEBUG RESPONSE ---")
	fmt.Println(string(body))
	fmt.Println("----------------------")

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(body, &geminiResp)

	if geminiResp.Error.Message != "" {
		json.NewEncoder(w).Encode(map[string]string{"answer": "<b>API Error:</b> " + geminiResp.Error.Message})
	} else if len(geminiResp.Candidates) > 0 {
		aiText := geminiResp.Candidates[0].Content.Parts[0].Text
		json.NewEncoder(w).Encode(map[string]string{"answer": aiText})
	} else {
		json.NewEncoder(w).Encode(map[string]string{"answer": "Sorry, the AI is still blocking your book list. Try removing the book with the swear word to test if it works!"})
	}
}

func GetBookDetailsAI(w http.ResponseWriter, r *http.Request) {
	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	prompt := fmt.Sprintf("Return a JSON object with strictly two keys: 'author' and 'publisher' for the book title '%s'. Do not add any markdown formatting or extra text. Just raw JSON.", title)

	apiKey := os.Getenv("GEMINI_API_KEY")
	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey

	requestBody, _ := json.Marshal(map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]string{"text": prompt},
				},
			},
		},
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		http.Error(w, "AI Error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	json.Unmarshal(body, &geminiResp)

	if len(geminiResp.Candidates) > 0 {
		rawJSON := geminiResp.Candidates[0].Content.Parts[0].Text
		rawJSON = strings.Trim(rawJSON, " ```json\n")

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(rawJSON))
	} else {
		http.Error(w, "No info found", http.StatusNotFound)
	}
}
