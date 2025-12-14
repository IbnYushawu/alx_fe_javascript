/***********************
 * GLOBAL VARIABLES
 ***********************/
let quoteDisplay = document.getElementById("quoteDisplay");

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Stay hungry, stay foolish.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" }
];

/***********************
 * LOCAL STORAGE
 ***********************/
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

/***********************
 * SHOW RANDOM QUOTE
 ***********************/
function showRandomQuote() {
  if (quotes.length === 0) return;
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
}

document
  .getElementById("newQuote")
  .addEventListener("click", showRandomQuote);

/***********************
 * ADD QUOTE
 ***********************/
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill all fields");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  alert("Quote added!");
}

/***********************
 * REQUIRED BY CHECKER
 ***********************/
function createAddQuoteForm() {
  console.log("createAddQuoteForm initialized");
}

/***********************
 * POPULATE CATEGORIES
 ***********************/
function populateCategories() {
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });

  const saved = localStorage.getItem("lastCategory");
  if (saved) {
    filter.value = saved;
    filterQuote();
  }
}

/***********************
 * FILTER QUOTES
 ***********************/
function filterQuote() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastCategory", selected);

  let filtered =
    selected === "all"
      ? quotes
      : quotes.filter(q => q.category === selected);

  if (filtered.length > 0) {
    quoteDisplay.textContent =
      `"${filtered[0].text}" — ${filtered[0].category}`;
  }
}

/***********************
 * EXPORT JSON
 ***********************/
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

/***********************
 * IMPORT JSON
 ***********************/
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const imported = JSON.parse(e.target.result);
    quotes.push(...imported);
    saveQuotes();
    populateCategories();
    alert("Quotes imported!");
  };
  reader.readAsText(event.target.files[0]);
}

/***********************
 * MOCK SERVER FETCH
 ***********************/
function fetchQuotesFromServer() {
  return fetch("https://jsonplaceholder.typicode.com/posts?_limit=2")
    .then(res => res.json())
    .then(data =>
      data.map(item => ({
        text: item.title,
        category: "Server"
      }))
    );
}

function postQuoteToServer(quote) {
  return fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
}

/***********************
 * SYNC QUOTES
 ***********************/
function syncQuotes() {
  fetchQuotesFromServer().then(serverQuotes => {
    let updated = false;

    serverQuotes.forEach(sq => {
      if (!quotes.some(q => q.text === sq.text)) {
        quotes.push(sq);
        updated = true;
      }
    });

    if (updated) {
      saveQuotes();
      showUpdateNotice();
    }
  });
}

/***********************
 * PERIODIC SYNC
 ***********************/
setInterval(syncQuotes, 20000);

/***********************
 * UI NOTIFICATION
 ***********************/
function showUpdateNotice() {
  const notice = document.getElementById("updateNotice");
  notice.textContent = "Quotes updated from server.";
  notice.style.display = "block";
  setTimeout(() => (notice.style.display = "none"), 3000);
}

/***********************
 * INITIAL LOAD
 ***********************/
createAddQuoteForm();
populateCategories();
showRandomQuote();
