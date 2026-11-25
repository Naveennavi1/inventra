let salesChartInstance = null;


// ------------------------------------
// HELPERS
// ------------------------------------

const money = value =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));


const numberFormat = value =>
    Number(value || 0).toLocaleString("en-IN");


function escapeHtml(value) {

    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

}


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


async function safeGet(endpoint) {

    try {

        return await API.get(endpoint);

    } catch (error) {

        console.error(`${endpoint}:`, error);

        return null;

    }

}


// ------------------------------------
// DASHBOARD INITIALIZATION
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    const date = document.getElementById("todayDate");

    if (date) {

        date.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }

    await Promise.all([

        loadBusinessSummary(),

        loadLowStock(),

        loadBestSellers(),

        loadMonthlySales(),

        loadReorderInsights(),

        loadDeadStockInsights(),

        loadExpiryInsights()

    ]);

});


// ------------------------------------
// BUSINESS SUMMARY
// ------------------------------------

async function loadBusinessSummary() {

    const [summary, products] = await Promise.all([

        safeGet("/analytics/summary"),

        safeGet("/products/")

    ]);


    if (summary) {

        setText(
            "totalRevenue",
            money(summary.total_revenue)
        );

        setText(
            "totalSales",
            numberFormat(summary.total_sales)
        );

    }


    if (Array.isArray(products)) {

        setText(
            "totalProducts",
            numberFormat(products.length)
        );

    }

}


// ------------------------------------
// LOW STOCK
// ------------------------------------

async function loadLowStock() {

    const rows = await safeGet("/inventory/low-stock");

    const body = document.getElementById("lowStockTable");


    if (!Array.isArray(rows)) {

        setText("lowStockCount", "—");

        if (body) {

            body.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center muted py-4">
                        Unable to load low-stock data.
                    </td>
                </tr>
            `;

        }

        return;

    }


    setText("lowStockCount", numberFormat(rows.length));


    if (!body) return;


    if (rows.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 muted">
                    No low-stock products. Great work!
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML = rows.slice(0, 7).map(row => `

        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        row.product_name ||
                        row.name ||
                        `Product #${row.product_id}`
                    )}
                </strong>
            </td>

            <td>
                ${row.quantity ?? row.current_stock ?? 0}
            </td>

            <td>
                ${row.reorder_level ?? "—"}
            </td>

            <td>
                <span class="status-pill status-low">
                    <i class="bi bi-exclamation-circle"></i>
                    Reorder needed
                </span>
            </td>

        </tr>

    `).join("");

}


// ------------------------------------
// BEST SELLING PRODUCTS
// ------------------------------------

async function loadBestSellers() {

    const rows = await safeGet(
        "/analytics/best-selling-products"
    );

    const target = document.getElementById("topProducts");

    if (!target) return;


    if (!Array.isArray(rows)) {

        target.innerHTML = `
            <p class="muted">
                Unable to load product insights.
            </p>
        `;

        return;

    }


    if (rows.length === 0) {

        target.innerHTML = `
            <p class="muted">
                Sales data will appear here after transactions are recorded.
            </p>
        `;

        return;

    }


    target.innerHTML = rows.slice(0, 5).map((product, index) => `

        <div class="top-product">

            <div class="product-rank">
                ${index + 1}
            </div>

            <div class="top-product-info">

                <strong>
                    ${escapeHtml(product.product_name)}
                </strong>

                <small>
                    ${numberFormat(product.units_sold)} units sold
                </small>

            </div>

            <div class="top-product-value">
                ${money(product.total_revenue)}
            </div>

        </div>

    `).join("");

}


// ------------------------------------
// MONTHLY SALES CHART
// ------------------------------------

async function loadMonthlySales() {

    const rows = await safeGet("/analytics/monthly");

    const empty = document.getElementById("salesChartEmpty");

    const canvas = document.getElementById("salesChart");

    if (!canvas) return;


    if (!Array.isArray(rows) || rows.length === 0) {

        if (empty) empty.style.display = "flex";

        return;

    }


    if (empty) empty.style.display = "none";


    // API returns newest first. Reverse to display chronologically.
    const sorted = [...rows].reverse();


    const labels = sorted.map(item =>
        `${String(item.month).padStart(2, "0")}/${item.year}`
    );


    const values = sorted.map(item =>
        Number(item.revenue || 0)
    );


    if (salesChartInstance) {
        salesChartInstance.destroy();
    }


    salesChartInstance = new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Monthly Revenue",

                data: values,

                borderColor: "#dc3c86",

                backgroundColor: "rgba(220,60,134,.12)",

                fill: true,

                tension: 0.38,

                borderWidth: 3,

                pointRadius: 3,

                pointBackgroundColor: "#dc3c86"

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    callbacks: {

                        label: context =>
                            money(context.raw)

                    }

                }

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    ticks: {
                        color: "#927e8c",
                        font: {
                            size: 10
                        }
                    }

                },

                y: {

                    beginAtZero: true,

                    grid: {
                        color: "#f3e8ef"
                    },

                    ticks: {

                        color: "#927e8c",

                        callback: value =>
                            money(value)

                    }

                }

            }

        }

    });

}


// ------------------------------------
// REORDER INSIGHTS
// ------------------------------------

async function loadReorderInsights() {

    const data = await safeGet("/reorder/summary");

    if (!data) {

        setText("reorderCount", "—");
        setText("criticalStock", "—");
        setText("recommendedUnits", "—");

        return;

    }


    setText(
        "reorderCount",
        numberFormat(data.total_products_to_reorder)
    );

    setText(
        "criticalStock",
        numberFormat(data.critical_products)
    );

    setText(
        "recommendedUnits",
        numberFormat(data.total_recommended_units)
    );

}


// ------------------------------------
// DEAD STOCK INSIGHTS
// ------------------------------------

async function loadDeadStockInsights() {

    const data = await safeGet("/dead-stock/summary");

    if (!data) {

        setText("deadStockValue", "—");

        return;

    }


    setText(
        "deadStockValue",
        money(data.total_stock_value)
    );

}


// ------------------------------------
// EXPIRY INSIGHTS
// ------------------------------------

async function loadExpiryInsights() {

    const data = await safeGet("/expiry/summary");

    if (!data) {

        setText("batchesAtRisk", "—");
        setText("expiredBatches", "—");
        setText("criticalExpiry", "—");
        setText("expiryValue", "—");

        return;

    }


    setText(
        "batchesAtRisk",
        numberFormat(data.total_batches_at_risk)
    );

    setText(
        "expiredBatches",
        numberFormat(data.expired_batches)
    );

    setText(
        "criticalExpiry",
        numberFormat(data.critical_batches)
    );

    setText(
        "expiryValue",
        money(data.total_stock_value_at_risk)
    );

}