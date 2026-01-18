package models

import (
	"github.com/Swatantra-66/go-bookstore/pkg/config"
	"github.com/jinzhu/gorm"
)

var db *gorm.DB

type Book struct {
	gorm.Model
	Name        string `json:"name"`
	Author      string `json:"author"`
	Publication string `json:"publication"`
	UserEmail   string `json:"user_email"`
	IsFav       bool   `json:"isFav"`
	Status      string `json:"status"`
}

type User struct {
	gorm.Model
	Name     string `json:"name"`
	Username string `json:"username" gorm:"unique"`
	Email    string `json:"email" gorm:"unique"`
	Password string `json:"password"`
}

func CreateUser(u *User) *User {
	db.NewRecord(u)
	db.Create(&u)
	return u
}

func CheckLogin(email, password string) (*User, error) {
	var user User
	if err := db.Where("email = ? AND password = ?", email, password).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (b *Book) Validate() string {
	if b.Name == "" {
		return "Book name cannot be empty"
	}
	if b.Author == "" {
		return "Author name cannot be empty"
	}
	if b.Publication == "" {
		return "Publication cannot be empty"
	}
	return "" // Empty string means no error
}

func init() {
	config.Connect()
	db = config.GetDB()
	db.AutoMigrate(&Book{})
	db.AutoMigrate(&User{})
}

func (b *Book) CreateBook() *Book {
	db.NewRecord(b)
	db.Create(&b)
	return b
}

func GetAllBooks() []Book {
	var Books []Book
	db.Find(&Books)
	return Books
}

func GetBookByID(Id int64) (*Book, *gorm.DB) {
	var getBook Book
	db := db.Where("ID=?", Id).Find(&getBook)
	return &getBook, db
}

func DeleteBook(Id int64) Book {
	var book Book
	db.Where("ID=?", Id).Find(&book)
	db.Delete(&book)
	return book
}

func UpdateBook(Id int64, book *Book) (*Book, *gorm.DB) {
	var existingBook Book

	db := db.Where("ID=?", Id).Find(&existingBook)

	if book.Name != "" {
		existingBook.Name = book.Name
	}
	if book.Author != "" {
		existingBook.Author = book.Author
	}
	if book.Publication != "" {
		existingBook.Publication = book.Publication
	}

	db.Save(&existingBook)
	return &existingBook, db
}

func GetBooksByUser(email string) []Book {
	var Books []Book
	db.Where("user_email = ?", email).Find(&Books)
	return Books
}

func GetBooksByHandle(username string) []Book {
	var user User
	var books []Book

	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		return []Book{}
	}

	db.Where("user_email = ?", user.Email).Find(&books)
	return books
}
