let suppliers = [];
let supplierModalInstance = null;


// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const modalElement = document.getElementById("supplierModal");

    supplierModalInstance = new bootstrap.Modal(modalElement);

    document.getElementById("supplierForm").addEventListener(
        "submit",
        saveSupplier
    );

    document.getElementById("supplierSearch").addEventListener(
        "input",
        renderSuppliers
    );

    loadSuppliers();

});


// ========================================
// LOAD SUPPLIERS
// ========================================

async function loadSuppliers() {

    const tableBody = document.getElementById("supplierTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                Loading suppliers...
            </td>
        </tr>
    `;

    try {

        // API.get() already returns parsed JSON
        const data = await API.get("/suppliers/");

        suppliers = Array.isArray(data) ? data : [];

        updateSupplierStats();

        renderSuppliers();

    } catch (error) {

        console.error("Supplier loading error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


// ========================================
// UPDATE STATISTICS
// ========================================

function updateSupplierStats() {

    const total = suppliers.length;

    const withEmail = suppliers.filter(supplier =>
        supplier.email && supplier.email.trim() !== ""
    ).length;

    const withoutEmail = total - withEmail;

    document.getElementById("totalSuppliers").textContent = total;

    document.getElementById("suppliersWithEmail").textContent = withEmail;

    document.getElementById("suppliersWithoutEmail").textContent = withoutEmail;

}


// ========================================
// DISPLAY SUPPLIERS
// ========================================

function renderSuppliers() {

    const tableBody = document.getElementById("supplierTableBody");

    const searchValue = document
        .getElementById("supplierSearch")
        .value
        .toLowerCase()
        .trim();

    const filteredSuppliers = suppliers.filter(supplier => {

        const name = (supplier.name || "").toLowerCase();

        const email = (supplier.email || "").toLowerCase();

        const phone = (supplier.phone || "").toLowerCase();

        const address = (supplier.address || "").toLowerCase();

        return (
            name.includes(searchValue) ||
            email.includes(searchValue) ||
            phone.includes(searchValue) ||
            address.includes(searchValue)
        );

    });

    if (filteredSuppliers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No suppliers found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML = filteredSuppliers.map((supplier, index) => {

        return `
            <tr>

                <td class="ps-4">${index + 1}</td>

                <td>
                    <div class="fw-semibold">
                        ${escapeHTML(supplier.name)}
                    </div>
                </td>

                <td>
                    ${
                        supplier.email
                            ? escapeHTML(supplier.email)
                            : '<span class="text-muted">Not provided</span>'
                    }
                </td>

                <td>${escapeHTML(supplier.phone)}</td>

                <td>
                    ${
                        supplier.address
                            ? escapeHTML(supplier.address)
                            : '<span class="text-muted">Not provided</span>'
                    }
                </td>

                <td class="text-end pe-4">

                    <button
                        class="btn btn-sm btn-outline-primary me-1"
                        onclick="editSupplier(${supplier.id})"
                        title="Edit Supplier">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        onclick="deleteSupplier(${supplier.id})"
                        title="Delete Supplier">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ========================================
// OPEN ADD SUPPLIER MODAL
// ========================================

function openSupplierModal() {

    document.getElementById("supplierForm").reset();

    document.getElementById("supplierId").value = "";

    document.getElementById("supplierModalTitle").textContent =
        "Add Supplier";

    document.getElementById("saveSupplierBtn").textContent =
        "Save Supplier";

    supplierModalInstance.show();

}


// ========================================
// EDIT SUPPLIER
// ========================================

function editSupplier(supplierId) {

    const supplier = suppliers.find(
        item => item.id === supplierId
    );

    if (!supplier) {

        alert("Supplier not found.");

        return;

    }

    document.getElementById("supplierId").value = supplier.id;

    document.getElementById("supplierName").value = supplier.name || "";

    document.getElementById("supplierEmail").value = supplier.email || "";

    document.getElementById("supplierPhone").value = supplier.phone || "";

    document.getElementById("supplierAddress").value = supplier.address || "";

    document.getElementById("supplierModalTitle").textContent =
        "Edit Supplier";

    document.getElementById("saveSupplierBtn").textContent =
        "Update Supplier";

    supplierModalInstance.show();

}


// ========================================
// SAVE / UPDATE SUPPLIER
// ========================================

async function saveSupplier(event) {

    event.preventDefault();

    const supplierId = document.getElementById("supplierId").value;

    const name = document.getElementById("supplierName").value.trim();

    const email = document.getElementById("supplierEmail").value.trim();

    const phone = document.getElementById("supplierPhone").value.trim();

    const address = document.getElementById("supplierAddress").value.trim();

    if (!name || !phone) {

        alert("Supplier name and phone number are required.");

        return;

    }

    const supplierData = {
        name: name,
        email: email || null,
        phone: phone,
        address: address || null
    };

    const saveButton = document.getElementById("saveSupplierBtn");

    saveButton.disabled = true;

    saveButton.textContent = "Saving...";

    try {

        if (supplierId) {

            await API.put(
                `/suppliers/${supplierId}`,
                supplierData
            );

        } else {

            await API.post(
                "/suppliers/",
                supplierData
            );

        }

        supplierModalInstance.hide();

        await loadSuppliers();

        alert(
            supplierId
                ? "Supplier updated successfully!"
                : "Supplier added successfully!"
        );

    } catch (error) {

        console.error("Supplier save error:", error);

        alert(error.message);

    } finally {

        saveButton.disabled = false;

        saveButton.textContent = supplierId
            ? "Update Supplier"
            : "Save Supplier";

    }

}


// ========================================
// DELETE SUPPLIER
// ========================================

async function deleteSupplier(supplierId) {

    const confirmed = confirm(
        "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) return;

    try {

        await API.delete(`/suppliers/${supplierId}`);

        await loadSuppliers();

        alert("Supplier deleted successfully!");

    } catch (error) {

        console.error("Supplier delete error:", error);

        alert(error.message);

    }

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