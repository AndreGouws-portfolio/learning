function formatCurrency(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function updateColumnStats(column) {
  const cards = column.querySelectorAll(".deal-card");
  const total = Array.from(cards).reduce((sum, c) => sum + Number(c.dataset.value || 0), 0);
  column.querySelector(".count").textContent = cards.length;
  column.querySelector(".total").textContent = formatCurrency(total);
}

document.querySelectorAll(".deal-card").forEach((card) => {
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.dataset.dealId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => card.classList.add("dragging"), 0);
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
});

document.querySelectorAll(".column").forEach((column) => {
  const list = column.querySelector(".column-cards");

  column.addEventListener("dragover", (e) => {
    e.preventDefault();
    column.classList.add("drag-over");
  });

  column.addEventListener("dragleave", (e) => {
    if (!column.contains(e.relatedTarget)) column.classList.remove("drag-over");
  });

  column.addEventListener("drop", async (e) => {
    e.preventDefault();
    column.classList.remove("drag-over");

    const dealId = e.dataTransfer.getData("text/plain");
    const card = document.querySelector(`.deal-card[data-deal-id="${dealId}"]`);
    if (!card) return;

    const fromColumn = card.closest(".column");
    if (fromColumn === column) return;

    list.appendChild(card);
    updateColumnStats(fromColumn);
    updateColumnStats(column);

    try {
      const res = await fetch(`/deals/${dealId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: column.dataset.stage }),
      });
      if (!res.ok) throw new Error("request failed");
    } catch (err) {
      alert("Could not save the new stage. Reloading the board.");
      location.reload();
    }
  });
});
