let currentMovieID = null;
let allPlatforms = []; // full list cached in memory

// Clear form function
function clearForm() {
  document.getElementById("movie-title-input").value = "";
  document.getElementById("release-date-input").value = "";
  document.getElementById("run-time-hours-input").value = "";
  document.getElementById("run-time-minutes-input").value = "";
  document.getElementById("series-checkbox").checked = false;
  document.getElementById("series-dropdown").value = "";
  document.getElementById("new-series-input").value = "";

  // Also hide the conditional fields
  document.getElementById("series-dropdown-wrapper").classList.add("is-hidden");
  document.getElementById("new-series-wrapper").classList.add("is-hidden");
  document.getElementById("series-order-wrapper").classList.add("is-hidden");
  document.getElementById("platform-wrapper").classList.add("is-hidden");
  currentMovieID = null;
}

async function loadSeriesOptions() {
  try {
    // Make API request to fetch SERIES data
    const response = await fetch("/api/series");
    const data = await response.json();
    const dropdown = document.getElementById("series-dropdown");

    // Clear existing options
    dropdown.innerHTML = "";

    // Add default prompt option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a series --";
    defaultOption.disabled = true;
    defaultOption.selected = true; // <-- Ensures this is the one shown initially
    dropdown.appendChild(defaultOption);

    // Always add the "New Series" option first
    const newOption = document.createElement("option");
    newOption.value = "new";
    newOption.textContent = "*New Series*";
    dropdown.appendChild(newOption);

    // Add existing series from database
    for (const series of data) {
      const option = document.createElement("option");
      option.value = series.ID;
      option.textContent = series.DESCRIPT;
      dropdown.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load series:", error);
  }
}

async function loadPlatformOptions() {
  try {
    // Make API request to fetch PLATFORM data
    const response = await fetch("/api/platform");
    const data = await response.json();
    const dropdown = document.getElementById("platform-dropdown");

    // Clear existing options
    dropdown.innerHTML = "";

    // Add default prompt option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a streaming platform --";
    defaultOption.disabled = false;
    defaultOption.selected = true; // <-- Ensures this is the one shown initially
    dropdown.appendChild(defaultOption);

    // Add existing series from database
    for (const platform of data) {
      const option = document.createElement("option");
      option.value = platform.ID;
      option.textContent = platform.DESCRIPT;
      dropdown.appendChild(option);
    }
  } catch (error) {
    console.error("Failed to load platforms:", error);
  }
}

async function getMovies() {
  try {
    // Make API request to fetch movie data
    const response = await fetch("/api/movies");
    const data = await response.json();
    console.log(data);
    // Get reference to the movie list textarea element
    if (data.error) {
      // Display error message if API returns an error
      document.getElementById("movie-list").value = data.error;
    } else {
      // Initialize empty string to store movie titles
      let movieList = "";

      // Iterate through movie data and build display string
      for (const movie of data) {
        movieList += `${movie.DESCRIPT}\n`;
      }
      // Update UI with list of movie titles
      document.getElementById("movie-list").value = movieList;
    }
  } catch (error) {
    // Handle any errors that occur during API call
    document.getElementById("movie-list").value = "Error fetching data";
    console.error(error);
  }
}

async function addMovie({ movieTitle, releaseDate, runTimeTotalMin, seriesID, orderNum }) {
  const response = await fetch("/api/addMovie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      movieTitle,
      releaseDate,
      runTimeTotalMin,
      seriesID,
      orderNum,
    }),
  });

  if (response.ok) {
    getMovies();
    const result = await response.json();
    return result.insertId || result.ID || null;
  } else {
    const errorData = await response.json(); // get error info from the server
    document.getElementById("movie-list").value = errorData.error || "Unknown error";
  }
}

async function loadMoviePlatforms(movieId) {
  try {
    const response = await fetch(`/api/movie-platforms?movieId=${movieId}`);
    const data = await response.json();

    const tbody = document.getElementById("movie-platform-body");
    tbody.innerHTML = "";

    for (const item of data) {
      const tr = document.createElement("tr");
      tr.dataset.platformId = item.PLATFORMID;
      tr.innerHTML = `
        <td class="is-narrow drag-cell"><div class="drag-handle">⬍</div></td>
        <td class="is-narrow order-cell"><span class="order-value"></span></td>
        <td>${item.DESCRIPT}</td>
        <td class="is-narrow remove-cell"><button class="button is-small is-danger remove-platform">✖</button></td>
      `;
      tbody.appendChild(tr);
    }
    updateDisplayedOrderNumbers();
  } catch (error) {
    console.error("Failed to fetch platforms for movie:", error);
  }
}

function refreshCurrentPlatforms() {
  if (currentMovieID) {
    loadMoviePlatforms(currentMovieID);
  }
}

async function addSeries({ newSeriesName }) {
  const response = await fetch("/api/addSeries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newSeriesName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Unknown error");
  }

  const result = await response.json();
  return result.insertId || result.ID || null;
}

function updateDisplayedOrderNumbers() {
  const rows = document.querySelectorAll("#movie-platform-body tr");
  rows.forEach((row, index) => {
    const orderCell = row.querySelector(".order-cell .order-value");
    if (orderCell) {
      orderCell.textContent = index + 1;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSeriesOptions(); // Load series into dropdown at startup
  loadPlatformOptions(); // Load streaming platforms into dropdown at startup

  const seriesCheckbox = document.getElementById("series-checkbox");
  const seriesDropdownWrapper = document.getElementById("series-dropdown-wrapper");
  const seriesDropdown = document.getElementById("series-dropdown");
  const newSeriesWrapper = document.getElementById("new-series-wrapper");
  const seriesOrderWrapper = document.getElementById("series-order-wrapper");

  // Hide series dropdown and input initially
  seriesDropdownWrapper.classList.add("is-hidden");
  newSeriesWrapper.classList.add("is-hidden");
  seriesOrderWrapper.classList.add("is-hidden");

  // Toggle series dropdown visibility
  seriesCheckbox.addEventListener("change", () => {
    if (seriesCheckbox.checked) {
      seriesDropdownWrapper.classList.remove("is-hidden");
      seriesOrderWrapper.classList.remove("is-hidden");
    } else {
      seriesDropdownWrapper.classList.add("is-hidden");
      seriesOrderWrapper.classList.add("is-hidden");
      newSeriesWrapper.classList.add("is-hidden");
      seriesDropdown.value = "";
      document.getElementById("new-series-input").value = "";
      document.getElementById("order-number-input").value = "";
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

  // Save Button
  document.getElementById("save-movie-button").addEventListener("click", async () => {
    const movieTitle = document.getElementById("movie-title-input").value;
    const releaseDate = document.getElementById("release-date-input").value;
    const runTimeHours = parseInt(document.getElementById("run-time-hours-input").value || "0");
    const runTimeMinutes = parseInt(document.getElementById("run-time-minutes-input").value || "0");
    const runTimeTotalMin = runTimeHours * 60 + runTimeMinutes;

    const isSeries = seriesCheckbox.checked;
    const selectedSeriesValue = seriesDropdown.value;
    const orderNum = document.getElementById("order-number-input").value;
    const newSeriesName = document.getElementById("new-series-input").value;

    if (!movieTitle) {
      console.log("Please enter a movie title.");
      return;
    }

    let seriesID = null;

    if (isSeries) {
      if (!selectedSeriesValue) {
        console.log("Please select a series.");
        return;
      }

      if (selectedSeriesValue === "new") {
        if (!newSeriesName) {
          console.log("Please provide name of new series.");
          return;
        }

        // Add new series and get back the new ID
        try {
          seriesID = await addSeries({ newSeriesName });
          console.log("New series added:", newSeriesName);
        } catch (error) {
          console.error("Error adding series:", error);
          return;
        }
      } else {
        // Use the selected existing ID
        seriesID = parseInt(selectedSeriesValue);
      }
    }

    // Insert movie with or without seriesID
    currentMovieID = await addMovie({
      movieTitle,
      releaseDate,
      runTimeTotalMin,
      seriesID: seriesID || null,
      orderNum: orderNum || null,
    });

    if (currentMovieID) {
      document.getElementById("platform-wrapper").classList.remove("is-hidden");
    } else {
      console.error("Failed to retrieve movie ID.");
      return;
    }

    loadSeriesOptions(); // Reload series, in case new series was added
    console.log("Input saved.");
  });

  // Cancel button
  document.getElementById("cancel-movie-button").addEventListener("click", () => {
    clearForm();
    console.log("Form cleared.");
  });

  // Add Platform Button
  document.getElementById("add-platform-button").addEventListener("click", () => {
    const platformID = document.getElementById("platform-dropdown").value;
    const platformName = allPlatforms.find((p) => p.ID == platformID)?.DESCRIPT;

    if (!currentMovieID || !platformID) return;

    // Prevent duplicates
    const existing = Array.from(document.querySelectorAll("#movie-platform-body tr")).some((row) => row.dataset.platformId === platformID);
    if (existing) {
      alert("This platform is already added.");
      return;
    }

    const tbody = document.getElementById("movie-platform-body");
    const orderNum = tbody.children.length + 1;
    const tr = document.createElement("tr");
    tr.dataset.platformId = platformID;
    tr.innerHTML = `    
      <td class="is-narrow drag-cell"><div class="drag-handle">⬍</div></td>
      <td class="is-narrow order-cell"><span class="order-value">${orderNum}</span></td>
      <td>${platformName}</td>
      <td class="is-narrow remove-cell"><button class="button is-small is-danger remove-platform">✖</button></td>
    `;
    tbody.appendChild(tr);
    updateDisplayedOrderNumbers();
    document.getElementById("platform-dropdown").value = "";
  });

  document.getElementById("movie-platform-body").addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-platform")) {
      e.target.closest("tr").remove();
      updateDisplayedOrderNumbers();
    }
  });

  new Sortable(document.getElementById("movie-platform-body"), {
    handle: ".drag-handle",
    animation: 150,
    onEnd: () => {
      updateDisplayedOrderNumbers();
    }
  });

  // Save Button
  document.getElementById("save-platform-button").addEventListener("click", async () => {
    if (!currentMovieID) return alert("Add a movie first");
  
    const rows = document.querySelectorAll("#movie-platform-body tr");
    const updates = [];
  
    rows.forEach((row, index) => {
      const platformId = row.dataset.platformId;
      if (platformId) {
        updates.push({
          movieId: parseInt(currentMovieID),
          platformId: parseInt(platformId),
          orderId: index + 1
        });
      }
    });
  
    try {
      const response = await fetch("/api/update-movie-platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert("Platforms saved!");
        refreshCurrentPlatforms();
      } else {
        alert("Failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to update platforms:", error);
      alert("Failed to update platforms.");
    }
  });

  // Load movies
  document.getElementById("get-movies").addEventListener("click", getMovies);
});
