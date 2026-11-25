let sales = [];
let products = [];

let saleModalInstance = null;
let saleDetailsModalInstance = null;


// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    saleModalInstance = new bootstrap.Modal(
        document.getElementById("saleModal")
    );

    saleDetailsModalInstance = new bootstrap.Modal(
        document.getElementById("saleDetailsModal")
    );

    document.getElementById("saleForm").addEventListener(
        "submit",
        saveSale
    );

    document.getElementById("saleSearch").addEventListener(
        "input",
        renderSales
    );

    initializeSales();

});


// ========================================
// INITIALIZE DATA
// ========================================

async function initializeSales() {

    await Promise.all([
        loadProducts(),
        loadSales()
    ]);

}


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const data = await API.get("/products/");

        products = Array.isArray(data) ? data : [];

    } catch (error) {

        console.error("Product loading error:", error);

        alert("Unable to load products.");

    }

}


// ========================================
// LOAD SALES
// ========================================

async function loadSales() {

    const tableBody = document.getElementById("salesTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                Loading sales...
            </td>
        </tr>
    `;

    try {

        const data = await API.get("/sales/");

        sales = Array.isArray(data) ? data : [];

        updateSaleStats();

        renderSales();

    } catch (error) {

        console.error("Sales loading error:", error);

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

function updateSaleStats() {

    const totalSales = sales.length;

    const totalRevenue = sales.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
    );

    const totalProductsSold = sales.reduce(
        (sum, sale) => {

            return sum + (sale.items || []).reduce(
                (itemSum, item) => itemSum + Number(item.quantity || 0),
                0
            );

        },
        0
    );

    document.getElementById("totalSales").textContent =
        totalSales;

    document.getElementById("totalRevenue").textContent =
        formatCurrency(totalRevenue);

    document.getElementById("totalProductsSold").textContent =
        totalProductsSold;

}


// ========================================
// GET PRODUCT NAME
// ========================================

function getProductName(productId) {

    const product = products.find(
        item => item.id === productId
    );

    return product
        ? (product.name || product.product_name || `Product #${productId}`)
        : `Product #${productId}`;

}


// ========================================
// DISPLAY SALES
// ========================================

function renderSales() {

    const tableBody = document.getElementById("salesTableBody");

    const searchValue = document
        .getElementById("saleSearch")
        .value
        .toLowerCase()
        .trim();

    const filteredSales = sales.filter(sale => {

        const productNames = (sale.items || [])
            .map(item => getProductName(item.product_id))
            .join(" ")
            .toLowerCase();

        return (
            String(sale.id).includes(searchValue) ||
            productNames.includes(searchValue)
        );

    });

    if (filteredSales.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    No sales found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML = filteredSales.map(sale => {

        const items = sale.items || [];

        const totalQuantity = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );

        return `
            <tr>

                <td class="ps-4 fw-semibold">
                    #SALE-${sale.id}
                </td>

                <td>
                    ${formatDate(sale.sale_date)}
                </td>

                <td>
                    <span class="badge bg-light text-dark">
                        ${items.length} products
                    </span>
                </td>

                <td>
                    ${totalQuantity} units
                </td>

                <td class="fw-semibold">
                    ${formatCurrency(sale.total_amount)}
                </td>

                <td>
                    <span class="badge bg-success">
                        ${escapeHTML(sale.status)}
                    </span>
                </td>

                <td class="text-end pe-4">

                    <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="viewSaleDetails(${sale.id})"
                        title="View Details">

                        <i class="bi bi-eye"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ========================================
// OPEN SALE MODAL
// ========================================

function openSaleModal() {

    if (products.length === 0) {

        alert("Please add products before creating a sale.");

        return;

    }

    document.getElementById("saleForm").reset();

    document.getElementById("saleItemsBody").innerHTML = "";

    document.getElementById("saleGrandTotal").textContent = "0.00";

    addSaleItem();

    saleModalInstance.show();

}


// ========================================
// ADD SALE ITEM
// ========================================

function addSaleItem() {

    const tableBody = document.getElementById("saleItemsBody");

    const row = document.createElement("tr");

    const productOptions = products.map(product => {

        const productName = product.name ||
            product.product_name ||
            `Product #${product.id}`;

        return `
            <option
                value="${product.id}"
                data-price="${Number(product.price || 0)}">

                ${escapeHTML(productName)}

            </option>
        `;

    }).join("");


    row.innerHTML = `

        <td>

            <select class="form-select sale-product" required>

                <option value="">Select Product</option>

                ${productOptions}

            </select>

        </td>


        <td>

            <span class="fw-semibold sale-price">
                ₹0.00
            </span>

        </td>


        <td>

            <input
                type="number"
                class="form-control sale-quantity"
                min="1"
                step="1"
                value="1"
                required
            >

        </td>


        <td>

            <span class="fw-semibold sale-subtotal">
                ₹0.00
            </span>

        </td>


        <td>

            <button
                type="button"
                class="btn btn-sm btn-outline-danger remove-sale-item"
                title="Remove item">

                <i class="bi bi-trash"></i>

            </button>

        </td>

    `;


    tableBody.appendChild(row);


    const productSelect = row.querySelector(".sale-product");

    const quantityInput = row.querySelector(".sale-quantity");


    productSelect.addEventListener(
        "change",
        function () {

            updateSaleRow(row);

        }
    );


    quantityInput.addEventListener(
        "input",
        calculateSaleTotal
    );


    row.querySelector(".remove-sale-item").addEventListener(
        "click",
        function () {

            row.remove();

            calculateSaleTotal();

        }
    );


    calculateSaleTotal();

}


// ========================================
// UPDATE SALE ROW
// ========================================

function updateSaleRow(row) {

    const productSelect = row.querySelector(".sale-product");

    const selectedOption = productSelect.selectedOptions[0];

    const price = Number(
        selectedOption?.dataset.price || 0
    );

    row.dataset.price = price;

    row.querySelector(".sale-price").textContent =
        formatCurrency(price);

    calculateSaleTotal();

}


// ========================================
// CALCULATE SALE TOTAL
// ========================================

function calculateSaleTotal() {

    const rows = document.querySelectorAll("#saleItemsBody tr");

    let grandTotal = 0;

    rows.forEach(row => {

        const price = Number(row.dataset.price || 0);

        const quantity = Number(
            row.querySelector(".sale-quantity").value
        );

        const subtotal = price * quantity;

        row.querySelector(".sale-subtotal").textContent =
            formatCurrency(subtotal);

        grandTotal += subtotal;

    });

    document.getElementById("saleGrandTotal").textContent =
        grandTotal.toFixed(2);

}


// ========================================
// SAVE SALE
// ========================================

async function saveSale(event) {

    event.preventDefault();

    const rows = document.querySelectorAll("#saleItemsBody tr");

    if (rows.length === 0) {

        alert("Please add at least one product.");

        return;

    }

    const items = [];

    const selectedProducts = new Set();


    for (const row of rows) {

        const productId = Number(
            row.querySelector(".sale-product").value
        );

        const quantity = Number(
            row.querySelector(".sale-quantity").value
        );


        if (
            !productId ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            alert("Please select a product and enter a valid quantity.");

            return;

        }


        if (selectedProducts.has(productId)) {

            alert(
                "A product can only appear once in a sale. Please combine its quantities."
            );

            return;

        }

        selectedProducts.add(productId);


        items.push({

            product_id: productId,

            quantity: quantity

        });

    }


    const saleData = {
        items: items
    };


    const saveButton = document.getElementById("saveSaleBtn");

    saveButton.disabled = true;

    saveButton.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Processing Sale...
    `;


    try {

        const result = await API.post(
            "/sales/",
            saleData
        );


        saleModalInstance.hide();

        await loadSales();


        alert(
            `Sale #${result.id} completed successfully!\nInventory has been updated.`
        );


    } catch (error) {

        console.error("Sale creation error:", error);

        alert(error.message);

    } finally {

        saveButton.disabled = false;

        saveButton.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            Complete Sale
        `;

    }

}


// ========================================
// VIEW SALE DETAILS
// ========================================

async function viewSaleDetails(saleId) {

    const content = document.getElementById("saleDetailsContent");

    content.innerHTML = `
        <div class="text-center py-4">
            Loading sale details...
        </div>
    `;

    saleDetailsModalInstance.show();


    try {

        const sale = await API.get(
            `/sales/${saleId}`
        );


        const itemsHTML = (sale.items || []).map(item => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(getProductName(item.product_id))}
                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ${formatCurrency(item.unit_price)}
                    </td>

                    <td>
                        ${formatCurrency(item.subtotal)}
                    </td>

                </tr>
            `;

        }).join("");


        content.innerHTML = `

            <div class="row mb-4">

                <div class="col-md-6 mb-3">

                    <small class="text-muted">Sale ID</small>

                    <h6 class="fw-bold">
                        #SALE-${sale.id}
                    </h6>

                </div>


                <div class="col-md-6 mb-3">

                    <small class="text-muted">Sale Date</small>

                    <h6 class="fw-bold">
                        ${formatDate(sale.sale_date)}
                    </h6>

                </div>


                <div class="col-md-6 mb-3">

                    <small class="text-muted">Status</small>

                    <h6 class="fw-bold text-success">
                        ${escapeHTML(sale.status)}
                    </h6>

                </div>

            </div>


            <h6 class="fw-bold mb-3">
                Sold Products
            </h6>


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

                    Grand Total:
                    ${formatCurrency(sale.total_amount)}

                </h5>

            </div>

        `;


    } catch (error) {

        console.error("Sale details error:", error);

        content.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHTML(error.message)}
            </div>
        `;

    }

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