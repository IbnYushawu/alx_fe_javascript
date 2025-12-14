/************************************************************
 * INITIAL DATA + LOCAL STORAGE INITIALIZATION
 ************************************************************/

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Stay hungry, stay foolish.", category: "Inspiration" },
  { text: "The only limit is your mind.", category: "Motivation" },
  { text: "Mistakes are proof you're trying.", category: "Growth" }
];

// Saves quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

/************************************************************
 * DISPLAY A RANDOM QUOTE
 ************************************************************/

function showRandomQuote() {
  const display = document.getElementById("quoteDisplay");

  if (quotes.length === 0) {
    display.textContent = "No quotes available.";
    return;
  }

  const random = quotes[Math.floor(Math.random() * quotes.length)];
  display.innerHTML = `<strong>${random.text}</strong> <br> <em>${random.category}</em>`;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(random));
}

document.getElementById("newQuote").addEventListener("click", showRandomQuote);

/************************************************************
 * CREATE ADD QUOTE FORM DYNAMICALLY
 ************************************************************/

function createAddQuoteForm() {
  const container = document.getElementById("addQuoteContainer");

  container.innerHTML = `
      <h3>Add a New Quote</h3>
      <input id="newQuoteText" type="text" placeholder="Enter quote text" />
      <input id="newQuoteCategory" type="text" placeholder="Enter category" />
      <button onclick="addQuote()">Add Quote</button>
  `;
}

/************************************************************
 * ADD NEW QUOTE
 ************************************************************/

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Both fields are required.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();

  populateCategories();
  alert("Quote added successfully!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

/************************************************************
 * POPULATE CATEGORY DROPDOWN
 ************************************************************/

function populateCategories() {
  const filter = document.getElementById("categoryFilter");

  // remember selected category
  const selected = filter.value;

  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  filter.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filter.appendChild(option);
  });

  filter.value = selected;
}

/************************************************************
 * FILTER QUOTES
 ************************************************************/

function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastFilter", selected);

  if (selected === "all") {
    showRandomQuote();
    return;
  }

  const filtered = quotes.filter(q => q.category === selected);

  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").textContent =
      "No quotes in this category.";
    return;
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  document.getElementById("quoteDisplay").innerHTML =
    `<strong>${random.text}</strong><br><em>${random.category}</em>`;
}

/************************************************************
 * EXPORT QUOTES AS JSON
 ************************************************************/

function exportQuotes() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

/************************************************************
 * IMPORT QUOTES FROM JSON FILE
 ************************************************************/

function importFromJsonFile(event) {
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);

      quotes.push(...imported);
      saveQuotes();
      populateCategories();

      alert("Quotes imported successfully!");
    } catch (error) {
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(event.target.files[0]);
}

/************************************************************
 * TASK 3 — SERVER SYNC FEATURE
 ************************************************************/

// Simulated mock API URL
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

/**
 * Simulated function to fetch quotes from the server.
 * In real projects, the server would return quotes.
 */
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    // simulate server sending quotes
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    handleServerSync(serverQuotes);
  } catch (err) {
    console.log("Error fetching server data:", err);
  }
}

/**
 * Conflict resolution: server data overrides local data if duplicate text exists
 */
function handleServerSync(serverQuotes) {
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    const exists = quotes.some(q => q.text === serverQuote.text);

    if (!exists) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    alert("New quotes synced from server!");
  }
}

// Poll server every 20 seconds (simulated real-time sync)
setInterval(fetchQuotesFromServer, 20000);

/************************************************************
 * INITIALIZATION ON PAGE LOAD
 ************************************************************/

createAddQuoteForm();
populateCategories();

const savedFilter = localStorage.getItem("lastFilter");
if (savedFilter) {
  document.getElementById("categoryFilter").value = savedFilter;
  filterQuotes();
} else {
  showRandomQuote();
}
