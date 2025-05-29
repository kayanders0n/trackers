let allMovies = []; // full list cached in memory
let allGenres = []; // full list cached in memory

async function loadMovieOptions() {
  try {
    const response = await fetch("/api/movies");
    const data = await response.json();
    allMovies = data; // cache full list for filtering
    console.log("Loaded movies:", allMovies); 
  } catch (error) {
    console.error("Failed to load movies:", error);
  }
}

async function loadAllGenres() {
  try {
    const response = await fetch("/api/genres");
    const data = await response.json();
    allGenres = data;

    const genreSelect = document.getElementById("genre-select");
    genreSelect.innerHTML = "";

    // Add default placeholder option
    const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = "Select genre to add";
      genreSelect.appendChild(defaultOption);

    data.forEach(genre => {
      const option = document.createElement("option");
      option.value = genre.ID;
      option.textContent = genre.DESCRIPT;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load genres:", error);
  }
}

function updateDisplayedOrderNumbers() {
  const rows = document.querySelectorAll("#movie-genre-body tr");
  rows.forEach((row, index) => {
    const orderCell = row.querySelector(".order-cell .order-value");
    if (orderCell) {
      orderCell.textContent = index + 1;
    }
  });
}

async function loadMovieGenres(movieId) {
  try {
    const response = await fetch(`/api/movie-genres?movieId=${movieId}`);
    const data = await response.json();

    const tbody = document.getElementById("movie-genre-body");
    tbody.innerHTML = "";

    for (const item of data) {
      const tr = document.createElement("tr");
      tr.dataset.genreId = item.GENREID;
      tr.innerHTML = `
        <td class="is-narrow drag-cell"><div class="drag-handle">⬍</div></td>
        <td class="is-narrow order-cell"><span class="order-value"></span></td>
        <td>${item.DESCRIPT}</td>
        <td class="is-narrow remove-cell"><button class="button is-small is-danger remove-genre">✖</button></td>
      `;
      tbody.appendChild(tr);
    }
    updateDisplayedOrderNumbers();
  } catch (error) {
    console.error("Failed to fetch genres for movie:", error);
  }
}

function refreshCurrentGenres() {
  const searchInput = document.getElementById("movie-search");
  const movieId = searchInput.dataset.movieId;
  if (movieId) {
    loadMovieGenres(movieId);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadMovieOptions(); // Load series into dropdown at startup
  loadAllGenres(); // Load series into dropdown at startup

  document.getElementById("movie-search").addEventListener("input", function () {
    const input = this.value.toLowerCase();
    const resultsContainer = document.getElementById("movie-results");
    resultsContainer.innerHTML = ""; // clear previous
  
    const matches = allMovies.filter(s => s.DESCRIPT.toLowerCase().includes(input));

    if (!input.trim()) {
      document.getElementById("movie-dropdown").classList.remove("is-active");
      return;
    }
    
    matches.forEach(movie => {
      const item = document.createElement("a");
      item.className = "dropdown-item";
      item.textContent = movie.DESCRIPT;
      item.dataset.movieId = movie.ID;
  
      item.addEventListener("click", () => {
        document.getElementById("movie-search").value = movie.DESCRIPT;
        resultsContainer.innerHTML = "";
        document.getElementById("movie-search").dataset.movieId = movie.ID;
        document.getElementById("movie-dropdown").classList.remove("is-active");
        loadMovieGenres(movie.ID);
      });
  
      resultsContainer.appendChild(item);
    });
  
    document.getElementById("movie-dropdown").classList.add("is-active");
  });

  // Hide dropdown if user clicks elsewhere
  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("movie-dropdown");
    const input = document.getElementById("movie-search");
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.remove("is-active");
    }
  });

  document.getElementById("movie-genre-body").addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-genre")) {
      e.target.closest("tr").remove();
      updateDisplayedOrderNumbers();
    }
  });

  document.getElementById("add-genre-button").addEventListener("click", () => {
    const movieId = document.getElementById("movie-search").dataset.movieId;
    const genreId = document.getElementById("genre-select").value;
    const genreName = allGenres.find(g => g.ID == genreId)?.DESCRIPT;
  
    if (!movieId || !genreId) return;
  
    // Prevent duplicates
    const existing = Array.from(document.querySelectorAll("#movie-genre-body tr")).some(
      row => row.dataset.genreId === genreId
    );
    if (existing) {
      alert("This genre is already added.");
      return;
    }
  
    const tbody = document.getElementById("movie-genre-body");
    const orderNum = tbody.children.length + 1;
    const tr = document.createElement("tr");
    tr.dataset.genreId = genreId;
    tr.innerHTML = `    
      <td class="is-narrow drag-cell"><div class="drag-handle">⬍</div></td>
      <td class="is-narrow order-cell"><span class="order-value">${orderNum}</span></td>
      <td>${genreName}</td>
      <td class="is-narrow remove-cell"><button class="button is-small is-danger remove-genre">✖</button></td>
    `;
    tbody.appendChild(tr);
    updateDisplayedOrderNumbers();
  });

  new Sortable(document.getElementById("movie-genre-body"), {
    handle: ".drag-handle",
    animation: 150,
    onEnd: () => {
      updateDisplayedOrderNumbers();
    }
  });

  // Save Button
  document.getElementById("save-button").addEventListener("click", async () => {
    const movieId = document.getElementById("movie-search").dataset.movieId;
    if (!movieId) return alert("Select a movie first");
  
    const rows = document.querySelectorAll("#movie-genre-body tr");
    const updates = [];
  
    rows.forEach((row, index) => {
      const genreId = row.dataset.genreId;
      if (genreId) {
        updates.push({
          movieId: parseInt(movieId),
          genreId: parseInt(genreId),
          orderId: index + 1
        });
      }
    });
  
    try {
      const response = await fetch("/api/update-movie-genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert("Genres saved!");
        refreshCurrentGenres();
      } else {
        alert("Failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to update genres:", error);
      alert("Failed to update genres.");
    }
  });
  

  // Cancel button
  document.getElementById("cancel-button").addEventListener("click", () => {
    refreshCurrentGenres();
    console.log("Form reset.");
  });
});
