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

    const dropdown = document.createElement("div");
    dropdown.className = "box p-3";
    dropdown.style.maxHeight = "200px";
    dropdown.style.overflowY = "auto";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.borderRadius = "5px";
    dropdown.style.backgroundColor = "#2C2C34";

    for (const list of lists) {
      const label = document.createElement("label");
      label.className = "checkbox mb-2";
      label.style.display = "block";

      label.innerHTML = `
        <input 
          type="checkbox" 
          ${list.inList ? "checked" : ""} 
          onchange="toggleListMembership(${list.listId}, ${titleId}, this.checked)" 
        />
        <span class="ml-2">${list.listName}</span>
      `;
      dropdown.appendChild(label);
    }

    container.innerHTML = "";
    container.appendChild(dropdown);
  } catch (error) {
    console.error("Failed to load list dropdown:", error);
    container.innerHTML = "Error loading lists.";
  }
}

// === Toggle List Membership ===
async function toggleListMembership(listId, titleId, isChecked) {
  try {
    await fetch("/api/user/1/lists/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId, titleId, checked: isChecked })
    });
  } catch (error) {
    console.error("Failed to update list membership:", error);
  }
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

// === Setup Event Listeners After DOM Loads ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("titles-table-wrapper").classList.add("is-hidden");
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
