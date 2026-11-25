let purchases = [];
let suppliers = [];
let products = [];

let purchaseModalInstance = null;
let purchaseDetailsModalInstance = null;


// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    purchaseModalInstance = new bootstrap.Modal(
        document.getElementById("purchaseModal")
    );

    purchaseDetailsModalInstance = new bootstrap.Modal(
        document.getElementById("purchaseDetailsModal")
    );

    document.getElementById("purchaseForm").addEventListener(
        "submit",
        savePurchase
    );

    document.getElementById("purchaseSearch").addEventListener(
        "input",
        renderPurchases
    );

    initializePurchases();

});


// ========================================
// INITIALIZE DATA
// ========================================

async function initializePurchases() {

    try {

        await Promise.all([
            loadSuppliersForPurchase(),
            loadProductsForPurchase(),
            loadPurchases()
        ]);

    } catch (error) {

        console.error("Purchase initialization error:", error);

    }

}


// ========================================
// LOAD SUPPLIERS
// ========================================

async function loadSuppliersForPurchase() {

    try {

        const data = await API.get("/suppliers/");

        suppliers = Array.isArray(data) ? data : [];

        const select = document.getElementById("purchaseSupplier");

        select.innerHTML = `
            <option value="">Select a supplier</option>
        `;

        suppliers.forEach(supplier => {

            select.innerHTML += `
                <option value="${supplier.id}">
                    ${escapeHTML(supplier.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error("Supplier loading error:", error);

        alert("Unable to load suppliers.");

    }

}


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProductsForPurchase() {

    try {

        const data = await API.get("/products/");

        products = Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Product loading error:", error);

        alert("Unable to load products.");

    }

}


// ========================================
// LOAD PURCHASE HISTORY
// ========================================

async function loadPurchases() {

    const tableBody = document.getElementById("purchaseTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading purchases...
            </td>
        </tr>
    `;

    try {

        const data = await API.get("/purchases/");

        purchases = Array.isArray(data) ? data : [];

        updatePurchaseStats();

        renderPurchases();

    } catch (error) {

        console.error("Purchase loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// ========================================
// UPDATE STATISTICS
// ========================================

function updatePurchaseStats() {

    const totalPurchases = purchases.length;

    const totalValue = purchases.reduce(
        (sum, purchase) => sum + Number(purchase.total_amount || 0),
        0
    );

    const totalItems = purchases.reduce(
        (sum, purchase) => {

            return sum + (purchase.items || []).reduce(
                (itemSum, item) => itemSum + Number(item.quantity || 0),
                0
            );

        },
        0
    );

    document.getElementById("totalPurchases").textContent =
        totalPurchases;

    document.getElementById("totalPurchaseValue").textContent =
        formatCurrency(totalValue);

    document.getElementById("totalPurchasedItems").textContent =
        totalItems;

}


// ========================================
// DISPLAY PURCHASES
// ========================================

function renderPurchases() {

    const tableBody = document.getElementById("purchaseTableBody");

    const searchValue = document
        .getElementById("purchaseSearch")
        .value
        .toLowerCase()
        .trim();

    const filteredPurchases = purchases.filter(purchase => {

        const supplier = getSupplierName(purchase.supplier_id);

        return (
            String(purchase.id).includes(searchValue) ||
            supplier.toLowerCase().includes(searchValue)
        );

    });

    if (filteredPurchases.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No purchases found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML = filteredPurchases.map(purchase => {

        const itemCount = (purchase.items || []).length;

        const statusClass =
            purchase.status === "RECEIVED"
                ? "bg-success"
                : "bg-warning text-dark";

        return `
            <tr>

                <td class="ps-4 fw-semibold">
                    #PUR-${purchase.id}
                </td>

                <td>
                    ${escapeHTML(getSupplierName(purchase.supplier_id))}
                </td>

                <td>
                    ${formatDate(purchase.purchase_date)}
                </td>

                <td>
                    <span class="badge bg-light text-dark">
                        ${itemCount} products
                    </span>
                </td>

                <td class="fw-semibold">
                    ${formatCurrency(purchase.total_amount)}
                </td>

                <td>
                    <span class="badge ${statusClass}">
                        ${escapeHTML(purchase.status)}
                    </span>
                </td>

                <td class="text-end pe-4">

                    <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="viewPurchaseDetails(${purchase.id})"
                        title="View Details">

                        <i class="bi bi-eye"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ========================================
// OPEN PURCHASE MODAL
// ========================================

function openPurchaseModal() {

    if (suppliers.length === 0) {

        alert("Please add a supplier before recording a purchase.");

        return;

    }

    if (products.length === 0) {

        alert("Please add products before recording a purchase.");

        return;

    }

    document.getElementById("purchaseForm").reset();

    document.getElementById("purchaseItemsBody").innerHTML = "";

    document.getElementById("purchaseGrandTotal").textContent = "0.00";

    addPurchaseItem();

    purchaseModalInstance.show();

}


// ========================================
// ADD PURCHASE ITEM ROW
// ========================================

function addPurchaseItem() {

    const tableBody = document.getElementById("purchaseItemsBody");

    const row = document.createElement("tr");

    const productOptions = products.map(product => {

        const productName = product.name || product.product_name || `Product #${product.id}`;

        return `
            <option value="${product.id}">
                ${escapeHTML(productName)}
            </option>
        `;

    }).join("");

    row.innerHTML = `

        <td>

            <select class="form-select purchase-product" required>

                <option value="">Select Product</option>

                ${productOptions}

            </select>

        </td>

        <td>

            <input
                type="number"
                class="form-control purchase-quantity"
                min="1"
                step="1"
                value="1"
                required
            >

        </td>

        <td>

            <input
                type="number"
                class="form-control purchase-price"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
            >

        </td>

        <td>

            <span class="fw-semibold purchase-subtotal">
                ₹0.00
            </span>

        </td>

        <td>

            <button
                type="button"
                class="btn btn-sm btn-outline-danger remove-purchase-item"
                title="Remove item">

                <i class="bi bi-trash"></i>

            </button>

        </td>

    `;

    tableBody.appendChild(row);

    const quantityInput = row.querySelector(".purchase-quantity");

    const priceInput = row.querySelector(".purchase-price");

    quantityInput.addEventListener("input", calculatePurchaseTotal);

    priceInput.addEventListener("input", calculatePurchaseTotal);

    row.querySelector(".remove-purchase-item").addEventListener(
        "click",
        function () {

            row.remove();

            calculatePurchaseTotal();

        }
    );

    calculatePurchaseTotal();

}


// ========================================
// CALCULATE TOTAL
// ========================================

function calculatePurchaseTotal() {

    const rows = document.querySelectorAll("#purchaseItemsBody tr");

    let grandTotal = 0;

    rows.forEach(row => {

        const quantity = Number(
            row.querySelector(".purchase-quantity").value
        );

        const price = Number(
            row.querySelector(".purchase-price").value
        );

        const subtotal = quantity * price;

        row.querySelector(".purchase-subtotal").textContent =
            formatCurrency(subtotal);

        grandTotal += subtotal;

    });

    document.getElementById("purchaseGrandTotal").textContent =
        grandTotal.toFixed(2);

}


// ========================================
// SAVE PURCHASE
// ========================================

async function savePurchase(event) {

    event.preventDefault();

    const supplierId = Number(
        document.getElementById("purchaseSupplier").value
    );

    if (!supplierId) {

        alert("Please select a supplier.");

        return;

    }

    const rows = document.querySelectorAll("#purchaseItemsBody tr");

    if (rows.length === 0) {

        alert("Please add at least one product.");

        return;

    }

    const items = [];

    const selectedProducts = new Set();

    for (const row of rows) {

        const productId = Number(
            row.querySelector(".purchase-product").value
        );

        const quantity = Number(
            row.querySelector(".purchase-quantity").value
        );

        const unitPrice = Number(
            row.querySelector(".purchase-price").value
        );

        if (!productId || !Number.isInteger(quantity) || quantity <= 0 ||
            !Number.isFinite(unitPrice) || unitPrice <= 0) {

            alert("Please enter valid product, quantity and purchase price details.");

            return;

        }

        if (selectedProducts.has(productId)) {

            alert("A product can only appear once in a purchase. Please combine its quantities.");

            return;

        }

        selectedProducts.add(productId);

        items.push({
            product_id: productId,
            quantity: quantity,
            unit_price: unitPrice
        });

    }

    const purchaseData = {
        supplier_id: supplierId,
        items: items
    };

    const saveButton = document.getElementById("savePurchaseBtn");

    saveButton.disabled = true;

    saveButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Recording...
    `;

    try {

        const result = await API.post(
            "/purchases/",
            purchaseData
        );

        purchaseModalInstance.hide();

        await loadPurchases();

        alert(
            `Purchase #${result.id} recorded successfully!\nInventory has been updated.`
        );

    } catch (error) {

        console.error("Purchase creation error:", error);

        alert(error.message);

    } finally {

        saveButton.disabled = false;

        saveButton.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            Record Purchase
        `;

    }

}


// ========================================
// VIEW PURCHASE DETAILS
// ========================================

async function viewPurchaseDetails(purchaseId) {

    const content = document.getElementById("purchaseDetailsContent");

    content.innerHTML = `
        <div class="text-center py-4">
            Loading purchase details...
        </div>
    `;

    purchaseDetailsModalInstance.show();

    try {

        const purchase = await API.get(
            `/purchases/${purchaseId}`
        );

        const itemsHTML = (purchase.items || []).map(item => {

            const product = products.find(
                product => product.id === item.product_id
            );

            const productName = product
                ? (product.name || product.product_name)
                : `Product #${item.product_id}`;

            return `
                <tr>

                    <td>${escapeHTML(productName)}</td>

                    <td>${item.quantity}</td>

                    <td>${formatCurrency(item.unit_price)}</td>

                    <td>${formatCurrency(item.subtotal)}</td>

                </tr>
            `;

        }).join("");

        content.innerHTML = `

            <div class="row mb-4">

                <div class="col-md-6 mb-3">
                    <small class="text-muted">Purchase ID</small>
                    <h6 class="fw-bold">#PUR-${purchase.id}</h6>
                </div>

                <div class="col-md-6 mb-3">
                    <small class="text-muted">Supplier</small>
                    <h6 class="fw-bold">
                        ${escapeHTML(getSupplierName(purchase.supplier_id))}
                    </h6>
                </div>

                <div class="col-md-6 mb-3">
                    <small class="text-muted">Purchase Date</small>
                    <h6 class="fw-bold">
                        ${formatDate(purchase.purchase_date)}
                    </h6>
                </div>

                <div class="col-md-6 mb-3">
                    <small class="text-muted">Status</small>
                    <h6 class="fw-bold">
                        ${escapeHTML(purchase.status)}
                    </h6>
                </div>

            </div>

            <h6 class="fw-bold mb-3">Purchased Products</h6>

            <div class="table-responsive">

                <table class="table table-bordered align-middle">

                    <thead class="table-light">
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${itemsHTML}
                    </tbody>

                </table>

            </div>

            <div class="text-end mt-3">

                <h5 class="fw-bold text-primary">
                    Grand Total: ${formatCurrency(purchase.total_amount)}
                </h5>

            </div>

        `;

    } catch (error) {

        console.error("Purchase details error:", error);

        content.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHTML(error.message)}
            </div>
        `;

    }

}


// ========================================
// GET SUPPLIER NAME
// ========================================

function getSupplierName(supplierId) {

    const supplier = suppliers.find(
        item => item.id === supplierId
    );

    return supplier ? supplier.name : `Supplier #${supplierId}`;

}


// ========================================
// FORMAT CURRENCY
// ========================================

function formatCurrency(value) {

    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateValue) {

    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// ========================================
// HTML ESCAPE
// ========================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];

    });

}