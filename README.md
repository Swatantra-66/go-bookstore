# 📚 BookUniverse

This full-stack application combines a high-performance REST API written in Go with futuristic features like Voice Search, Barcode Scanning, and Generative AI integration to create a seamless digital library experience

## Screenshot

<img src="static/BookUniverse2-Pro.png" width="700" alt="BookUniverse Screenshot"><br>
<img src="static/BookUniverse-Pro.png" width="700" alt="BookUniverse Screenshot">

## ✨ Key Features

### 🧠 AI & Automation

- **🤖 AI Librarian:** Integrated with **Google Gemini AI** to provide context-aware book recommendations based on your current library.
- **✨ Magic Auto-Fill:** Lazy? Just type a book title and hit the Magic Wand. The AI automatically fills in the Author and Publisher details for you.

### ⚡️ Interactive UI

- **🎙️ Voice Search (Jarvis Mode):** Navigate your collection using voice commands via the Web Speech API. Just say, "Show me Harry Potter."
- **📷 Barcode Scanner:** Use your device's camera to scan physical book ISBNs and add them to your database instantly.
- **🌗 Dark Mode:** A polished, glassmorphism UI that persists your theme preference (Light/Dark) using LocalStorage.

### 🏗️ Core Architecture

- **🚀 Go Backend API:** Built with `Gorilla Mux` for robust routing and `GORM` for MySQL database interactions.
- **📂 Modular Design:** Clean separation of concerns with a dedicated Go backend serving a modular frontend (HTML/CSS/JS separated).
- **❤️ Smart Favorites:** Persist your top picks and reading status (To Read, Reading, Completed) directly to the MySQL database.

## 🛠️ Tech Stack

**Backend (API Layer):**

- **Language:** Go (Golang)
- **Routing:** Gorilla Mux
- **Database:** MySQL with GORM
- **AI Integration:** Google Gemini 2.5 Flash API

**Frontend (Client Layer):**

- **Core:** HTML5, CSS3, Vanilla JavaScript
- **Scanning:** QuaggaJS (Barcode/ISBN scanning)
- **Voice:** Web Speech API (Native Browser Support)
- **Icons:** Boxicons

## 🚀 Getting Started

### Prerequisites

- Go installed (v1.18+)
- MySQL installed and running
- A free [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1.  **Clone the repository**

    ```bash
    git clone [https://github.com/Swatantra-66/go-bookstore.git](https://github.com/Swatantra-66/go-bookstore.git)
    cd go-bookstore
    ```

2.  **Setup Environment**
    Create a `.env` file in the root directory and add your keys:

    ```env
    DB_USER=root
    DB_PASSWORD=yourpassword
    DB_NAME=simplerest
    GEMINI_API_KEY=your_google_ai_key_here
    ```

3.  **Install Go Dependencies**

    ```bash
    go mod tidy
    ```

4.  **Run the Backend Server**

    ```bash
    go run cmd/main/main.go
    ```

5.  **Access the App**
    Open your browser and navigate to: `http://localhost:8000/`

## 📂 Project Structure

```text
go-bookstore/
├── cmd/
│   └── main/
│       └── main.go
├── pkg/
│   ├── config/
│   │   └── app.go
│   ├── handlers/
│   │   └── book_handlers.go
│   ├── models/
│   │   └── book.go
│   ├── routes/
│   │   └── routes.go
│   └── utils/
│       └── utils.go
├── css/
│   └── style.css
├── js/
│   └── script.js
├── static/
│   ├── index.html
│   ├── public.html
│   └── bookUniverse.png
├── .env
├── .gitignore
├── go.mod
├── go.sum
└── README.md
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests.
