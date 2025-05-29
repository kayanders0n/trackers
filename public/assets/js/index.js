// Utility to load HTML partials
async function includeHTML(selector, file, callback) {
  const el = document.querySelector(selector);
  if (el) {
    try {
      const res = await fetch(file);
      const html = await res.text();
      el.innerHTML = html;
      if (callback) callback(); // <-- run callback after insert
    } catch (err) {
      el.innerHTML = "<!-- failed to load component: " + file + " -->";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Get the top-level folder
  const match = path.match(/^\/([^/]+)\//);
  const section = match ? match[1] : null;

  const base = section ? "../" : "";
  const heroFile = section ? `${base}components/hero-${section}.html` : null;

  // Load navbar
  includeHTML("#navbar-placeholder", `${base}components/navbar.html`, () => {
    // Burger nav toggle (runs after navbar loads)
    const burger = document.querySelector(".navbar-burger");
    const menu = document.getElementById("navbar-basic-example");
    if (burger && menu) {
      burger.addEventListener("click", () => {
        burger.classList.toggle("is-active");
        menu.classList.toggle("is-active");
      });
    }
  });

  // Load hero only if a section was found
  if (heroFile) {
    includeHTML("#hero-placeholder", heroFile, () => {
      // Highlight the correct tab (if tabs exist in this hero)
      document.querySelectorAll(".hero .tabs a").forEach(link => {
        const href = link.getAttribute("href");
        if (path.endsWith(href)) {
          link.parentElement.classList.add("is-active");
        } else {
          link.parentElement.classList.remove("is-active");
        }
      });
    });
  }
});