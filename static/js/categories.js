let categories = [];
let categoryModalInstance = null;


// ========================================
// INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const modalElement = document.getElementById("categoryModal");

    categoryModalInstance = new bootstrap.Modal(modalElement);

    document.getElementById("categoryForm").addEventListener(
        "submit",
        saveCategory
    );

    document.getElementById("categorySearch").addEventListener(
        "input",
        renderCategories
    );

    loadCategories();

});


// ========================================
// LOAD CATEGORIES
// ========================================

async function loadCategories() {

    const tableBody = document.getElementById("categoryTableBody");

    tableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
                Loading categories...
            </td>
        </tr>
    `;

    try {

        // API.get() already returns parsed JSON
        const data = await API.get("/categories/");

        categories = Array.isArray(data) ? data : [];

        updateCategoryStats();

        renderCategories();

    } catch (error) {

        console.error("Category loading error:", error);

        updateCategoryStats();

        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    ${escapeHTML(error.message || "Failed to load categories.")}
                </td>
            </tr>
        `;

    }

}


// ========================================
// UPDATE CATEGORY STATISTICS
// ========================================

function updateCategoryStats() {

    const total = categories.length;

    const described = categories.filter(category =>
        category.description &&
        category.description.trim() !== ""
    ).length;

    const empty = total - described;

    document.getElementById("totalCategories").textContent = total;

    document.getElementById("describedCategories").textContent = described;

    document.getElementById("emptyCategories").textContent = empty;

}


// ========================================
// DISPLAY CATEGORIES
// ========================================

function renderCategories() {

    const tableBody = document.getElementById("categoryTableBody");

    const searchValue = document
        .getElementById("categorySearch")
        .value
        .toLowerCase()
        .trim();

    const filteredCategories = categories.filter(category => {

        const name = (category.name || "").toLowerCase();

        const description = (category.description || "").toLowerCase();

        return (
            name.includes(searchValue) ||
            description.includes(searchValue)
        );

    });

    if (filteredCategories.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    No categories found.
                </td>
            </tr>
        `;

        return;

    }

    tableBody.innerHTML = filteredCategories.map((category, index) => {

        return `
            <tr>

                <td class="ps-4">${index + 1}</td>

                <td>
                    <div class="fw-semibold">
                        ${escapeHTML(category.name)}
                    </div>
                </td>

                <td>
                    ${
                        category.description
                            ? escapeHTML(category.description)
                            : '<span class="text-muted">No description</span>'
                    }
                </td>

                <td class="text-end pe-4">

                    <button
                        class="btn btn-sm btn-outline-primary me-1"
                        onclick="editCategory(${category.id})"
                        title="Edit Category">

                        <i class="bi bi-pencil"></i>

                    </button>

                    <button
                        class="btn btn-sm btn-outline-danger"
                        onclick="deleteCategory(${category.id})"
                        title="Delete Category">

                        <i class="bi bi-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join("");

}


// ========================================
// OPEN ADD CATEGORY MODAL
// ========================================

function openCategoryModal() {

    document.getElementById("categoryForm").reset();

    document.getElementById("categoryId").value = "";

    document.getElementById("categoryModalTitle").textContent =
        "Add Category";

    document.getElementById("saveCategoryBtn").textContent =
        "Save Category";

    categoryModalInstance.show();

}


// ========================================
// EDIT CATEGORY
// ========================================

function editCategory(categoryId) {

    const category = categories.find(
        item => item.id === categoryId
    );

    if (!category) {

        alert("Category not found.");

        return;

    }

    document.getElementById("categoryId").value = category.id;

    document.getElementById("categoryName").value = category.name;

    document.getElementById("categoryDescription").value =
        category.description || "";

    document.getElementById("categoryModalTitle").textContent =
        "Edit Category";

    document.getElementById("saveCategoryBtn").textContent =
        "Update Category";

    categoryModalInstance.show();

}


// ========================================
// SAVE / UPDATE CATEGORY
// ========================================

async function saveCategory(event) {

    event.preventDefault();

    const categoryId = document.getElementById("categoryId").value;

    const name = document.getElementById("categoryName").value.trim();

    const description = document
        .getElementById("categoryDescription")
        .value.trim();

    if (!name) {

        alert("Please enter a category name.");

        return;

    }

    const categoryData = {
        name: name,
        description: description || null
    };

    const saveButton = document.getElementById("saveCategoryBtn");

    saveButton.disabled = true;

    saveButton.textContent = "Saving...";

    try {

        if (categoryId) {

            // Update existing category
            await API.put(
                `/categories/${categoryId}`,
                categoryData
            );

        } else {

            // Create new category
            await API.post(
                "/categories/",
                categoryData
            );

        }

        categoryModalInstance.hide();

        await loadCategories();

        alert(
            categoryId
                ? "Category updated successfully!"
                : "Category added successfully!"
        );

    } catch (error) {

        console.error("Category save error:", error);

        alert(error.message || "Unable to save category.");

    } finally {

        saveButton.disabled = false;

        saveButton.textContent = categoryId
            ? "Update Category"
            : "Save Category";

    }

}


// ========================================
// DELETE CATEGORY
// ========================================

async function deleteCategory(categoryId) {

    const confirmed = confirm(
        "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {

        await API.delete(`/categories/${categoryId}`);

        await loadCategories();

        alert("Category deleted successfully!");

    } catch (error) {

        console.error("Category delete error:", error);

        alert(error.message || "Unable to delete category.");

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