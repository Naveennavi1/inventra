let expiryRecords = [];


document.addEventListener("DOMContentLoaded", () => {

    loadExpiryData();

    document.getElementById("expiryDays")
        .addEventListener("change", loadExpiryRecords);

    document.getElementById("expiryStatus")
        .addEventListener("change", renderExpiryTable);

    document.getElementById("expirySearch")
        .addEventListener("input", renderExpiryTable);

});


// Load summary and expiry records
async function loadExpiryData() {

    await Promise.all([
        loadExpirySummary(),
        loadExpiryRecords()
    ]);

}


// Load summary cards
async function loadExpirySummary() {

    try {

        const data = await API.get("/expiry/summary");

        document.getElementById("totalAtRisk").textContent =
            data.total_batches_at_risk ?? 0;

        document.getElementById("expiredCount").textContent =
            data.expired_batches ?? 0;

        document.getElementById("criticalCount").textContent =
            data.critical_batches ?? 0;

        document.getElementById("nearExpiryCount").textContent =
            data.near_expiry_batches ?? 0;

        document.getElementById("stockValueRisk").textContent =
            formatCurrency(data.total_stock_value_at_risk);

    } catch (error) {

        console.error("Expiry summary error:", error);

    }

}


// Load expiry records
async function loadExpiryRecords() {

    const tbody = document.getElementById("expiryTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading expiry records...
            </td>
        </tr>
    `;

    try {

        const days = document.getElementById("expiryDays").value;

        const data = await API.get(`/expiry/?days=${days}`);

        expiryRecords = Array.isArray(data) ? data : [];

        renderExpiryTable();

    } catch (error) {

        console.error("Expiry records error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// Render expiry table
function renderExpiryTable() {

    const tbody = document.getElementById("expiryTableBody");

    const search = document.getElementById("expirySearch")
        .value.toLowerCase().trim();

    const selectedStatus = document.getElementById("expiryStatus").value;


    const filtered = expiryRecords.filter(item => {

        const matchesSearch =
            String(item.product_name || "").toLowerCase().includes(search) ||
            String(item.batch_number || "").toLowerCase().includes(search) ||
            String(item.product_id).includes(search);

        const matchesStatus =
            selectedStatus === "ALL" ||
            item.status === selectedStatus;

        return matchesSearch && matchesStatus;

    });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-check-circle fs-2 d-block mb-2"></i>
                    No expiry records found.
                </td>
            </tr>
        `;

        document.getElementById("expiryCount").textContent =
            "0 batches found";

        return;

    }


    tbody.innerHTML = filtered.map(item => {

        let remaining;

        if (item.days_remaining < 0) {

            remaining = `
                <span class="text-danger fw-semibold">
                    Expired ${Math.abs(item.days_remaining)} days ago
                </span>
            `;

        } else if (item.days_remaining === 0) {

            remaining = `
                <span class="text-danger fw-semibold">
                    Today
                </span>
            `;

        } else {

            remaining = `
                <span class="fw-semibold">
                    ${item.days_remaining} days
                </span>
            `;

        }


        return `
            <tr>

                <td>
                    <div class="fw-semibold">
                        ${escapeHTML(item.product_name)}
                    </div>

                    <small class="text-muted">
                        Product ID: #${item.product_id}
                    </small>
                </td>

                <td>
                    <span class="fw-semibold">
                        ${escapeHTML(item.batch_number)}
                    </span>
                </td>

                <td>${item.quantity}</td>

                <td>${formatDate(item.expiry_date)}</td>

                <td>${remaining}</td>

                <td class="fw-semibold text-danger">
                    ${formatCurrency(item.stock_value)}
                </td>

                <td>
                    ${getExpiryBadge(item.status)}
                </td>

            </tr>
        `;

    }).join("");


    document.getElementById("expiryCount").textContent =
        `${filtered.length} batches found`;

}


// Status badges
function getExpiryBadge(status) {

    const badges = {

        EXPIRED: `
            <span class="badge bg-danger">Expired</span>
        `,

        EXPIRES_TODAY: `
            <span class="badge bg-danger">Expires Today</span>
        `,

        CRITICAL: `
            <span class="badge bg-warning text-dark">Critical</span>
        `,

        NEAR_EXPIRY: `
            <span class="badge bg-info text-dark">Near Expiry</span>
        `

    };

    return badges[status] || `
        <span class="badge bg-secondary">
            ${escapeHTML(status)}
        </span>
    `;

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

    const parts = String(value).split("-");

    if (parts.length !== 3) return escapeHTML(value);

    return `${parts[2]}-${parts[1]}-${parts[0]}`;

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