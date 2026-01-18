const API_URL = "/book";
const DEFAULT_PROFILE_IMG = "https://i.ibb.co/TCL3d2Q/0x8.webp";

let allBooks = [];
let isEditing = false;

function switchTab(tab) {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("reset-form").style.display = "none";

    document
        .querySelectorAll(".tab-btn")
        .forEach((el) => el.classList.remove("active"));

    if (tab === "login") {
        document.getElementById("login-form").style.display = "block";
        document.querySelectorAll(".tab-btn")[0].classList.add("active");
    } else if (tab === "signup") {
        document.getElementById("signup-form").style.display = "block";
        document.querySelectorAll(".tab-btn")[1].classList.add("active");
    } else {
        document.getElementById("reset-form").style.display = "block";
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const creds = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-pass").value,
    };

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
    });

    if (res.ok) {
        const user = await res.json();
        loginUser(user);
    } else {
        alert("Invalid Email or Password");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const userData = {
        name: document.getElementById("signup-name").value,
        username: document.getElementById("signup-user").value,
        email: document.getElementById("signup-email").value,
        password: document.getElementById("signup-pass").value,
    };

    const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });

    if (res.ok) {
        alert("Account created! Please login.");
        switchTab("login");
    } else {
        alert("Username or Email already exists!");
    }
}

function handleResetRequest(e) {
    e.preventDefault();
    alert("Reset functionality coming soon!");
    switchTab("login");
}

function handleSidebarToggle() {
    const width = window.innerWidth;
    const icon = document.getElementById("sidebar-icon");

    if (width > 992) {
        document.body.classList.toggle("sidebar-closed");

        if (document.body.classList.contains("sidebar-closed")) {
            icon.className = "bx bx-menu";
        } else {
            icon.className = "bx bx-x";
        }
    } else {
        document.body.classList.toggle("sidebar-active");

        if (document.body.classList.contains("sidebar-active")) {
            icon.className = "bx bx-x";
        } else {
            icon.className = "bx bx-menu";
        }
    }
}

window.onload = function () {
    const storedUser = localStorage.getItem("bookUser");
    if (!storedUser) {
        document.getElementById("auth-modal").classList.add("open");
    } else {
        updateProfileUI(JSON.parse(storedUser));
        loadBooks();
    }

    const icon = document.getElementById("sidebar-icon");
    if (window.innerWidth > 992) {
        icon.className = "bx bx-x";
    } else {
        icon.className = "bx bx-menu";
    }

    const savedTheme = localStorage.getItem("theme");
    const themeIcon = document.getElementById("theme-icon-main");
    if (savedTheme === "dark") {
        themeIcon.className = "bx bxs-sun";
    }
};

function loginUser(user) {
    localStorage.setItem("bookUser", JSON.stringify(user));
    document.getElementById("auth-modal").classList.remove("open");
    updateProfileUI(user);
    loadBooks();
}

function handleLogout() {
    if (confirm("Log out?")) {
        localStorage.removeItem("bookUser");
        location.reload();
    }
}

function updateProfileUI(user) {
    document.getElementById("user-name").innerText = user.name;
    document.getElementById("user-email").innerText = user.email;
    const avatarEl = document.getElementById("user-avatar");
    if (
        user.avatar &&
        (user.avatar.startsWith("http") || user.avatar.startsWith("data:"))
    ) {
        avatarEl.innerText = "";
        avatarEl.style.backgroundImage = `url('${user.avatar}')`;
        avatarEl.style.backgroundColor = "transparent";
    } else {
        avatarEl.style.backgroundImage = "none";
        avatarEl.style.backgroundColor = "var(--secondary)";
        avatarEl.innerText = user.avatar || user.name[0].toUpperCase();
    }
}

function toggleSettings() {
    const modal = document.getElementById("settings-modal");
    modal.classList.toggle("open");
    document.body.classList.remove("sidebar-active");
}

function changePassword(e) {
    e.preventDefault();

    const newPass = document.getElementById("new-pass").value;
    const currentUser = JSON.parse(localStorage.getItem("bookUser"));
    currentUser.password = newPass;
    localStorage.setItem("bookUser", JSON.stringify(currentUser));
    toggleSettings();
    showToast(
        "Password updated locally (connect API for permanent change)"
    );
}

function filterFavorites() {
    document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
    document.getElementById("nav-fav").classList.add("active");

    const favBooks = allBooks.filter((b) => b.isFav);
    renderGrid(favBooks);

    if (window.innerWidth <= 992) handleSidebarToggle();
}

function showAllBooks() {
    document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
    document.getElementById("nav-library").classList.add("active");
    renderGrid(allBooks);
    if (window.innerWidth <= 992) handleSidebarToggle();
}

async function fetchBookData(title, author, imgId, linkId) {
    const query = `${title} ${author}`;
    try {
        const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
                query
            )}`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;

            if (info.imageLinks) {
                const img = document.getElementById(imgId);
                if (img)
                    img.src = info.imageLinks.thumbnail.replace(
                        "http://",
                        "https://"
                    );
            }

            if (info.previewLink || info.infoLink) {
                const btn = document.getElementById(linkId);
                if (btn) {
                    btn.href = info.previewLink || info.infoLink;
                    btn.classList.add("active");
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function loadBooks() {
    try {
        const currentUser = JSON.parse(localStorage.getItem("bookUser"));

        if (!currentUser) return;

        const response = await fetch(`${API_URL}?user=${currentUser.email}`);

        const data = await response.json();
        allBooks = data || [];
        renderGrid(allBooks);
    } catch (error) {
        console.error("Error loading books:", error);
    }
}

function renderGrid(books) {
    const grid = document.getElementById("book-grid");
    grid.innerHTML = "";

    if (books.length === 0 && allBooks.length > 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #888;">
                <i class='bx bx-search-alt' style="font-size: 3rem; margin-bottom: 10px;"></i>
                <h3>No books found.</h3>
                <p>Try checking your spelling or search for a different title.</p>
                <button onclick="document.getElementById('search-box').value=''; filterBooks()" 
                        class="auth-btn" style="width: auto; margin-top: 15px; background: #636e72;">
                    Clear Search
                </button>
            </div>
        `;
        return;
    }

    // Case 2: Library is truly empty (New User)
    if (books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class='bx bxs-planet'></i></div>
                <h3>Welcome to your BookUniverse! 🪐</h3>
                <p>Your library is currently empty, but it's full of potential.</p>
                
                <div class="guide-steps">
                    <div class="step"><i class='bx bxs-camera'></i> 1. Click "Add Book"</div>
                    <div class="step"><i class='bx bx-barcode-reader'></i> 2. Scan a Barcode</div>
                    <div class="step"><i class='bx bxs-magic-wand'></i> 3. Or Ask AI for Ideas</div>
                </div>

                <button class="auth-btn" style="width: auto; padding: 12px 30px;" onclick="toggleAddModal()">
                    <i class='bx bxs-plus-circle'></i> Add Your First Book
                </button>
            </div>
        `;
        return;
    }

    // --- RENDER BOOK CARDS (Standard) ---
    books.forEach((book) => {
        // ... (Keep your existing card rendering code EXACTLY as it was) ...
        const imgId = `cover-${book.ID}`;
        const linkId = `read-${book.ID}`;
        const menuId = `menu-${book.ID}`;
        const favClass = book.isFav ? "fav-btn active" : "fav-btn";
        const favIcon = book.isFav ? "bxs-heart" : "bx-heart";

        const searchQuery = encodeURIComponent(
            `${book.name} ${book.author} read online free`
        );
        const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;

        let badgeClass = "status-toread";
        let badgeText = "To Read";
        if (book.status === "Reading") {
            badgeClass = "status-reading";
            badgeText = "Reading";
        } else if (book.status === "Completed") {
            badgeClass = "status-completed";
            badgeText = "Finished";
        }

        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
            <div class="image-container">
                <img id="${imgId}" class="book-cover" src="https://via.placeholder.com/150x200?text=Searching..." >
                <button class="${favClass}" onclick="toggleFav(${book.ID})">
                    <i class='bx ${favIcon}'></i>
                </button>
            </div>

            <div class="card-header-row">
                <h4 style="font-size: 1rem; margin: 0; line-height: 1.3;">${book.name}</h4>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>

            <p style="color:#888; font-size:0.85rem; margin-top: 5px; margin-bottom: 15px;">${book.author}</p>
            
            <div class="card-actions-row" style="gap: 8px;">
                <a id="${linkId}" href="#" class="read-btn" target="_blank">
                    <i class='bx bxl-google'></i> Preview
                </a>
                <a href="${googleSearchUrl}" target="_blank" class="read-btn active" style="background: #00b894;">
                    <i class='bx bx-search-alt'></i> Find
                </a>
                <div class="menu-container">
                    <button class="menu-btn" onclick="toggleMenu('${menuId}')"><i class='bx bx-dots-vertical-rounded'></i></button>
                    <div id="${menuId}" class="dropdown-menu">
                        <div class="dropdown-item info"><i class='bx bx-buildings'></i> ${book.publication}</div>
                        <button class="dropdown-item" onclick="openEdit(${book.ID}, '${book.name}', '${book.author}', '${book.publication}', '${book.status}')"><i class='bx bx-edit'></i> Edit</button>
                        <button class="dropdown-item del" onclick="deleteBook(${book.ID})"><i class='bx bx-trash'></i> Delete</button>
                    </div>
                </div>
            </div>`;
        grid.appendChild(card);
        fetchBookData(book.name, book.author, imgId, linkId);
    });
}

async function toggleFav(id) {
    const book = allBooks.find((b) => b.ID === id);
    if (!book) return;

    const newStatus = !book.isFav;
    const updatedBook = { ...book, isFav: newStatus };

    try {
        await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedBook),
        });

        book.isFav = newStatus;

        const isFavTabActive = document
            .getElementById("nav-fav")
            .classList.contains("active");
        if (isFavTabActive) {
            filterFavorites();
        } else {
            renderGrid(allBooks);
        }

        showToast(
            newStatus ? "Added to Favorites ❤️" : "Removed from Favorites"
        );
    } catch (e) {
        console.error(e);
        showToast("Error updating favorite");
    }
}

function toggleMenu(menuId) {
    document.querySelectorAll(".dropdown-menu").forEach((el) => {
        if (el.id !== menuId) el.classList.remove("show");
    });
    document.getElementById(menuId).classList.toggle("show");
}

window.onclick = function (event) {
    if (
        !event.target.matches(".menu-btn") &&
        !event.target.matches(".menu-btn i")
    ) {
        document
            .querySelectorAll(".dropdown-menu")
            .forEach((el) => el.classList.remove("show"));
    }
};

function toggleAddModal() {
    const modal = document.getElementById("form-modal");
    modal.classList.toggle("open");
    if (!modal.classList.contains("open")) resetForm();
}

async function handleFormSubmit() {
    const id = document.getElementById("book-id").value;

    const currentUser = JSON.parse(localStorage.getItem("bookUser"));

    const bookData = {
        name: document.getElementById("name").value,
        author: document.getElementById("author").value,
        publication: document.getElementById("pub").value,
        status: document.getElementById("status").value,
        user_email: currentUser ? currentUser.email : "",
    };

    if (isEditing) {
        const currentBook = allBooks.find((b) => b.ID == id);
        if (currentBook) bookData.isFav = currentBook.isFav;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/${id}` : API_URL;

    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
    });

    const msg = isEditing
        ? "Book Updated Successfully!"
        : "New Book Added!";
    toggleAddModal();
    loadBooks();
    showToast(msg);
}

async function deleteBook(id) {
    if (confirm("Delete this book?")) {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        loadBooks();
        showToast("Book Deleted");
    }
}

function openEdit(id, name, author, pub, status) {
    isEditing = true;
    document.getElementById("form-title").innerText = "Edit Book Details";
    document.getElementById("book-id").value = id;
    document.getElementById("name").value = name;
    document.getElementById("author").value = author;
    document.getElementById("pub").value = pub;
    document.getElementById("status").value = status || "To Read";
    toggleAddModal();
}

function resetForm() {
    isEditing = false;
    document.getElementById("form-title").innerText = "📖 Add New Book";
    document.getElementById("name").value = "";
    document.getElementById("author").value = "";
    document.getElementById("pub").value = "";
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function filterBooks() {
    const q = document.getElementById("search-box").value.toLowerCase();
    renderGrid(allBooks.filter((b) => b.name.toLowerCase().includes(q)));
}

function startScanner() {
    if (!navigator.onLine) {
        alert(
            "You are offline! 🛑\nWe can scan the barcode, but we can't fetch book details without internet."
        );
        return;
    }

    const viewport = document.getElementById("interactive");
    viewport.style.display = "block";

    const isMobile = window.innerWidth <= 768;
    const cameraMode = isMobile ? "environment" : "user";

    Quagga.init(
        {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector("#interactive"),
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: cameraMode,
                },
            },
            decoder: {
                readers: ["ean_reader"],
            },
        },
        function (err) {
            if (err) {
                console.log(err);
                viewport.style.display = "none";
                alert(
                    "Camera error: " +
                    err.name +
                    "\n(Make sure you allowed camera permissions!)"
                );
                return;
            }
            Quagga.start();
        }
    );

    Quagga.onDetected(function (data) {
        const code = data.codeResult.code;
        stopScanner();
        fetchBookByISBN(code);
    });
}

function stopScanner() {
    Quagga.stop();
    document.getElementById("interactive").style.display = "none";
}

async function fetchBookByISBN(isbn) {
    showToast("Barcode found! Searching...");
    try {
        const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            document.getElementById("name").value = info.title;
            document.getElementById("author").value = info.authors
                ? info.authors.join(", ")
                : "";
            document.getElementById("pub").value = info.publisher || "";
            showToast("Book details auto-filled! 🪄");
        } else {
            alert("Book not found for ISBN: " + isbn);
        }
    } catch (e) {
        console.error(e);
        alert("Error fetching book details.");
    }
}

function copyProfileLink() {
    const user = JSON.parse(localStorage.getItem("bookUser"));
    if (!user) return alert("Please login first.");

    const link = `${window.location.origin}/u/${user.username}`;
    navigator.clipboard.writeText(link);
    showToast("Public link copied to clipboard! 📋");
}

async function getAIRecommendations() {
    const currentUser = JSON.parse(localStorage.getItem("bookUser"));
    if (!currentUser) {
        alert("Please Login first!");
        return;
    }

    const modal = document.getElementById("ai-modal");
    const content = document.getElementById("ai-content");
    modal.classList.add("open");
    content.innerHTML = `<p style="text-align:center; padding:20px;">Reading your favorites... <br><br> <i class='bx bx-loader-alt bx-spin' style="font-size:2rem; color:var(--primary)"></i></p>`;

    try {
        const res = await fetch(`/recommend?user=${currentUser.email}`);
        const data = await res.json();

        let cleanText = data.answer
            .replace(/```html/g, "")
            .replace(/```/g, "")
            .replace(/\n/g, "<br>");

        content.innerHTML = cleanText;
    } catch (e) {
        content.innerHTML =
            "<p style='color:red'>AI is sleeping right now. Try again later.</p>";
    }
}

(function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }
})();

function toggleDarkMode() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");
    const icon = document.getElementById("theme-icon-main");

    if (currentTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
        icon.className = "bx bxs-moon";
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        icon.className = "bx bxs-sun";
    }
}


/* --- 🎙️ VOICE SEARCH FUNCTIONALITY --- */

function startVoiceSearch() {
    // 1. Check if browser supports it
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showToast("Voice search not supported in this browser 😢");
        return;
    }

    const recognition = new SpeechRecognition();
    const btn = document.getElementById("voice-btn");
    const searchBox = document.getElementById("search-box");

    // Configure
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        btn.classList.add("listening");
        searchBox.placeholder = "Listening... 🎙️";
    };

    recognition.onend = () => {
        btn.classList.remove("listening");
        searchBox.placeholder = "🔍 Search your collection...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;

        const cleanText = transcript.replace(/[.,?!]/g, "");

        console.log("You said:", cleanText);

        searchBox.value = cleanText;
        filterBooks();
    };

    recognition.start();
}

async function magicFill() {
    const titleInput = document.getElementById("name");
    const authorInput = document.getElementById("author");
    const pubInput = document.getElementById("pub");
    const title = titleInput.value.trim();

    if (!title) {
        showToast("Please enter a book title first!");
        return;
    }

    const btn = event.currentTarget;
    const originalIcon = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
    btn.disabled = true;

    try {
        const response = await fetch(`/api/magic-details?title=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error("AI Failed");

        const data = await response.json();

        authorInput.value = data.author || "";
        pubInput.value = data.publisher || "";

        showToast("Magic applied! ✨");
    } catch (error) {
        console.error(error);
        showToast("Could not find book details 😓");
    } finally {
        btn.innerHTML = originalIcon;
        btn.disabled = false;
    }
}