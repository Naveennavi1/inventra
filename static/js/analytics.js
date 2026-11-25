let dailyChart = null;
let monthlyChart = null;


document.addEventListener("DOMContentLoaded", () => {

    loadAnalytics();

});


async function loadAnalytics() {

    await Promise.all([
        loadSalesSummary(),
        loadDailySales(),
        loadMonthlySales(),
        loadBestSellingProducts()
    ]);

}


// ------------------------------------
// SALES SUMMARY
// ------------------------------------

async function loadSalesSummary() {

    try {

        const data = await API.get("/analytics/summary");

        document.getElementById("totalSales").textContent =
            Number(data.total_sales || 0).toLocaleString("en-IN");

        document.getElementById("totalRevenue").textContent =
            formatCurrency(data.total_revenue);

        document.getElementById("averageOrder").textContent =
            formatCurrency(data.average_order_value);

    } catch (error) {

        console.error("Sales summary error:", error);

    }

}


// ------------------------------------
// DAILY SALES CHART
// ------------------------------------

async function loadDailySales() {

    try {

        const data = await API.get("/analytics/daily");

        const records = Array.isArray(data) ? data : [];

        // API returns newest first. Reverse for chronological chart.
        const sorted = [...records].reverse();

        const labels = sorted.map(item => formatDate(item.date));

        const revenues = sorted.map(item => Number(item.revenue || 0));

        const sales = sorted.map(item => Number(item.total_sales || 0));

        const ctx = document.getElementById("dailySalesChart");

        if (dailyChart) {
            dailyChart.destroy();
        }

        dailyChart = new Chart(ctx, {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Revenue (₹)",
                        data: revenues,
                        borderWidth: 3,
                        tension: 0.35,
                        fill: true,
                        yAxisID: "y"
                    },

                    {
                        label: "Number of Sales",
                        data: sales,
                        borderWidth: 2,
                        tension: 0.35,
                        yAxisID: "y1"
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: {
                        position: "top"
                    }
                },

                scales: {

                    y: {
                        beginAtZero: true,
                        position: "left",
                        title: {
                            display: true,
                            text: "Revenue (₹)"
                        }
                    },

                    y1: {
                        beginAtZero: true,
                        position: "right",
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: "Sales Count"
                        }
                    }

                }

            }

        });

    } catch (error) {

        console.error("Daily sales error:", error);

    }

}


// ------------------------------------
// MONTHLY SALES CHART
// ------------------------------------

async function loadMonthlySales() {

    try {

        const data = await API.get("/analytics/monthly");

        const records = Array.isArray(data) ? data : [];

        const sorted = [...records].reverse();

        const labels = sorted.map(item =>
            getMonthName(item.month) + " " + item.year
        );

        const revenues = sorted.map(item =>
            Number(item.revenue || 0)
        );

        const sales = sorted.map(item =>
            Number(item.total_sales || 0)
        );

        const ctx = document.getElementById("monthlySalesChart");

        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: "Revenue (₹)",
                        data: revenues,
                        borderWidth: 1,
                        yAxisID: "y"
                    },

                    {
                        label: "Number of Sales",
                        data: sales,
                        type: "line",
                        tension: 0.3,
                        borderWidth: 2,
                        yAxisID: "y1"
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "top"
                    }
                },

                scales: {

                    y: {
                        beginAtZero: true,
                        position: "left",
                        title: {
                            display: true,
                            text: "Revenue (₹)"
                        }
                    },

                    y1: {
                        beginAtZero: true,
                        position: "right",
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: "Sales Count"
                        }
                    }

                }

            }

        });

    } catch (error) {

        console.error("Monthly sales error:", error);

    }

}


// ------------------------------------
// BEST-SELLING PRODUCTS
// ------------------------------------

async function loadBestSellingProducts() {

    const tbody = document.getElementById("bestSellingTableBody");

    try {

        const data = await API.get(
            "/analytics/best-selling-products"
        );

        const products = Array.isArray(data) ? data : [];

        if (products.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-5">
                        No sales data available.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML = products.map((product, index) => {

            return `

                <tr>

                    <td>
                        <span class="badge bg-primary">
                            #${index + 1}
                        </span>
                    </td>

                    <td>
                        <div class="fw-semibold">
                            ${escapeHTML(product.product_name)}
                        </div>

                        <small class="text-muted">
                            Product ID: ${product.product_id}
                        </small>
                    </td>

                    <td class="fw-semibold">
                        ${Number(product.units_sold || 0).toLocaleString("en-IN")}
                    </td>

                    <td class="fw-semibold text-success">
                        ${formatCurrency(product.total_revenue)}
                    </td>

                </tr>

            `;

        }).join("");


    } catch (error) {

        console.error("Best-selling products error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// ------------------------------------
// HELPER FUNCTIONS
// ------------------------------------

function formatCurrency(value) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2

    }).format(Number(value) || 0);

}


function formatDate(value) {

    if (!value) return "";

    const parts = String(value).split("-");

    if (parts.length !== 3) return value;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


function getMonthName(month) {

    return new Date(2000, month - 1, 1)
        .toLocaleString("en-IN", { month: "short" });

}


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