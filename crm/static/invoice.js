function formatR(n) {
  return "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function recalcRow(row) {
  const qty = parseFloat(row.querySelector('[name="quantity"]').value) || 0;
  const price = parseFloat(row.querySelector('[name="unit_price"]').value) || 0;
  row.querySelector(".line-total").textContent = formatR(qty * price);
}

function recalcTotal() {
  let total = 0;
  document.querySelectorAll("#itemsTable .item-row").forEach((row) => {
    const qty = parseFloat(row.querySelector('[name="quantity"]').value) || 0;
    const price = parseFloat(row.querySelector('[name="unit_price"]').value) || 0;
    total += qty * price;
  });
  const totalEl = document.getElementById("totalDisplay");
  if (totalEl) totalEl.textContent = formatR(total);
}

function wireRow(row) {
  row.querySelectorAll('[name="quantity"], [name="unit_price"]').forEach((input) => {
    input.addEventListener("input", () => {
      recalcRow(row);
      recalcTotal();
    });
  });
  const removeBtn = row.querySelector(".remove-row");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      row.remove();
      recalcTotal();
    });
  }
  recalcRow(row);
}

document.querySelectorAll("#itemsTable .item-row").forEach(wireRow);
recalcTotal();

const addRowBtn = document.getElementById("addRow");
if (addRowBtn) {
  addRowBtn.addEventListener("click", () => {
    const tbody = document.querySelector("#itemsTable tbody");
    const row = document.createElement("tr");
    row.className = "item-row";
    row.innerHTML =
      '<td><input type="text" name="description" required></td>' +
      '<td><input type="number" name="quantity" value="1" step="0.01" min="0"></td>' +
      '<td><input type="number" name="unit_price" value="0" step="0.01" min="0"></td>' +
      '<td class="line-total">R0.00</td>' +
      '<td><button type="button" class="remove-row" aria-label="Remove line">✕</button></td>';
    tbody.appendChild(row);
    wireRow(row);
  });
}

// Auto-select the contact's linked company, if any, when a contact is chosen
const contactSelect = document.getElementById("contact_id");
const companySelect = document.getElementById("company_id");
if (contactSelect && companySelect) {
  contactSelect.addEventListener("change", () => {
    const opt = contactSelect.options[contactSelect.selectedIndex];
    const companyId = opt && opt.dataset.companyId;
    if (companyId && !companySelect.value) {
      companySelect.value = companyId;
    }
  });
}
