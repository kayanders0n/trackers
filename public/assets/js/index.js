// === Load external HTML into target element ===
async function includeHTML(targetSelector, filePath, callback) {
  const targetEl = document.querySelector(targetSelector);
  if (targetEl) {
    try {
      const res = await fetch(filePath);
      const html = await res.text();
      targetEl.innerHTML = html;
      if (callback) callback(); // Run callback after HTML is inserted
    } catch (err) {
      targetEl.innerHTML = "<!-- failed to load component: " + filePath + " -->";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // === Get path and section info from URL ===
  const currentPath = window.location.pathname;
  const sectionMatch = currentPath.match(/^\/([^/]+)\//);
  const sectionName = sectionMatch ? sectionMatch[1] : null;

  // === Set relative path for includes ===
  const basePath = sectionName ? "../" : "";
  const heroPath = sectionName ? `${basePath}components/hero-${sectionName}.html` : null;

  // === Load navbar and activate burger toggle ===
  includeHTML("#navbar-placeholder", `${basePath}components/navbar.html`, () => {
    const burgerBtn = document.querySelector(".navbar-burger");
    const menuEl = document.getElementById("navbar-basic-example");
    if (burgerBtn && menuEl) {
      burgerBtn.addEventListener("click", () => {
        burgerBtn.classList.toggle("is-active");
        menuEl.classList.toggle("is-active");
      });
    }
  });

  // === Load hero section (if available) and highlight active tab ===
  if (heroPath) {
    includeHTML("#hero-placeholder", heroPath, () => {
      document.querySelectorAll(".hero .tabs a").forEach(tabLink => {
        const tabHref = tabLink.getAttribute("href");
        if (path.endsWith(tabHref)) {
          tabLink.parentElement.classList.add("is-active");
        } else {
          tabLink.parentElement.classList.remove("is-active");
        }
      });
    });
  }
});