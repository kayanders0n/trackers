// === Selected Filters (Global State) ===
let selectedPlatformId = null;
let selectedMediaId = "";
let selectedStyleId = "";
let selectedGenreId = null;
let selectedSeriesNameId = null;
let allTitles = [];
let allSeriesOptions = [];
let selectedModalMediaId = "";

// === Load All Platforms into Dropdown ===
async function loadAllPlatforms() {
  try {
    const response = await fetch("/api/getPlatforms");
    const data = await response.json();
    const platformOptions = document.getElementById("platform-options");
    platformOptions.innerHTML = "";

    // Default "All" option
    const allOption = document.createElement("a");
    allOption.className = "dropdown-item";
    allOption.dataset.id = "";
    allOption.textContent = "-- All --";
    allOption.addEventListener("click", () => {
      document.getElementById("platform-button-text").textContent = "-- All --";
      document.getElementById("platform-dropdown").classList.remove("is-active");
      selectedPlatformId = null;
      platformOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
      allOption.classList.add("is-active");
    });
    platformOptions.appendChild(allOption);

    // Add each platform option
    for (const platform of data) {
      const item = document.createElement("a");
      item.className = "dropdown-item";
      item.dataset.id = platform.ID;
      item.textContent = platform.DESCRIPT;

      item.addEventListener("click", () => {
        document.getElementById("platform-button-text").textContent = platform.DESCRIPT;
        document.getElementById("platform-dropdown").classList.remove("is-active");
        selectedPlatformId = platform.ID;
        platformOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");
      });

      platformOptions.appendChild(item);
    }
  } catch (error) {
    console.error("Failed to load platforms:", error);
  }
}

// === Load All Genres into Dropdown ===
async function loadAllGenres() {
  try {
    const response = await fetch("/api/getGenres");
    const data = await response.json();
    const genreOptions = document.getElementById("genre-options");
    genreOptions.innerHTML = "";

    // Default "All" option
    const allOption = document.createElement("a");
    allOption.className = "dropdown-item";
    allOption.dataset.id = "";
    allOption.textContent = "-- All --";
    allOption.addEventListener("click", () => {
      document.getElementById("genre-button-text").textContent = "-- All --";
      document.getElementById("genre-dropdown").classList.remove("is-active");
      selectedGenreId = null;
      genreOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
      allOption.classList.add("is-active");
    });
    genreOptions.appendChild(allOption);

    // Add each genre option
    for (const genre of data) {
      const item = document.createElement("a");
      item.className = "dropdown-item";
      item.dataset.id = genre.ID;
      item.textContent = genre.DESCRIPT;

      item.addEventListener("click", () => {
        document.getElementById("genre-button-text").textContent = genre.DESCRIPT;
        document.getElementById("genre-dropdown").classList.remove("is-active");
        selectedGenreId = genre.ID;
        genreOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
        item.classList.add("is-active");
      });

      genreOptions.appendChild(item);
    }
  } catch (error) {
    console.error("Failed to load genres:", error);
  }
}

async function loadSeriesOptions() {
  try {
    const response = await fetch("/api/getSeries");
    allSeriesOptions = await response.json();
  } catch (error) {
    console.error("Failed to load series:", error);
  }
}

function setupSeriesAutocomplete() {
  const input = document.getElementById("series-name-input");
  const dropdown = document.getElementById("series-name-dropdown");
  const suggestionsBox = document.getElementById("series-name-suggestions");

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";
    selectedSeriesNameId = null;

    if (!query) {
      dropdown.classList.remove("is-active");
      return;
    }

    const matches = allSeriesOptions.filter((series) => series.DESCRIPT.toLowerCase().includes(query));

    if (matches.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "dropdown-item has-text-grey-light is-unselectable";
      noResult.textContent = "No matches found";
      suggestionsBox.appendChild(noResult);
    } else {
      for (const match of matches) {
        const item = document.createElement("a");
        item.className = "dropdown-item";
        item.textContent = match.DESCRIPT;
        item.addEventListener("click", () => {
          input.value = match.DESCRIPT;
          selectedSeriesNameId = match.ID;
          dropdown.classList.remove("is-active");
        });
        suggestionsBox.appendChild(item);
      }
    }
    dropdown.classList.add("is-active");

    // Hide dropdown on outside click
    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("is-active");
      }
    });
  });

  // Hide dropdown on outside click
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("is-active");
    }
  });
}

function setupSeriesNameBlurCheck() {
  const input = document.getElementById("series-name-input");
  const notification = document.getElementById("new-series-notification");
  const nameSpan = document.getElementById("new-series-name-text");
  const confirmBtn = document.getElementById("confirm-new-series-btn");
  const cancelBtn = document.getElementById("cancel-new-series-btn");

  input.addEventListener("blur", () => {
    setTimeout(() => {
      const userInput = input.value.trim().toLowerCase();
      if (!userInput) return;

      const match = allSeriesOptions.find((series) => series.DESCRIPT.toLowerCase() === userInput);

      if (!match) {
        nameSpan.textContent = input.value;
        notification.classList.remove("is-hidden");

        // YES: Keep input and hide notification
        confirmBtn.onclick = () => {
          notification.classList.add("is-hidden");
        };

        // NO: Clear input and hide notification
        cancelBtn.onclick = () => {
          input.value = "";
          selectedSeriesNameId = null;
          notification.classList.add("is-hidden");
        };
      } else {
        // If it matched exactly, ensure selectedSeriesNameId is set
        selectedSeriesNameId = match.ID;
      }
    }, 150); // small delay to let the click finish
  });
}

// === Add Toggle Logic to Dropdown Button ===
function setupDropdown(triggerId, dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  const trigger = document.getElementById(triggerId);
  trigger.addEventListener("click", () => {
    dropdown.classList.toggle("is-active");
  });
}

// === Display Titles using Sort Order ===
function renderTitlesTable(data) {
  const tbody = document.getElementById("titles-body");
  tbody.innerHTML = "";

  for (const title of data) {
    const releaseDate = title.FIRSTRELEASE
      ? new Date(title.FIRSTRELEASE).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
    const titleLength = formatLength(title.CONTENT_SIZE);

    const tr = document.createElement("tr");
    tr.dataset.movieId = title.ID;
    tr.innerHTML = `
      <td>${title.DESCRIPT}</td>
      <td class="has-text-centered">${title.TYPENAME}</td>
      <td class="has-text-centered">${releaseDate}</td>
      <td class="has-text-centered">${titleLength}</td>
    `;

    // Add double-click event
    tr.addEventListener("dblclick", () => {
      openTitleModal(title);
    });

    tbody.appendChild(tr);
  }
}

// === Get Titles ===
async function loadTitles(platformId, mediaId, styleId, genreId) {
  try {
    const response = await fetch(
      `/api/getTitlesBySearch?platformId=${platformId ?? ""}&mediaId=${mediaId ?? ""}&styleId=${styleId ?? ""}&genreId=${genreId ?? ""}`
    );
    const data = await response.json();
    allTitles = data;
    renderTitlesTable(allTitles);
  } catch (error) {
    console.error("Failed to load titles:", error);
  }
}

// === SortAndRenderTitles ===
function sortAndRenderTitles(titles, sortBy, direction = "asc") {
  const sorted = [...titles].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // If it's a date field
    if (sortBy === "FIRSTRELEASE") {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    // Handle null/undefined values
    if (valA == null) valA = "";
    if (valB == null) valB = "";

    // Comparison
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  renderTitlesTable(sorted); // redraw the table
}

// === Load User List Dropdown ===
async function loadUserListDropdown(titleId) {
  const container = document.getElementById("user-list-dropdown-container");
  container.innerHTML = "Loading...";

  try {
    const response = await fetch(`/api/user/1/lists/list-status?titleId=${titleId}&typeId=6`);
    const lists = await response.json();
    if (!Array.isArray(lists)) {
      throw new Error("Unexpected response: " + JSON.stringify(lists));
    }

    // Local state
    const initialChecked = new Set(lists.filter(l => Number(l.INLIST) === 1).map(l => l.LISTID));
    const currentChecked = new Set(initialChecked);

    // UI container
    const wrap = document.createElement("div");
    wrap.className = "box p-3";
    wrap.style.maxHeight = "260px";
    wrap.style.overflowY = "auto";
    wrap.style.border = "1px solid #3A3A45";
    wrap.style.borderRadius = "6px";
    wrap.style.backgroundColor = "#2C2C34";

    // Checklist
    for (const list of lists) {
      const row = document.createElement("label");
      row.className = "checkbox mb-2";
      row.style.display = "block";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = Number(list.INLIST) === 1;
      cb.dataset.listId = list.LISTID;

      cb.addEventListener("change", () => {
        const id = Number(cb.dataset.listId);
        if (cb.checked) currentChecked.add(id);
        else currentChecked.delete(id);
        // Toggle save button enable
        saveBtn.disabled = setsEqual(initialChecked, currentChecked);
      });

      const name = document.createElement("span");
      name.className = "ml-2";
      name.textContent = list.LISTNAME;

      row.appendChild(cb);
      row.appendChild(name);
      wrap.appendChild(row);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "mt-3 is-flex is-justify-content-flex-end is-align-items-center";
    actions.style.gap = "0.5rem";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "button is-light is-small";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      container.innerHTML = "";
    };

    const saveBtn = document.createElement("button");
    saveBtn.className = "button is-link is-small";
    saveBtn.innerHTML = `<i class="fas fa-save mr-1"></i>Save`;
    saveBtn.disabled = true;

    saveBtn.onclick = async () => {
      try {
        saveBtn.disabled = true;

        const finalListIds = [...currentChecked];
        const res = await fetch(`/api/user/1/titles/${titleId}/lists`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listIds: finalListIds, typeId: 6 }) // 6 = entertainment
        });

        if (!res.ok) throw new Error(`Unexpected ${res.status}`);
        const data = await res.json();

        // Close the little panel
        container.innerHTML = "";
        // Toast
        if (window.bulmaToast) {
          bulmaToast.toast({ message: "Lists updated", type: "is-success" });
        }
      } catch (err) {
        console.error(err);
        saveBtn.disabled = false;
        if (window.bulmaToast) {
          bulmaToast.toast({ message: "Failed to save changes", type: "is-danger" });
        }
      }
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    // Render
    container.innerHTML = "";
    container.appendChild(wrap);
    container.appendChild(actions);

  } catch (error) {
    console.error("Failed to load list dropdown:", error);
    container.innerHTML = "Error loading lists.";
  }
}

// helper
function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// == Open Title Modal ===
async function openTitleModal(title) {
  const modal = document.getElementById("current-title-modal");
  const modalBody = modal.querySelector(".modal-card-body");
  modalBody.innerHTML = "";

  const content = document.createElement("div");
  content.className = "box";

  content.innerHTML = `
    <div style="overflow: hidden;">
      <img 
        src="/assets/images/${title.IMAGEFILE}" 
        alt="${title.DESCRIPT}" 
        style="float: right; margin: 0 0 1rem 1rem; max-width: 150px; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
      />
      <h2 class="title is-4 is-primary">${title.DESCRIPT}</h2>
      <p><strong>Type:</strong> ${title.TYPENAME}</p>
      <p><strong>Release Date:</strong> ${title.FIRSTRELEASE ? new Date(title.FIRSTRELEASE).toLocaleDateString() : "N/A"}</p>
      <p><strong>Run Time:</strong> ${formatLength(title.CONTENT_SIZE)}</p>
      <p><strong>Genres:</strong> <span class="genre-list">Loading...</span></p>
      <p><strong>Platforms:</strong> <span class="platform-list">Loading...</span></p>
      <p><strong>Series:</strong> <span class="series-list">Loading...</span></p>

      <!-- === Add to User List Button === -->
      <div class="mt-4">
        <button class="button is-link is-small" onclick="loadUserListDropdown(${title.ID})">
          <i class="fas fa-plus"></i>Add to List
        </button>
        <div class="mt-2" id="user-list-dropdown-container"></div>
      </div>
    </div>
  `;

  modalBody.appendChild(content);
  modal.classList.add("is-active");

  // Get Genres
  const genreSpan = content.querySelector(".genre-list");
  try {
    const genreResponse = await fetch(`/api/getGenreByTitleId?titleId=${title.ID}`);
    const genreData = await genreResponse.json();
    const genreNames = genreData.length > 0 ? genreData.map((g) => g.DESCRIPT).join(", ") : "None listed";
    genreSpan.innerHTML = genreNames;
  } catch (error) {
    console.error("Failed to load title genres:", error);
    genreSpan.innerHTML = "Error loading genres";
  }

  // Get Platforms
  const platformSpan = content.querySelector(".platform-list");
  try {
    const platformResponse = await fetch(`/api/getPlatformsByTitleId?titleId=${title.ID}`);
    const platformData = await platformResponse.json();
    const platformNames = platformData.length > 0 ? platformData.map((g) => g.DESCRIPT).join(", ") : "None listed";
    platformSpan.innerHTML = platformNames;
  } catch (error) {
    console.error("Failed to load title platforms:", error);
    platformSpan.innerHTML = "Error loading platforms";
  }

  // Get Series
  const seriesSpan = content.querySelector(".series-list");
  try {
    const seriesResponse = await fetch(`/api/getSeriesByTitleId?titleId=${title.ID}`);
    const seriesData = await seriesResponse.json();
    const validSeries = seriesData.filter((g) => g.DESCRIPT != null);
    const seriesNames = validSeries.length > 0 ? validSeries.map((g) => g.DESCRIPT).join(", ") : "None listed";
    seriesSpan.innerHTML = seriesNames;
  } catch (error) {
    console.error("Failed to load title series:", error);
    seriesSpan.innerHTML = "Error loading series";
  }
}

async function addSeries(newSeriesName) {
  try {
    const res = await fetch("/api/addSeries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSeriesName }),
    });

    if (!res.ok) throw new Error("Failed to insert series");

    const newSeries = await res.json();
    allSeriesOptions.push({ ID: newSeries.ID, DESCRIPT: newSeriesName });
    return newSeries.ID;
  } catch (err) {
    console.error("Error inserting series:", err);
    return null;
  }
}

async function addTitle(title, typeId, releaseDate, runTimeTotalMin, seriesId, orderNum) {
  try {
    const data = {
      title,
      typeId,
      releaseDate,
      runTimeTotalMin,
      seriesId,
      orderNum,
    };

    const res = await fetch("/api/addTitle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to insert title");

    const newTitleId = await res.json();
    return newTitleId;
  } catch (err) {
    console.error("Error inserting title:", err);
    return null;
  }
}

// === Title Selector (autocomplete + modal open) ===
function setupTitleSelector() {
  const input = document.getElementById("title-search");
  const dropdown = document.getElementById("title-dropdown");
  const resultsBox = document.getElementById("title-results");

  let activeIndex = -1;   // for keyboard nav
  let currentItems = [];  // cache current result objects

  const debounce = (fn, delay=200) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  };

  const closeDropdown = () => {
    dropdown.classList.remove("is-active");
    activeIndex = -1;
    currentItems = [];
  };

  const openDropdown = () => dropdown.classList.add("is-active");

  const renderResults = (list, q) => {
    resultsBox.innerHTML = "";
  
    // ➊ Special row to show in grid
    const viewAll = document.createElement("a");
    viewAll.className = "dropdown-item is-active"; // make it the default active target
    viewAll.innerHTML = `View results in grid for <strong>"${q}"</strong>`;
    viewAll.addEventListener("mousedown", (e) => e.preventDefault());
    viewAll.addEventListener("click", async () => {
      closeDropdown();
      const full = await searchTitles(q, 500); // bigger limit for grid
      showResultsInTable(full);
    });
    resultsBox.appendChild(viewAll);
  
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "dropdown-item has-text-grey-light is-unselectable";
      empty.textContent = "No matches";
      resultsBox.appendChild(empty);
      return;
    }
  
    // ➋ Regular hit list (click = open modal, keep as-is)
    list.forEach((t, i) => {
      const a = document.createElement("a");
      a.className = "dropdown-item";
      a.textContent = t.DESCRIPT + (t.TYPENAME ? `  ·  ${t.TYPENAME}` : "");
      a.title = t.DESCRIPT;
      a.dataset.index = i;
      a.addEventListener("mouseenter", () => setActive(i + 1)); // +1 due to the "view all" row
      a.addEventListener("mousedown", (e) => e.preventDefault());
      a.addEventListener("click", () => selectIndex(i));
      resultsBox.appendChild(a);
    });
  };

  const setActive = (idx) => {
    const items = resultsBox.querySelectorAll(".dropdown-item");
    items.forEach(el => el.classList.remove("is-active"));
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add("is-active");
      activeIndex = idx;
      // keep it in view
      const el = items[idx];
      const parent = resultsBox;
      const top = el.offsetTop, bottom = top + el.offsetHeight;
      if (top < parent.scrollTop) parent.scrollTop = top;
      else if (bottom > parent.scrollTop + parent.clientHeight) parent.scrollTop = bottom - parent.clientHeight;
    }
  };

  const selectIndex = (idx) => {
    if (idx < 0 || idx >= currentItems.length) return;
    const chosen = currentItems[idx];
    input.value = chosen.DESCRIPT;
    closeDropdown();
    openTitleModal(chosen);
  };

  // Query backend for titles
  const searchTitles = async (q, limit = 20) => {
    const url = `/api/searchTitles?q=${encodeURIComponent(q)}&typeIds=2,3&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  };

  const onInput = debounce(async () => {
    const q = input.value.trim();
    if (!q) { closeDropdown(); return; }
    try {
      const list = await searchTitles(q, 20); // small list for dropdown
      currentItems = list;
      renderResults(list, q);
      openDropdown();
      setActive(0); // default to "View results in grid"
    } catch (e) {
      console.error("title search failed", e);
      closeDropdown();
    }
  }, 200);

  input.addEventListener("input", onInput);

  // keyboard navigation
  input.addEventListener("keydown", async (e) => {
    if (!dropdown.classList.contains("is-active")) return;
    const items = resultsBox.querySelectorAll(".dropdown-item");
    if (!items.length) return;
  
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // If focusing the top “View results…” row or nothing is selected -> grid search
      if (activeIndex <= 0) {
        closeDropdown();
        const q = input.value.trim();
        if (!q) return;
        const full = await searchTitles(q, 500);
        showResultsInTable(full);
        return;
      }
      // otherwise open the chosen modal item
      const listIndex = activeIndex - 1; // adjust for the top row
      if (listIndex >= 0 && listIndex < currentItems.length) selectIndex(listIndex);
    } else if (e.key === "Escape") {
      closeDropdown();
    }
  });

  // open dropdown if user focuses and text exists
  input.addEventListener("focus", () => {
    if (input.value.trim() && resultsBox.children.length) {
      openDropdown();
    }
  });

  // hide on outside click
  document.addEventListener("click", (evt) => {
    if (!dropdown.contains(evt.target) && evt.target !== input) {
      closeDropdown();
    }
  });
}

function showResultsInTable(list) {
  allTitles = list;
  renderTitlesTable(allTitles);
  document.getElementById("titles-table-wrapper").classList.remove("is-hidden");
}

// === Setup Event Listeners After DOM Loads ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("titles-table-wrapper").classList.add("is-hidden");
  setupTitleSelector(); // Prep Titles search bar at startup
  loadAllPlatforms(); // Load platforms into dropdown at startup
  loadAllGenres(); // Load genres into dropdown at startup
  loadSeriesOptions().then(setupSeriesAutocomplete); // Load series into dropdown at startup
  setupSeriesNameBlurCheck();

  const platformDropdown = document.getElementById("platform-dropdown");
  const mediaDropdown = document.getElementById("media-dropdown");
  const styleDropdown = document.getElementById("style-dropdown");
  const genreDropdown = document.getElementById("genre-dropdown");
  const modalMediaDropdown = document.getElementById("modal-media-dropdown");

  setupDropdown("platform-button", "platform-dropdown");
  setupDropdown("media-button", "media-dropdown");
  setupDropdown("style-button", "style-dropdown");
  setupDropdown("genre-button", "genre-dropdown");
  setupDropdown("modal-media-button", "modal-media-dropdown");

  const mediaOptions = document.querySelectorAll("#media-options .dropdown-item");
  const styleOptions = document.querySelectorAll("#style-options .dropdown-item");
  const modalMediaOptions = document.querySelectorAll("#modal-media-options .dropdown-item");

  const isSeriesWrapper = document.getElementById("is-series-wrapper");
  const seriesCheckbox = document.getElementById("series-checkbox");
  const seriesNameWrapper = document.getElementById("series-name-wrapper");
  const seriesOrderWrapper = document.getElementById("series-order-wrapper");

  const seriesNameInput = document.getElementById("series-name-input");
  const orderNumberInput = document.getElementById("order-number-input");
  const currentTitleModal = document.getElementById("current-title-modal");
  const addTitleForm = document.getElementById("add-title-form");

  let currentSort = { column: null, direction: "asc" };

  // === Media item selection ===
  mediaOptions.forEach((item) => {
    item.addEventListener("click", () => {
      document.getElementById("media-button-text").textContent = item.textContent;
      selectedMediaId = item.dataset.id;
      mediaOptions.forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      mediaDropdown.classList.remove("is-active");
    });
  });

  // === Style item selection ===
  styleOptions.forEach((item) => {
    item.addEventListener("click", () => {
      document.getElementById("style-button-text").textContent = item.textContent;
      selectedStyleId = item.dataset.id;
      styleOptions.forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      styleDropdown.classList.remove("is-active");
    });
  });

  // === Add Title Modal - Media Selection ===
  modalMediaOptions.forEach((item) => {
    item.addEventListener("click", () => {
      document.getElementById("modal-media-button-text").textContent = item.textContent;
      selectedModalMediaId = item.dataset.id;
      modalMediaOptions.forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      modalMediaDropdown.classList.remove("is-active");

      // Toggle series checkbox visibility
      if (selectedModalMediaId === "2") {
        isSeriesWrapper.classList.remove("is-hidden");
      } else {
        isSeriesWrapper.classList.add("is-hidden");
        seriesCheckbox.checked = false;
        seriesNameWrapper.classList.add("is-hidden");
        seriesNameInput.value = "";
        seriesOrderWrapper.classList.add("is-hidden");
        orderNumberInput.value = "";
        selectedSeriesNameId = null;
      }
    });
  });

  // Toggle series dropdown visibility
  seriesCheckbox.addEventListener("change", () => {
    if (seriesCheckbox.checked) {
      seriesNameWrapper.classList.remove("is-hidden");
      seriesOrderWrapper.classList.remove("is-hidden");
    } else {
      seriesNameWrapper.classList.add("is-hidden");
      seriesNameInput.value = "";
      seriesOrderWrapper.classList.add("is-hidden");
      orderNumberInput.value = "";
      selectedSeriesNameId = null;
    }
  });

  // === Close dropdown on outside click ===
  document.addEventListener("click", (event) => {
    if (!platformDropdown.contains(event.target)) {
      platformDropdown.classList.remove("is-active");
    }
    if (!mediaDropdown.contains(event.target)) {
      mediaDropdown.classList.remove("is-active");
    }
    if (!styleDropdown.contains(event.target)) {
      styleDropdown.classList.remove("is-active");
    }
    if (!genreDropdown.contains(event.target)) {
      genreDropdown.classList.remove("is-active");
    }
    if (!modalMediaDropdown.contains(event.target)) {
      modalMediaDropdown.classList.remove("is-active");
    }
  });

  // === Search Button ===
  document.getElementById("search-button").addEventListener("click", (event) => {
    event.preventDefault(); // stops page from refreshing
    const platformId = selectedPlatformId;
    const mediaId = selectedMediaId;
    const styleId = selectedStyleId;
    const genreId = selectedGenreId;
    console.log("Search button clicked. Platform Id:", platformId, "Media Id:", mediaId, "Style Id:", styleId, "Genre Id:", genreId);
    loadTitles(platformId, mediaId, styleId, genreId);
    document.getElementById("titles-table-wrapper").classList.remove("is-hidden");

    document.querySelectorAll("th.sortable").forEach((header) => {
      header.addEventListener("click", () => {
        const sortBy = header.dataset.sort;

        // Toggle sort direction
        if (currentSort.column === sortBy) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort.column = sortBy;
          currentSort.direction = "asc";
        }

        sortAndRenderTitles(allTitles, sortBy, currentSort.direction);
      });
    });
  });

  // === Core Modal Logic ===
  const openModal = ($el) => $el.classList.add("is-active");
  const closeModal = ($el) => $el.classList.remove("is-active");
  const closeAllModals = () => document.querySelectorAll(".modal").forEach(closeModal);

  // Trigger buttons
  document.querySelectorAll(".js-modal-trigger").forEach(($trigger) => {
    const modalId = $trigger.dataset.target;
    const $modal = document.getElementById(modalId);
    $trigger.addEventListener("click", () => {
      openModal($modal);
    });
  });

  // Close buttons
  document.querySelectorAll(".modal-background, .modal-close, .modal-card-head .delete").forEach(($el) => {
    const $modal = $el.closest(".modal");
    $el.addEventListener("click", () => closeModal($modal));
  });

  // Escape key closes all
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });

  document.getElementById("close-current-title-btn").addEventListener("click", () => {
    currentTitleModal.classList.remove("is-active");
  });

  document.querySelector("#current-title-modal .delete").addEventListener("click", () => {
    currentTitleModal.classList.remove("is-active");
  });

  // === Add Title Modal Logic ===
  // Save Button
  addTitleForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload
    const title = document.getElementById("title-input").value.trim();
    const releaseDate = document.getElementById("release-date-input").value.trim(); // you may format this
    const hours = parseInt(document.getElementById("run-time-hours-input").value) || 0;
    const minutes = parseInt(document.getElementById("run-time-minutes-input").value) || 0;
    const runTimeTotalMin = hours * 60 + minutes;
    const orderNum = orderNumberInput.value.trim();
    const inputSeriesName = seriesNameInput.value.trim();

    if (!title) return;

    let finalSeriesId = selectedSeriesNameId;

    if (seriesCheckbox.checked && inputSeriesName && !finalSeriesId) {
      finalSeriesId = await addSeries(inputSeriesName);
    }

    const result = await addTitle(title, selectedModalMediaId, releaseDate, runTimeTotalMin, finalSeriesId, orderNum);

    console.log(
      "Type: ",
      selectedModalMediaId,
      " - Title: ",
      title,
      " - isseries: ",
      seriesCheckbox.checked,
      " - series name: ",
      inputSeriesName,
      " - series id: ",
      finalSeriesId,
      " - sort order: ",
      orderNumberInput.value,
      " - date: ", releaseDate,
      " - run time: ", runTimeTotalMin
    );

    if (result) {
      closeModal(document.getElementById("add-title-modal"));
      addTitleForm.reset();
      selectedSeriesNameId = null;
      const titleResponse = await fetch(`/api/getTitleById?titleID=${result.ID}`);
      const fullTitle = await titleResponse.json();
      openTitleModal(fullTitle);
    }
  });
});
