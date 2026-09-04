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

// Confirm before any destructive delete form submits
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    if (!window.confirm(form.dataset.confirm)) {
      e.preventDefault();
    }
  });
});
