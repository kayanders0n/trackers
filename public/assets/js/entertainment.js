// === Selected Filters (Global State) ===
let selectedPlatformId = null;
let selectedMediaId = "";
let selectedStyleId = "";
let selectedGenreId = null;
let selectedSeriesNameId = null;
let allTitles = [];
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
    const data = await response.json();
    const seriesNameOptions = document.getElementById("series-name-options");

    // Clear existing options
    seriesNameOptions.innerHTML = "";

    // Add default prompt option
    const defaultOption = document.createElement("a");
    defaultOption.className = "dropdown-item is-unselectable has-text-grey";
    defaultOption.dataset.id = "";
    defaultOption.textContent = "-- Series Name --";
    defaultOption.addEventListener("click", (e) => {
      e.preventDefault(); // Do nothing
    });
    seriesNameOptions.appendChild(defaultOption);

    // Always add the "New Series" option first
    const newOption = document.createElement("a");
    newOption.className = "dropdown-item";
    newOption.dataset.id = "new";
    newOption.textContent = "-- New Series --";
    newOption.addEventListener("click", () => {
      document.getElementById("series-name-button-text").textContent = "-- New Series --";
      document.getElementById("series-name-dropdown").classList.remove("is-active");
      selectedSeriesNameId = "new";
      document.getElementById("new-series-wrapper").classList.remove("is-hidden");
      seriesNameOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
      newOption.classList.add("is-active");
    });
    seriesNameOptions.appendChild(newOption);

    // Add existing series from database
    for (const series of data) {
      const option = document.createElement("a");
      option.className = "dropdown-item";
      option.dataset.id = series.ID;
      option.textContent = series.DESCRIPT;
      option.addEventListener("click", () => {
        document.getElementById("series-name-button-text").textContent = series.DESCRIPT;
        document.getElementById("series-name-dropdown").classList.remove("is-active");
        selectedSeriesNameId = series.ID;
        document.getElementById("new-series-wrapper").classList.add("is-hidden");
        document.getElementById("new-series-input").value = "";
        seriesNameOptions.querySelectorAll(".dropdown-item").forEach((i) => i.classList.remove("is-active"));
        option.classList.add("is-active");
      });
      seriesNameOptions.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load series:", error);
  }
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
async function loadTitles(platformID, mediaID, styleID, genreID) {
  try {
    const response = await fetch(
      `/api/getTitles?platformID=${platformID ?? ""}&mediaID=${mediaID ?? ""}&styleID=${styleID ?? ""}&genreID=${genreID ?? ""}`
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
    </div>
  `;

  modalBody.appendChild(content);
  modal.classList.add("is-active");

  // Get Genres
  const genreSpan = content.querySelector(".genre-list");
  try {
    const genreResponse = await fetch(`/api/getTitleGenres?titleID=${title.ID}`);
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
    const platformResponse = await fetch(`/api/getTitlePlatforms?titleID=${title.ID}`);
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
    const seriesResponse = await fetch(`/api/getTitleSeries?titleID=${title.ID}`);
    const seriesData = await seriesResponse.json();
    const seriesNames = seriesData.length > 0 ? seriesData.map((g) => g.DESCRIPT).join(", ") : "None listed";
    seriesSpan.innerHTML = seriesNames;
  } catch (error) {
    console.error("Failed to load title series:", error);
    seriesSpan.innerHTML = "Error loading series";
  }
}

// === Setup Event Listeners After DOM Loads ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("titles-table-wrapper").classList.add("is-hidden");
  loadAllPlatforms(); // Load platforms into dropdown at startup
  loadAllGenres(); // Load genres into dropdown at startup
  loadSeriesOptions(); // Load series into dropdown at startup

  const platformDropdown = document.getElementById("platform-dropdown");
  const mediaDropdown = document.getElementById("media-dropdown");
  const styleDropdown = document.getElementById("style-dropdown");
  const genreDropdown = document.getElementById("genre-dropdown");
  const modalMediaDropdown = document.getElementById("modal-media-dropdown");
  const seriesDropdown = document.getElementById("series-name-dropdown");

  setupDropdown("platform-button", "platform-dropdown");
  setupDropdown("media-button", "media-dropdown");
  setupDropdown("style-button", "style-dropdown");
  setupDropdown("genre-button", "genre-dropdown");
  setupDropdown("modal-media-button", "modal-media-dropdown");
  setupDropdown("series-name-button", "series-name-dropdown");

  const mediaOptions = document.querySelectorAll("#media-options .dropdown-item");
  const styleOptions = document.querySelectorAll("#style-options .dropdown-item");
  const modalMediaOptions = document.querySelectorAll("#modal-media-options .dropdown-item");

  const isSeriesWrapper = document.getElementById("is-series-wrapper");
  const seriesCheckbox = document.getElementById("series-checkbox");
  const seriesDropdownWrapper = document.getElementById("series-dropdown-wrapper");
  const newSeriesWrapper = document.getElementById("new-series-wrapper");
  const seriesOrderWrapper = document.getElementById("series-order-wrapper");

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

  // === Modal Media Selection ===
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
        document.getElementById("series-checkbox").checked = false;
        seriesDropdownWrapper.classList.add("is-hidden");
        newSeriesWrapper.classList.add("is-hidden");
        seriesOrderWrapper.classList.add("is-hidden");
        seriesDropdown.value = "";
        document.getElementById("new-series-input").value = "";
        document.getElementById("order-number-input").value = "";
      }
    });
  });

  // Toggle series dropdown visibility
  seriesCheckbox.addEventListener("change", () => {
    if (seriesCheckbox.checked) {
      seriesDropdownWrapper.classList.remove("is-hidden");
      seriesOrderWrapper.classList.remove("is-hidden");
    } else {
      seriesDropdownWrapper.classList.add("is-hidden");
      seriesOrderWrapper.classList.add("is-hidden");
      newSeriesWrapper.classList.add("is-hidden");
      document.getElementById("new-series-input").value = "";
      document.getElementById("order-number-input").value = "";
      document.getElementById("series-name-button-text").textContent = "-- Series Name --";
      selectedSeriesNameId = null;
      document.querySelectorAll("#series-name-options .dropdown-item").forEach((i) => {
        i.classList.remove("is-active");
      });
    }
  });

  // Toggle new series input visibility
  seriesDropdown.addEventListener("change", () => {
    if (seriesDropdown.value === "new") {
      newSeriesWrapper.classList.remove("is-hidden");
    } else {
      newSeriesWrapper.classList.add("is-hidden");
      document.getElementById("new-series-input").value = "";
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
    if (!seriesDropdown.contains(event.target)) {
      seriesDropdown.classList.remove("is-active");
    }
  });

  // === Search Button ===
  document.getElementById("search-button").addEventListener("click", (event) => {
    event.preventDefault(); // stops page from refreshing
    const platformID = selectedPlatformId;
    const mediaID = selectedMediaId;
    const styleID = selectedStyleId;
    const genreID = selectedGenreId;
    console.log("Search button clicked. Platform ID:", platformID, "Media ID:", mediaID, "Style ID:", styleID, "Genre ID:", genreID);
    loadTitles(platformID, mediaID, styleID, genreID);
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
    document.getElementById("current-title-modal").classList.remove("is-active");
  });

  document.querySelector("#current-title-modal .delete").addEventListener("click", () => {
    document.getElementById("current-title-modal").classList.remove("is-active");
  });

  // === Modal-Specific Logic ===
  // Save Title
  // document.getElementById("save-title-btn").addEventListener("click", async (e) => {
  // e.preventDefault();
  // const title = document.getElementById("title-input").value.trim();
  // if (!title) return;

  // try {
  //   const res = await fetch("/api/add-title", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ title }),
  //   });

  //   if (res.ok) {
  //     closeModal(document.getElementById("add-title-modal"));
  //     document.getElementById("add-title-form").reset();
  //   } else {
  //     console.error("Failed to add title");
  //   }
  // } catch (err) {
  //   console.error("Error submitting title:", err);
  // }
  // });

  document.getElementById("add-title-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page reload
    console.log("Form submitted — default prevented.");
  });
});
