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
  document.getElementById("series-dropdown-wrapper").style.display = "none";
  document.getElementById("new-series-wrapper").style.display = "none";
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
    defaultOption.selected = true;  // <-- Ensures this is the one shown initially
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
  } else {
    const errorData = await response.json(); // get error info from the server
    document.getElementById("movie-list").value = errorData.error || "Unknown error";
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
  return result.insertId || result.ID || null; // Depends on backend
}

document.addEventListener("DOMContentLoaded", () => {

  loadSeriesOptions(); // Load series into dropdown at startup

  const seriesCheckbox = document.getElementById("series-checkbox");
  const seriesDropdownWrapper = document.getElementById("series-dropdown-wrapper");
  const seriesDropdown = document.getElementById("series-dropdown");
  const newSeriesWrapper = document.getElementById("new-series-wrapper");
  const seriesOrderWrapper = document.getElementById("series-order-wrapper");

  // Hide series dropdown and input initially
  seriesDropdownWrapper.style.display = "none";
  newSeriesWrapper.style.display = "none";
  seriesOrderWrapper.style.display = "none";

  // Toggle series dropdown visibility
  seriesCheckbox.addEventListener("change", () => {
    if (seriesCheckbox.checked) {
      seriesDropdownWrapper.style.display = "block";
      seriesOrderWrapper.style.display = "block";
    } else {
      seriesDropdownWrapper.style.display = "none";
      seriesOrderWrapper.style.display = "none";
      newSeriesWrapper.style.display = "none";
      seriesDropdown.value = "";
      document.getElementById("new-series-input").value = "";
      document.getElementById("order-number-input").value = "";
    }
  });

  // Toggle new series input visibility
  seriesDropdown.addEventListener("change", () => {
    if (seriesDropdown.value === "new") {
      newSeriesWrapper.style.display = "block";
    } else {
      newSeriesWrapper.style.display = "none";
      document.getElementById("new-series-input").value = "";
    }
  });

  // Save Button
  document.getElementById("save-button").addEventListener("click", async () => {
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
    addMovie({
      movieTitle,
      releaseDate,
      runTimeTotalMin,
      seriesID: seriesID || null,
      orderNum: orderNum || null,
    });

    clearForm();
    console.log("Input saved.");
  });

  // Cancel button
  document.getElementById("cancel-button").addEventListener("click", () => {
    clearForm();
    console.log("Form cleared.");
  });

  // Load movies
  document.getElementById("get-movies").addEventListener("click", getMovies);
});