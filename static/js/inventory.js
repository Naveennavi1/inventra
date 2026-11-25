
// =============================================
// INVENTRA - INVENTORY MANAGEMENT
// =============================================

let inventoryData = [];
let productData = [];
let movementData = [];
let currentMovementType = "IN";


// =============================================
// API ERROR HANDLING
// =============================================

function getErrorMessage(error) {
    return error?.message || "Something went wrong. Please try again.";
}


// =============================================
// LOAD INVENTORY AND PRODUCTS
// =============================================

async function loadInventory() {

    const tbody = document.getElementById("inventoryTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                Loading inventory...
            </td>
        </tr>
    `;

    try {

        const [inventory, products] = await Promise.all([
            API.get("/inventory/"),
            API.get("/products/")
        ]);

        inventoryData = Array.isArray(inventory) ? inventory : [];
        productData = Array.isArray(products) ? products : [];

        updateStatistics();
        renderInventory();
        populateProductDropdown();

        await loadMovementHistory();

    } catch (error) {

        console.error("Inventory loading error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    Unable to load inventory.
                </td>
            </tr>
        `;

        showToast(getErrorMessage(error), "error");
    }
}


// =============================================
// UPDATE INVENTORY STATISTICS
// =============================================

function updateStatistics() {

    const totalTracked = inventoryData.length;

    const totalUnits = inventoryData.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    const lowStock = inventoryData.filter(item =>
        Number(item.quantity) > 0 &&
        Number(item.quantity) <= Number(item.reorder_level)
    ).length;

    const outOfStock = inventoryData.filter(
        item => Number(item.quantity) === 0
    ).length;

    document.getElementById("totalTracked").textContent = totalTracked;
    document.getElementById("totalUnits").textContent = totalUnits;
    document.getElementById("lowStockCount").textContent = lowStock;
    document.getElementById("outOfStockCount").textContent = outOfStock;
}


// =============================================
// GET PRODUCT NAME
// =============================================

function getProductName(productId) {

    const product = productData.find(
        p => Number(p.id) === Number(productId)
    );

    return product ? product.name : `Product #${productId}`;
}


// =============================================
// GET STOCK STATUS
// =============================================

function getStockStatus(item) {

    const quantity = Number(item.quantity);
    const reorderLevel = Number(item.reorder_level);

    if (quantity === 0) {
        return `<span class="badge bg-danger">Out of Stock</span>`;
    }

    if (quantity <= reorderLevel) {
        return `<span class="badge bg-warning text-dark">Low Stock</span>`;
    }

    return `<span class="badge bg-success">In Stock</span>`;
}


// =============================================
// FORMAT DATE AND TIME
// =============================================

function formatDate(dateValue) {

    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =============================================
// RENDER INVENTORY TABLE
// =============================================

function renderInventory(searchTerm = "") {

    const tbody = document.getElementById("inventoryTableBody");

    const filtered = inventoryData.filter(item => {

        const name = getProductName(item.product_id).toLowerCase();

        return name.includes(searchTerm.toLowerCase());
    });

    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No inventory records found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = filtered.map(item => {

        return `
            <tr>

                <td class="fw-semibold">
                    ${escapeHTML(getProductName(item.product_id))}
                </td>

                <td>${item.quantity}</td>

                <td>${item.reorder_level}</td>

                <td>${getStockStatus(item)}</td>

                <td>${formatDate(item.updated_at)}</td>

                <td>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        onclick="viewStockHistory(${item.product_id})">

                        <i class="bi bi-clock-history"></i>
                        History

                    </button>
                </td>

            </tr>
        `;

    }).join("");
}


// =============================================
// POPULATE PRODUCT DROPDOWN
// =============================================

function populateProductDropdown() {

    const select = document.getElementById("stockProduct");

    select.innerHTML = `
        <option value="">Select Product</option>
    `;

    productData.forEach(product => {

        const option = document.createElement("option");

        option.value = product.id;
        option.textContent = product.name;

        select.appendChild(option);
    });
}


// =============================================
// OPEN STOCK MOVEMENT MODAL
// =============================================

function openStockModal(type) {

    currentMovementType = type;

    document.getElementById("stockMovementForm").reset();

    document.getElementById("movementType").value = type;

    document.getElementById("stockModalTitle").textContent =
        type === "IN" ? "Stock In" : "Stock Out";

    const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("stockModal")
    );

    modal.show();
}


// =============================================
// SUBMIT STOCK MOVEMENT
// =============================================

document.getElementById("stockMovementForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const productId = document.getElementById("stockProduct").value;

        const quantity = Number(
            document.getElementById("stockQuantity").value
        );

        const note = document.getElementById("stockNote").value.trim();

        if (!productId || !Number.isInteger(quantity) || quantity <= 0) {

            showToast(
                "Select a product and enter a valid whole-number quantity.",
                "error"
            );

            return;
        }

        const button = this.querySelector('button[type="submit"]');

        button.disabled = true;

        try {

            const inventory = inventoryData.find(
                item => Number(item.product_id) === Number(productId)
            );

            // Initialize inventory if it does not exist
            if (!inventory) {

                await API.post(
                    `/inventory/${productId}/initialize`,
                    {}
                );
            }

            // Submit stock movement
            await API.post(
                `/inventory/${productId}/movement`,
                {
                    movement_type: currentMovementType,
                    quantity: quantity,
                    note: note || null
                }
            );

            const modal = bootstrap.Modal.getInstance(
                document.getElementById("stockModal")
            );

            if (modal) {
                modal.hide();
            }

            showToast("Stock updated successfully!", "success");

            await loadInventory();

        } catch (error) {

            console.error("Stock movement error:", error);

            showToast(getErrorMessage(error), "error");

        } finally {

            button.disabled = false;
        }
    }
);


// =============================================
// LOAD ALL STOCK MOVEMENT HISTORY
// =============================================

async function loadMovementHistory() {

    const tbody = document.getElementById("movementTableBody");

    try {

        const histories = await Promise.all(

            inventoryData.map(async item => {

                try {

                    return await API.get(
                        `/inventory/${item.product_id}/history`
                    );

                } catch (error) {

                    console.error(
                        `History loading failed for product ${item.product_id}`,
                        error
                    );

                    return [];
                }

            })
        );

        movementData = histories.flat();

        renderMovementHistory();

    } catch (error) {

        console.error("Movement history error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    Unable to load stock movements.
                </td>
            </tr>
        `;
    }
}


// =============================================
// RENDER RECENT MOVEMENT HISTORY
// =============================================

function renderMovementHistory() {

    const tbody = document.getElementById("movementTableBody");

    const recentMovements = [...movementData]
        .sort((a, b) => {

            return new Date(b.created_at || 0) -
                   new Date(a.created_at || 0);

        })
        .slice(0, 10);

    if (recentMovements.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No stock movements recorded yet.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = recentMovements.map(movement => {

        const isStockIn = movement.movement_type === "IN";

        const badge = isStockIn ? "bg-success" : "bg-danger";

        return `
            <tr>

                <td>
                    ${escapeHTML(getProductName(movement.product_id))}
                </td>

                <td>
                    <span class="badge ${badge}">
                        ${escapeHTML(movement.movement_type)}
                    </span>
                </td>

                <td>${Number(movement.quantity)}</td>

                <td>
                    ${escapeHTML(movement.note || "—")}
                </td>

                <td>
                    ${formatDate(movement.created_at)}
                </td>

            </tr>
        `;

    }).join("");
}


// =============================================
// VIEW PRODUCT STOCK HISTORY - BOOTSTRAP MODAL
// =============================================

async function viewStockHistory(productId) {

    const modalElement = document.getElementById("historyModal");

    const tbody = document.getElementById("historyTableBody");

    const productNameElement = document.getElementById(
        "historyProductName"
    );

    // Verify that the modal exists
    if (!modalElement || !tbody || !productNameElement) {

        console.error("Stock history modal elements are missing.");

        showToast(
            "Stock history modal is not configured correctly.",
            "error"
        );

        return;
    }

    // Check Bootstrap availability
    if (typeof bootstrap === "undefined" || !bootstrap.Modal) {

        console.error("Bootstrap JavaScript is not loaded.");

        showToast(
            "Bootstrap modal is unavailable.",
            "error"
        );

        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    productNameElement.textContent = getProductName(productId);

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                Loading history...
            </td>
        </tr>
    `;

    modal.show();

    try {

        const history = await API.get(
            `/inventory/${productId}/history`
        );

        if (!Array.isArray(history) || history.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        No stock movements recorded.
                    </td>
                </tr>
            `;

            return;
        }

        history.sort((a, b) => {

            return new Date(b.created_at || 0) -
                   new Date(a.created_at || 0);

        });

        tbody.innerHTML = history.map(item => {

            const isStockIn = item.movement_type === "IN";

            const badge = isStockIn
                ? "bg-success"
                : "bg-danger";

            const icon = isStockIn
                ? "bi-arrow-down-circle"
                : "bi-arrow-up-circle";

            const sign = isStockIn ? "+" : "-";

            return `
                <tr>

                    <td>
                        <span class="badge ${badge}">
                            <i class="bi ${icon} me-1"></i>
                            ${escapeHTML(item.movement_type)}
                        </span>
                    </td>

                    <td class="fw-bold ${isStockIn ? "text-success" : "text-danger"}">
                        ${sign}${Number(item.quantity)}
                    </td>

                    <td>
                        ${escapeHTML(item.note || "No description")}
                    </td>

                    <td>
                        ${formatDate(item.created_at)}
                    </td>

                </tr>
            `;

        }).join("");

    } catch (error) {

        console.error("Stock history API error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    Unable to load stock history.
                    <br>
                    <small>${escapeHTML(getErrorMessage(error))}</small>
                </td>
            </tr>
        `;
    }
}


// =============================================
// SEARCH INVENTORY
// =============================================

document.getElementById("inventorySearch").addEventListener(
    "input",
    function() {

        renderInventory(this.value);

    }
);


// =============================================
// HTML ESCAPING
// =============================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[char]);
}


// =============================================
// INITIALIZE INVENTORY PAGE
// =============================================

document.addEventListener("DOMContentLoaded", function() {

    console.log("Inventra Inventory module initialized.");

    loadInventory();

});
