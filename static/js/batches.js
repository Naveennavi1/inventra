let batches = [];
let products = [];

document.addEventListener("DOMContentLoaded", () => {

    loadBatches();
    loadProducts();

    document.getElementById("batchSearch")
        .addEventListener("input", renderBatches);

    document.getElementById("batchForm")
        .addEventListener("submit", saveBatch);

    document.getElementById("manufacturingDate")
        .addEventListener("change", validateBatchDates);

    document.getElementById("expiryDate")
        .addEventListener("change", validateBatchDates);

});


// Load products for dropdown
async function loadProducts() {

    const select = document.getElementById("batchProduct");

    try {

        const data = await API.get("/products/");

        products = Array.isArray(data) ? data : [];

        select.innerHTML = `
            <option value="">Select Product</option>
            ${products.map(product => `
                <option value="${product.id}">
                    ${escapeHTML(product.name)}
                </option>
            `).join("")}
        `;

    } catch (error) {

        console.error("Product loading error:", error);

        select.innerHTML = `
            <option value="">Unable to load products</option>
        `;

    }

}


// Load batches
async function loadBatches() {

    const tbody = document.getElementById("batchTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading batches...
            </td>
        </tr>
    `;

    try {

        const data = await API.get("/batches/");

        batches = Array.isArray(data) ? data : [];

        updateBatchSummary();

        renderBatches();

    } catch (error) {

        console.error("Batch loading error:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// Update summary cards
function updateBatchSummary() {

    const totalQuantity = batches.reduce(
        (sum, batch) => sum + Number(batch.quantity || 0),
        0
    );

    const today = getLocalDateString();

    const expired = batches.filter(
        batch => batch.expiry_date < today
    ).length;

    document.getElementById("totalBatches").textContent =
        batches.length;

    document.getElementById("totalBatchQuantity").textContent =
        totalQuantity;

    document.getElementById("expiredBatches").textContent =
        expired;

}


// Render batch table
function renderBatches() {

    const tbody = document.getElementById("batchTableBody");

    const search = document.getElementById("batchSearch")
        .value.toLowerCase().trim();

    const filtered = batches.filter(batch => {

        const product = products.find(
            item => item.id === batch.product_id
        );

        const productName = product?.name || `Product #${batch.product_id}`;

        return (
            String(batch.batch_number).toLowerCase().includes(search) ||
            productName.toLowerCase().includes(search) ||
            String(batch.product_id).includes(search)
        );

    });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                    No batches found.
                </td>
            </tr>
        `;

        document.getElementById("batchCount").textContent =
            "0 batches found";

        return;

    }


    tbody.innerHTML = filtered.map(batch => {

        const product = products.find(
            item => item.id === batch.product_id
        );

        const productName = product?.name ||
            `Product #${batch.product_id}`;

        const status = getBatchStatus(batch.expiry_date);

        return `
            <tr>

                <td class="fw-semibold">
                    ${escapeHTML(batch.batch_number)}
                </td>

                <td>
                    ${escapeHTML(productName)}
                </td>

                <td>
                    <span class="fw-bold">
                        ${batch.quantity}
                    </span>
                </td>

                <td>
                    ${formatDate(batch.manufacturing_date)}
                </td>

                <td>
                    ${formatDate(batch.expiry_date)}
                </td>

                <td>
                    ${status}
                </td>

                <td>
                    <button class="btn btn-sm btn-outline-dark"
                            onclick="viewBatch(${batch.id})">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>

            </tr>
        `;

    }).join("");


    document.getElementById("batchCount").textContent =
        `${filtered.length} batches found`;

}


// Determine batch expiry status
function getBatchStatus(expiryDate) {

    const today = getLocalDateString();

    if (expiryDate < today) {
        return `<span class="badge bg-danger">Expired</span>`;
    }

    if (expiryDate === today) {
        return `<span class="badge bg-danger">Expires Today</span>`;
    }

    const expiry = new Date(`${expiryDate}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);

    const days = Math.ceil(
        (expiry - current) / (1000 * 60 * 60 * 24)
    );

    if (days <= 7) {
        return `<span class="badge bg-warning text-dark">Expiring Soon</span>`;
    }

    return `<span class="badge bg-success">Active</span>`;

}


// Save batch
async function saveBatch(event) {

    event.preventDefault();

    const manufacturingDate =
        document.getElementById("manufacturingDate").value;

    const expiryDate =
        document.getElementById("expiryDate").value;

    if (!validateBatchDates()) {
        return;
    }

    const payload = {

        product_id: Number(
            document.getElementById("batchProduct").value
        ),

        batch_number: document.getElementById("batchNumber").value.trim(),

        quantity: Number(
            document.getElementById("batchQuantity").value
        ),

        manufacturing_date: manufacturingDate || null,

        expiry_date: expiryDate

    };


    if (!payload.product_id) {
        alert("Please select a product.");
        return;
    }

    if (!payload.quantity || payload.quantity <= 0 ||
        !Number.isInteger(payload.quantity)) {
        alert("Please enter a valid positive whole-number quantity.");
        return;
    }


    const button = document.getElementById("saveBatchBtn");

    button.disabled = true;
    button.textContent = "Saving...";

    try {

        await API.post("/batches/", payload);

        alert("Batch created successfully!");

        bootstrap.Modal.getInstance(
            document.getElementById("batchModal")
        ).hide();

        document.getElementById("batchForm").reset();

        await loadBatches();

    } catch (error) {

        alert(error.message || "Failed to create batch.");

    } finally {

        button.disabled = false;
        button.textContent = "Save Batch";

    }

}


// Validate manufacturing and expiry dates
function validateBatchDates() {

    const manufacturingDate =
        document.getElementById("manufacturingDate").value;

    const expiryDate =
        document.getElementById("expiryDate").value;

    if (
        manufacturingDate &&
        expiryDate &&
        expiryDate <= manufacturingDate
    ) {

        alert("Expiry date must be later than manufacturing date.");

        return false;

    }

    return true;

}


// View batch details
async function viewBatch(batchId) {

    try {

        const batch = await API.get(`/batches/${batchId}`);

        const product = products.find(
            item => item.id === batch.product_id
        );

        const productName = product?.name ||
            `Product #${batch.product_id}`;

        document.getElementById("batchDetailsContent").innerHTML = `

            <div class="mb-3">
                <small class="text-muted">Batch Number</small>
                <h5 class="fw-bold">
                    ${escapeHTML(batch.batch_number)}
                </h5>
            </div>

            <hr>

            <div class="mb-3">
                <small class="text-muted">Product</small>
                <div class="fw-semibold">
                    ${escapeHTML(productName)}
                </div>
            </div>

            <div class="mb-3">
                <small class="text-muted">Quantity</small>
                <div class="fw-semibold">
                    ${batch.quantity}
                </div>
            </div>

            <div class="mb-3">
                <small class="text-muted">Manufacturing Date</small>
                <div>${formatDate(batch.manufacturing_date)}</div>
            </div>

            <div class="mb-3">
                <small class="text-muted">Expiry Date</small>
                <div>${formatDate(batch.expiry_date)}</div>
            </div>

            <div class="mb-2">
                <small class="text-muted">Status</small>
                <div>${getBatchStatus(batch.expiry_date)}</div>
            </div>

        `;

        new bootstrap.Modal(
            document.getElementById("batchDetailsModal")
        ).show();

    } catch (error) {

        alert(error.message);

    }

}


// Date formatting
function formatDate(value) {

    if (!value) return "Not available";

    const parts = String(value).split("-");

    if (parts.length !== 3) return escapeHTML(value);

    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// Local date without UTC conversion
function getLocalDateString() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// Escape HTML
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