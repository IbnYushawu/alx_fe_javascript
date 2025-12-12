

// script.js
// Dynamic Quote Generator
// Features:
// - manage quotes array (text, category, id, updatedAt)
// - show random quote, add quotes, filter by category
// - persist to localStorage, remember last viewed in sessionStorage
// - import/export JSON
// - periodic server sync simulation (server wins on conflict)
// - notifications for sync/import/export

(() => {
  // ELEMENTS
  const quoteTextEl = document.getElementById('quoteText');
  const quoteMetaEl = document.getElementById('quoteMeta');
  const newQuoteBtn = document.getElementById('newQuoteBtn');
  const addQuoteForm = document.getElementById('addQuoteForm');
  const newQuoteText = document.getElementById('newQuoteText');
  const newQuoteCategory = document.getElementById('newQuoteCategory');
  const quoteList = document.getElementById('quoteList');
  const categoryFilter = document.getElementById('categoryFilter');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  const notification = document.getElementById('notification');
  const clearLocalBtn = document.getElementById('clearLocalBtn');

  // STORAGE KEYS
  const LS_KEY = 'dqg_quotes_v1';
  const FILTER_KEY = 'dqg_last_filter';
  const SESSION_LAST_QUOTE = 'dqg_last_viewed_quote';

  // In-memory data
  let quotes = [];
  let categories = new Set();

  // Default starter quotes if nothing in localStorage
  const defaultQuotes = [
    { id: generateId(), text: "Simplicity is the soul of efficiency.", category: "productivity", updatedAt: Date.now() },
    { id: generateId(), text: "First, solve the problem. Then, write the code.", category: "development", updatedAt: Date.now() },
    { id: generateId(), text: "Read the error message; the message almost always tells you what's wrong.", category: "debugging", updatedAt: Date.now() }
  ];

  // Utility: generate a unique id
  function generateId() {
    return 'q_' + Math.random().toString(36).slice(2, 9);
  }

  // Notifications
  function showNotification(message, timeout = 4000) {
    notification.textContent = message;
    notification.style.display = 'block';
    clearTimeout(notification._t);
    notification._t = setTimeout(() => {
      notification.style.display = 'none';
    }, timeout);
  }

  // Save and load
  function saveQuotes() {
    localStorage.setItem(LS_KEY, JSON.stringify(quotes));
  }

  function loadQuotes() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        quotes = defaultQuotes.slice();
        saveQuotes();
      } else {
        quotes = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to parse saved quotes:', err);
      quotes = defaultQuotes.slice();
      saveQuotes();
    }
    rebuildCategories();
  }

  // Rebuild categories set and populate the select
  function rebuildCategories() {
    categories = new Set(quotes.map(q => q.category).filter(Boolean));
    populateCategories();
  }

  function populateCategories() {
    // preserve selected value if possible
    const selected = localStorage.getItem(FILTER_KEY) || 'all';
    // clear options except the 'all' option
    categoryFilter.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Categories';
    categoryFilter.appendChild(allOpt);

    Array.from(categories).sort().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat[0].toUpperCase() + cat.slice(1);
      categoryFilter.appendChild(opt);
    });

    // restore selection
    if ([...categoryFilter.options].some(o => o.value === selected)) {
      categoryFilter.value = selected;
    } else {
      categoryFilter.value = 'all';
      localStorage.setItem(FILTER_KEY, 'all');
    }
  }

  // Show a quote (object)
  function renderQuote(q) {
    if (!q) {
      quoteTextEl.textContent = 'No quotes available.';
      quoteMetaEl.textContent = '';
      return;
    }
    quoteTextEl.textContent = q.text;
    quoteMetaEl.textContent = `Category: ${q.category} — Last updated: ${new Date(q.updatedAt).toLocaleString()}`;
    // store last viewed in sessionStorage
    sessionStorage.setItem(SESSION_LAST_QUOTE, q.id);
  }

  // Show random quote from filtered set
  function showRandomQuote() {
    const selected = categoryFilter.value || 'all';
    const pool = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);
    if (!pool.length) {
      renderQuote(null);
      showNotification('No quotes in the selected category.');
      return;
    }
    const q = pool[Math.floor(Math.random() * pool.length)];
    renderQuote(q);
  }

  // Add a quote (from form or import)
  function addQuote(text, category, options = {}) {
    const id = options.id || generateId();
    const now = options.updatedAt || Date.now();
    const newQ = { id, text: text.trim(), category: category.trim().toLowerCase(), updatedAt: now };
    // if id already exists, replace or update
    const idx = quotes.findIndex(x => x.id === id);
    if (idx >= 0) {
      // replace if updatedAt is newer
      if (quotes[idx].updatedAt <= newQ.updatedAt) {
        quotes[idx] = newQ;
      }
    } else {
      quotes.push(newQ);
    }
    saveQuotes();
    rebuildCategories();
    populateQuoteList(); // update UI list
  }

  // Populate the visible list
  function populateQuoteList() {
    quoteList.innerHTML = '';
    const selected = categoryFilter.value || 'all';
    const visible = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);
    if (!visible.length) {
      const li = document.createElement('li');
      li.textContent = 'No quotes to show.';
      li.className = 'quote-item';
      quoteList.appendChild(li);
      return;
    }

    visible.slice().reverse().forEach(q => {
      const li = document.createElement('li');
      li.className = 'quote-item';

      const left = document.createElement('div');
      left.style.flex = '1';
      const p = document.createElement('div');
      p.textContent = q.text;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${q.category} • ${new Date(q.updatedAt).toLocaleString()}`;
      left.appendChild(p);
      left.appendChild(meta);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '8px';
      // show button
      const showBtn = document.createElement('button');
      showBtn.textContent = 'Show';
      showBtn.className = 'btn';
      showBtn.onclick = () => renderQuote(q);
      // delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn ghost';
      delBtn.onclick = () => {
        if (confirm('Delete this quote?')) {
          quotes = quotes.filter(x => x.id !== q.id);
          saveQuotes();
          rebuildCategories();
          populateQuoteList();
          showNotification('Quote deleted');
        }
      };
      right.appendChild(showBtn);
      right.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(right);
      quoteList.appendChild(li);
    });
  }

  // Export quotes as JSON file
  function exportToJson() {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `quotes-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotification('Quotes exported');
  }

  // Import from JSON file input
  function importFromJsonFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) {
          throw new Error('Invalid JSON format: expected an array.');
        }
        // Validate and add quotes
        let added = 0;
        imported.forEach(item => {
          if (item && item.text && item.category) {
            const id = item.id || generateId();
            const updatedAt = item.updatedAt || Date.now();
            addQuote(String(item.text), String(item.category), { id, updatedAt });
            added++;
          }
        });
        saveQuotes();
        populateQuoteList();
        showNotification(`Imported ${added} quotes`);
      } catch (err) {
        console.error(err);
        showNotification('Failed to import: invalid JSON');
      } finally {
        importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  // Sync with a mock server (JSONPlaceholder) and simple conflict resolution
  // This is a simulation: we fetch a small set of posts and map them to quote objects.
  async function syncWithServer() {
    try {
      // Use a small set to keep it simple
      const resp = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      if (!resp.ok) throw new Error('Network error');
      const data = await resp.json();
      // Map remote posts to quote-like objects
      const remoteQuotes = data.map(p => ({
        id: `server-${p.id}`,
        text: `${p.title} — ${p.body.slice(0, 60)}...`,
        category: 'server',
        updatedAt: Date.now() // simulate server timestamp
      }));

      let changes = 0;
      remoteQuotes.forEach(rq => {
        const existing = quotes.find(q => q.id === rq.id);
        if (!existing) {
          // new from server: add it
          quotes.push(rq);
          changes++;
        } else {
          // conflict resolution: server wins if remote updatedAt > local
          if (rq.updatedAt > existing.updatedAt) {
            const idx = quotes.findIndex(q => q.id === rq.id);
            quotes[idx] = rq;
            changes++;
          }
        }
      });

      if (changes > 0) {
        saveQuotes();
        rebuildCategories();
        populateQuoteList();
        showNotification(`Synced with server — ${changes} changes applied`);
      } else {
        // optionally show no changes
        // showNotification('Sync: no changes');
      }
    } catch (err) {
      console.error('Sync failed', err);
      // silent fail or brief notification
    }
  }

  // Load last viewed quote from session storage
  function loadLastViewed() {
    const lastId = sessionStorage.getItem(SESSION_LAST_QUOTE);
    if (lastId) {
      const q = quotes.find(x => x.id === lastId);
      if (q) {
        renderQuote(q);
        return;
      }
    }
    // fallback: show random quote if any
    if (quotes.length) {
      renderQuote(quotes[0]);
    }
  }

  // Handlers
  newQuoteBtn.addEventListener('click', showRandomQuote);

  addQuoteForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim().toLowerCase();
    if (!text || !category) {
      showNotification('Both quote and category are required.');
      return;
    }
    addQuote(text, category);
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    showNotification('Quote added');
  });

  categoryFilter.addEventListener('change', () => {
    const v = categoryFilter.value || 'all';
    localStorage.setItem(FILTER_KEY, v);
    populateQuoteList();
  });

  exportBtn.addEventListener('click', exportToJson);
  importFile.addEventListener('change', importFromJsonFile);

  clearLocalBtn.addEventListener('click', () => {
    if (!confirm('This will clear all local quotes and restore defaults. Continue?')) return;
    localStorage.removeItem(LS_KEY);
    loadQuotes();
    populateQuoteList();
    showNotification('Local data reset');
  });

  // boot
  function boot() {
    loadQuotes();
    populateCategories();
    // restore filter if exists
    const lastFilter = localStorage.getItem(FILTER_KEY);
    if (lastFilter) categoryFilter.value = lastFilter;
    populateQuoteList();
    loadLastViewed();
    // Start periodic sync (every 45 seconds)
    setInterval(syncWithServer, 45000);
    // Run an initial sync quietly
    syncWithServer();
  }

  boot();

  // expose some helpers for debugging in console
  window.dqg = {
    quotes,
    saveQuotes,
    addQuote,
    showRandomQuote,
    exportToJson,
    syncWithServer
  };
})();
