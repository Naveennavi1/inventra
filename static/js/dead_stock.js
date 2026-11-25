let deadStockProducts = [];
let slowMovingProducts = [];

document.addEventListener("DOMContentLoaded", () => {

    loadDeadStockData();

    document.getElementById("deadDays")
        .addEventListener("change", loadDeadProducts);

    document.getElementById("slowDays")
        .addEventListener("change", loadSlowMovingProducts);

    document.getElementById("deadSearch")
        .addEventListener("input", renderDeadStockTable);

    document.getElementById("slowSearch")
        .addEventListener("input", renderSlowMovingTable);

});


// Load all dashboard data
async function loadDeadStockData() {

    await Promise.all([
        loadDeadStockSummary(),
        loadDeadProducts(),
        loadSlowMovingProducts()
    ]);

}


// Load summary cards
async function loadDeadStockSummary() {

    try {

        const data = await API.get("/dead-stock/summary");

        document.getElementById("totalDeadProducts").textContent =
            data.total_dead_stock_products ?? 0;

        document.getElementById("totalDeadUnits").textContent =
            data.total_stock_units ?? 0;

        document.getElementById("totalDeadValue").textContent =
            formatCurrency(data.total_stock_value);

    } catch (error) {

        console.error("Dead stock summary error:", error);

    }

}


// Load dead stock products
async function loadDeadProducts() {

    const tbody = document.getElementById("deadStockTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                Loading dead stock products...
            </td>
        </tr>
    `;

    try {

        const days = document.getElementById("deadDays").value;

        const data = await API.get(
            `/dead-stock/?days=${days}`
        );

        deadStockProducts = Array.isArray(data) ? data : [];

        renderDeadStockTable();

    } catch (error) {

        console.error("Dead stock loading error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// Load slow-moving products
async function loadSlowMovingProducts() {

    const tbody = document.getElementById("slowMovingTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                Loading slow-moving products...
            </td>
        </tr>
    `;

    try {

        const days = document.getElementById("slowDays").value;

        const data = await API.get(
            `/dead-stock/slow-moving?days=${days}`
        );

        slowMovingProducts = Array.isArray(data) ? data : [];

        renderSlowMovingTable();

    } catch (error) {

        console.error("Slow-moving products error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// Render dead stock table
function renderDeadStockTable() {

    const tbody = document.getElementById("deadStockTableBody");

    const search = document.getElementById("deadSearch")
        .value.toLowerCase().trim();

    const filtered = deadStockProducts.filter(item =>
        String(item.product_name || "").toLowerCase().includes(search) ||
        String(item.product_id).includes(search)
    );


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="bi bi-check-circle fs-2 d-block mb-2"></i>
                    No dead stock products found.
                </td>
            </tr>
        `;

        document.getElementById("deadStockCount").textContent =
            "0 products found";

        return;

    }


    tbody.innerHTML = filtered.map(item => {

        const neverSold =
            item.last_sale_date === "Never sold";

        const lastSale = neverSold
            ? "Never sold"
            : formatDate(item.last_sale_date);

        const inactiveDays = item.days_since_last_sale == null
            ? "N/A"
            : `${item.days_since_last_sale} days`;

        return `
            <tr>

                <td>
                    <div class="fw-semibold">
                        ${escapeHTML(item.product_name)}
                    </div>
                    <small class="text-muted">
                        ID: #${item.product_id}
                    </small>
                </td>

                <td>
                    <span class="fw-bold">
                        ${item.current_stock}
                    </span>
                </td>

                <td>
                    ${escapeHTML(lastSale)}
                </td>

                <td>
                    ${inactiveDays}
                </td>

                <td class="fw-semibold text-danger">
                    ${formatCurrency(item.stock_value)}
                </td>

                <td>
                    ${
                        neverSold
                            ? '<span class="badge bg-danger">Never Sold</span>'
                            : '<span class="badge bg-warning text-dark">Inactive</span>'
                    }
                </td>

            </tr>
        `;

    }).join("");


    document.getElementById("deadStockCount").textContent =
        `${filtered.length} products found`;

}


// Render slow-moving products
function renderSlowMovingTable() {

    const tbody = document.getElementById("slowMovingTableBody");

    const search = document.getElementById("slowSearch")
        .value.toLowerCase().trim();

    const filtered = slowMovingProducts.filter(item =>
        String(item.product_name || "").toLowerCase().includes(search) ||
        String(item.product_id).includes(search)
    );


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-5">
                    <i class="bi bi-check-circle fs-2 d-block mb-2"></i>
                    No slow-moving products found.
                </td>
            </tr>
        `;

        document.getElementById("slowMovingCount").textContent =
            "0 products found";

        return;

    }


    tbody.innerHTML = filtered.map(item => {

        return `
            <tr>

                <td>
                    <div class="fw-semibold">
                        ${escapeHTML(item.product_name)}
                    </div>
                    <small class="text-muted">
                        ID: #${item.product_id}
                    </small>
                </td>

                <td>
                    <span class="fw-bold">
                        ${item.current_stock}
                    </span>
                </td>

                <td>
                    <span class="badge bg-warning text-dark">
                        ${item.days_since_last_sale} days
                    </span>
                </td>

                <td class="fw-semibold text-danger">
                    ${formatCurrency(item.stock_value)}
                </td>

                <td>
                    <span class="badge bg-warning text-dark">
                        Slow Moving
                    </span>
                </td>

            </tr>
        `;

    }).join("");


    document.getElementById("slowMovingCount").textContent =
        `${filtered.length} products found`;

}


// Currency formatting
function formatCurrency(value) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

}


// Date formatting
function formatDate(value) {

    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// HTML escaping
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];

    });

}