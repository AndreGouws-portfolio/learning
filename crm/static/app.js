// Dropdown menus (e.g. the "+ New" button)
document.querySelectorAll(".menu").forEach((menu) => {
  const trigger = menu.querySelector(".menu-trigger");
  if (!trigger) return;
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".menu.open").forEach((m) => {
      if (m !== menu) m.classList.remove("open");
    });
    menu.classList.toggle("open");
  });
});
document.addEventListener("click", () => {
  document.querySelectorAll(".menu.open").forEach((m) => m.classList.remove("open"));
});

// Sidebar menu toggle (narrow/docked windows hide the sidebar by default)
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("open");
}
if (menuToggle && sidebar && sidebarBackdrop) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("open");
  });
  sidebarBackdrop.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", closeSidebar);
  });
}

// Confirm before any destructive delete form submits
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    if (!window.confirm(form.dataset.confirm)) {
      e.preventDefault();
    }
  });
});
