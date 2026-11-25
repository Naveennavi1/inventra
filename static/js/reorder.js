let reorderRecommendations = [];


document.addEventListener("DOMContentLoaded", () => {

    loadReorderData();

    document.getElementById("reorderSearch")
        .addEventListener("input", renderReorderTable);

    document.getElementById("priorityFilter")
        .addEventListener("change", renderReorderTable);

});


async function loadReorderData() {

    const tableBody = document.getElementById("reorderTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                Loading recommendations...
            </td>
        </tr>
    `;

    try {

        const [summary, recommendations] = await Promise.all([

            API.get("/reorder/summary"),

            API.get("/reorder/recommendations")

        ]);

        reorderRecommendations = Array.isArray(recommendations)
            ? recommendations
            : [];

        updateSummary(summary);

        renderReorderTable();

    } catch (error) {

        console.error("Reorder loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    Failed to load reorder recommendations.
                    <br>
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// Update summary cards
function updateSummary(data) {

    document.getElementById("totalReorder").textContent =
        data.total_products_to_reorder ?? 0;

    document.getElementById("criticalProducts").textContent =
        data.critical_products ?? 0;

    document.getElementById("highProducts").textContent =
        data.high_priority_products ?? 0;

    document.getElementById("mediumProducts").textContent =
        data.medium_priority_products ?? 0;

    document.getElementById("totalUnits").textContent =
        data.total_recommended_units ?? 0;

}


// Display reorder recommendations
function renderReorderTable() {

    const tableBody = document.getElementById("reorderTableBody");

    const searchValue = document
        .getElementById("reorderSearch")
        .value
        .toLowerCase()
        .trim();

    const priorityValue = document
        .getElementById("priorityFilter")
        .value;

    const filtered = reorderRecommendations.filter(item => {

        const matchesSearch =
            item.product_name.toLowerCase().includes(searchValue) ||
            String(item.product_id).includes(searchValue);

        const matchesPriority =
            priorityValue === "ALL" ||
            item.priority === priorityValue;

        return matchesSearch && matchesPriority;

    });


    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="bi bi-check-circle fs-2 d-block mb-2"></i>
                    No reorder recommendations found.
                </td>
            </tr>
        `;

        document.getElementById("reorderCount").textContent =
            "0 products found";

        return;

    }


    tableBody.innerHTML = filtered.map(item => {

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
                    <span class="fw-bold ${
                        item.current_stock === 0
                            ? "text-danger"
                            : "text-dark"
                    }">
                        ${item.current_stock}
                    </span>
                </td>

                <td>${item.reorder_level}</td>

                <td>${item.target_stock}</td>

                <td>
                    <span class="fw-bold text-success">
                        +${item.recommended_quantity}
                    </span>
                </td>

                <td>
                    ${getPriorityBadge(item.priority)}
                </td>

            </tr>
        `;

    }).join("");


    document.getElementById("reorderCount").textContent =
        `${filtered.length} products found`;

}


// Priority badges
function getPriorityBadge(priority) {

    const badges = {

        CRITICAL: `
            <span class="badge bg-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Critical
            </span>
        `,

        HIGH: `
            <span class="badge bg-warning text-dark">
                <i class="bi bi-arrow-up-circle"></i>
                High
            </span>
        `,

        MEDIUM: `
            <span class="badge bg-info text-dark">
                <i class="bi bi-info-circle"></i>
                Medium
            </span>
        `

    };

    return badges[priority] || `
        <span class="badge bg-secondary">
            ${escapeHTML(priority)}
        </span>
    `;

}


// Escape product names before inserting into HTML
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