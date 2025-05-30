let selectedPlatformId = null;
let selectedMediaId = "";

async function loadAllPlatforms() {
  try {
    const response = await fetch("/api/getPlatforms");
    const data = await response.json();
    const menu = document.getElementById("platform-options");

    menu.innerHTML = ""; // clear existing

    // Add "All Platforms" option first
    const allOption = document.createElement("a");
    allOption.className = "dropdown-item";
    allOption.dataset.id = "";
    allOption.textContent = "-- All --";
    allOption.addEventListener("click", () => {
      document.getElementById("platform-button-text").textContent = "-- All --";
      document.getElementById("platform-dropdown").classList.remove("is-active");
      selectedPlatformId = null;
    });
    menu.appendChild(allOption);

    for (const platform of data) {
      const item = document.createElement("a");
      item.className = "dropdown-item";
      item.dataset.id = platform.ID;
      item.textContent = platform.DESCRIPT;

      item.addEventListener("click", () => {
        document.getElementById("platform-button-text").textContent = platform.DESCRIPT;
        document.getElementById("platform-dropdown").classList.remove("is-active");
        selectedPlatformId = platform.ID;
      });

      menu.appendChild(item);
    }
  } catch (error) {
    console.error("Failed to load platforms:", error);
  }
}

async function loadAllGenres() {
  try {
    const response = await fetch("/api/getGenres");
    const data = await response.json();

    const genreSelect = document.getElementById("genre-select");
    genreSelect.innerHTML = "";

    // Add default placeholder option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = false;
    defaultOption.selected = true;
    defaultOption.textContent = "-- Genre --";
    genreSelect.appendChild(defaultOption);

    data.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre.ID;
      option.textContent = genre.DESCRIPT;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load genres:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAllPlatforms(); // Load platforms into dropdown at startup
  loadAllGenres(); // Load genres into dropdown at startup

  const platformDropdown = document.getElementById("platform-dropdown");
  const platformTrigger = platformDropdown.querySelector(".dropdown-trigger");

  const mediaDropdown = document.getElementById("media-dropdown");
  const mediaTrigger = document.getElementById("media-button");
  const mediaItems = document.querySelectorAll("#media-options .dropdown-item");

  // Toggle platform dropdown
  platformTrigger.addEventListener("click", () => {
    platformDropdown.classList.toggle("is-active");
  });

  // Toggle media dropdown
  mediaTrigger.addEventListener("click", () => {
    mediaDropdown.classList.toggle("is-active");
  });

  // Media item selection
  mediaItems.forEach((item) => {
    item.addEventListener("click", () => {
      document.getElementById("media-button-text").textContent = item.textContent;
      selectedMediaId = item.dataset.id;

      // Remove active class from all
      mediaItems.forEach((i) => i.classList.remove("is-active"));
      // Add to selected
      item.classList.add("is-active");

      mediaDropdown.classList.remove("is-active");
    });
  });

  // Close any open dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!platformDropdown.contains(event.target)) {
      platformDropdown.classList.remove("is-active");
    }
    if (!mediaDropdown.contains(event.target)) {
      mediaDropdown.classList.remove("is-active");
    }
  });
});
