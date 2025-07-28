async function loadUserLists() {
  try {
    const response = await fetch("/api/user/1/lists"); // 1 for now, later use dynamic
    const data = await response.json();

    renderLists(data); // function to inject data into the DOM
  } catch (error) {
    console.error("Failed to load user lists:", error);
  }
}

function renderLists(lists) {
  const entertainmentContainer = document.getElementById("entertainment-content");
  entertainmentContainer.innerHTML = ""; // Clear old content

  const columns = document.createElement("div");
  columns.className = "columns is-multiline";

  lists.forEach((list) => {
    const column = document.createElement("div");
    column.className = "column is-one-quarter";

    column.innerHTML = `
      <a class="box has-text-centered list-link" data-id="${list.ID}">
        <span class="icon is-large">
          <i class="fas fa-list fa-2x"></i>
        </span>
        <h3 class="title is-5 mt-2">${list.DESCRIPT}</h3>
        <p class="subtitle is-6">(${list.ITEM_COUNT || 0} titles)</p>
      </a>
    `;

    columns.appendChild(column);
  });

  entertainmentContainer.appendChild(columns);
}

document.addEventListener("DOMContentLoaded", () => {
  loadUserLists();
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
    });
  });
});