let allSeries = []; // full list cached in memory

async function loadSeriesOptions() {
  try {
    const response = await fetch("/api/series");
    const data = await response.json();
    allSeries = data; // cache full list for filtering
  } catch (error) {
    console.error("Failed to load series:", error);
  }
}

async function loadSeriesItems(seriesId) {
  try {
    const response = await fetch(`/api/movies-in-series?seriesId=${seriesId}`);
    const data = await response.json();
    currentSeriesItems = data;

    const tbody = document.getElementById("series-items-body");
    tbody.innerHTML = "";

    for (const item of data) {
      const tr = document.createElement("tr");
      tr.dataset.itemId = item.ID;
      tr.innerHTML = `
        <td>${item.ORDERNUM}</td>
        <td>${item.DESCRIPT}</td>
        <td>${item.TYPE}</td>
        <td><input class="input order-input" type="number" step="0.1" value="${item.ORDERNUM}" data-id="${item.ID}"></td>
      `;
      tbody.appendChild(tr);
    }
  } catch (error) {
    console.error("Failed to fetch items in series:", error);
  }
}

function refreshCurrentSeries() {
  const searchInput = document.getElementById("series-search");
  const seriesId = searchInput.dataset.seriesId;
  if (seriesId) {
    loadSeriesItems(seriesId);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSeriesOptions(); // Load series into dropdown at startup

  document.getElementById("series-search").addEventListener("input", function () {
    const input = this.value.toLowerCase();
    const resultsContainer = document.getElementById("series-results");
    resultsContainer.innerHTML = ""; // clear previous
  
    const matches = allSeries.filter(s => s.DESCRIPT.toLowerCase().includes(input));

    if (!input.trim()) {
      document.getElementById("series-dropdown").classList.remove("is-active");
      return;
    }
    
    matches.forEach(series => {
      const item = document.createElement("a");
      item.className = "dropdown-item";
      item.textContent = series.DESCRIPT;
      item.dataset.seriesId = series.ID;
  
      item.addEventListener("click", () => {
        document.getElementById("series-search").value = series.DESCRIPT;
        resultsContainer.innerHTML = "";
        document.getElementById("series-search").dataset.seriesId = series.ID;
        document.getElementById("series-dropdown").classList.remove("is-active");
        loadSeriesItems(series.ID); // 👈 your existing item loader
      });
  
      resultsContainer.appendChild(item);
    });
  
    document.getElementById("series-dropdown").classList.add("is-active");
  });

  // Hide dropdown if user clicks elsewhere
  document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("series-dropdown");
    const input = document.getElementById("series-search");
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.remove("is-active");
    }
  });

  // Save Button
  document.getElementById("save-order-button").addEventListener("click", async () => {
    const inputs = document.querySelectorAll(".order-input");
    const updates = [];

    inputs.forEach((input) => {
      const itemId = parseInt(input.dataset.id);
      const newOrder = parseFloat(input.value);
      if (!isNaN(itemId) && !isNaN(newOrder)) {
        updates.push({ id: itemId, ordernum: newOrder });
      }
    });

    try {
      // Send updates as a single POST request
      const response = await fetch("/api/update-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Order updated successfully!");
        console.log("Input saved.");
      } else {
        alert("Update failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Failed to update order.");
    }
    refreshCurrentSeries();
  });

  // Cancel button
  document.getElementById("cancel-order-button").addEventListener("click", () => {
    refreshCurrentSeries();
    console.log("Form reset.");
  });
});
