const listTypeIcons = {
  1: "fas fa-list",         // User Custom List
  2: "fas fa-bookmark",       // Want To Read
  3: "fas fa-book-open",       // Currently Reading
  4: "fas fa-book",    // Finished Reading
  5: "fas fa-ban",        // Did Not Finish Reading
  6: "fas fa-ticket",       // Want To Watch
  7: "fas fa-video",       // Currently Watching
  8: "fas fa-film",    // Finished Watching
  9: "fas fa-ban",        // Did Not Finish Watching
};

function renderLists(lists, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // Clear old content

  const columns = document.createElement("div");
  columns.className = "columns is-multiline";

  lists.forEach((list) => {
    const column = document.createElement("div");
    column.className = "column is-one-quarter";
    const iconClass = listTypeIcons[list.LISTTYPEID] || "fas fa-list";

    column.innerHTML = `
      <a class="box has-text-centered list-link" data-id="${list.ID}">
        <span class="icon is-large">
          <i class="${iconClass} fa-2x"></i>
        </span>
        <h3 class="title is-5 mt-2">${list.DESCRIPT}</h3>
        <h3 class="title is-5 mt-2">${list.LISTTYPEID}</h3>
        <p class="subtitle is-6">(${list.ITEM_COUNT || 0} titles)</p>
      </a>
    `;

    columns.appendChild(column);
  });

  container.appendChild(columns);
}

function loadUserLists(typeId) {
  fetch(`/api/user/1/lists?typeId=${typeId}`)
    .then(res => res.json())
    .then(data => {
      if (typeId === 6) {
        renderLists(data, "entertainment-content");
      } else if (typeId === 1) {
        renderLists(data, "books-content");
      }
    })
    .catch(err => console.error("Failed to load lists:", err));
}

  // Example handlers
  document.getElementById("entertainment-tab").addEventListener("click", () => {
    loadUserLists(6); // Entertainment
  });
  
  document.getElementById("books-tab").addEventListener("click", () => {
    loadUserLists(1); // Books
  });
  
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll('.tabs li');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');

      // Hide all content panes
      panes.forEach(p => p.classList.add('is-hidden'));

      // Show the selected content pane
      const selectedTab = tab.dataset.tab;
      document.getElementById(`${selectedTab}-content`).classList.remove('is-hidden');

      // Load the correct lists
      if (selectedTab === "entertainment") {
        loadUserLists(6);
      } else if (selectedTab === "books") {
        loadUserLists(1);
      }
    });
  });

  // Load entertainment by default on first load
  loadUserLists(6);
});