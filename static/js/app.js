// ============================================
// INVENTRA GLOBAL APPLICATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("inventra_token");

    if (!token && !location.pathname.startsWith("/login")) {
        location.href = "/login";
        return;
    }

    initializeUser();
    initializeNavigation();
    initializeLogout();
    initializeGlobalSearch();
    initializeNotifications();
    initializeProfile();
    initializeSettings();

});


// ============================================
// USER INFORMATION
// ============================================

function getCurrentUser() {

    try {
        return JSON.parse(
            localStorage.getItem("inventra_user") || "{}"
        );
    } catch {
        return {};
    }

}


function initializeUser() {

    const user = getCurrentUser();

    const username = user.username || user.name || "User";

    const email = user.email || "Email not available";

    const role = user.role || "User";

    const displayRole =
        role.toLowerCase() === "admin"
            ? "Administrator"
            : role.charAt(0).toUpperCase() + role.slice(1);


    // Header
    setText("navUsername", username);
    setText("navRole", displayRole);

    // Dashboard welcome
    setText("welcomeName", username);

    // Profile dropdown
    setText("profileUsername", username);
    setText("profileEmail", email);
    setText("profileRole", displayRole);

    // Profile modal
    setText("modalProfileName", username);
    setText("modalProfileRole", displayRole);
    setText("modalUsername", username);
    setText("modalEmail", email);
    setText("modalRole", displayRole);

}


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// ============================================
// SIDEBAR NAVIGATION
// ============================================

function initializeNavigation() {

    const currentPath = location.pathname;

    document.querySelectorAll(".side-nav a").forEach(link => {

        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }

    });

    const menu = document.getElementById("mobileMenu");

    if (menu) {

        menu.addEventListener("click", () => {

            document.getElementById("sidebar")
                .classList.toggle("open");

        });

    }

}


// ============================================
// LOGOUT
// ============================================

function logoutUser() {

    localStorage.removeItem("inventra_token");

    localStorage.removeItem("inventra_user");

    location.href = "/login";

}


function initializeLogout() {

    const logoutButton = document.getElementById("logoutBtn");

    const topLogoutButton = document.getElementById("topLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutUser);
    }

    if (topLogoutButton) {
        topLogoutButton.addEventListener("click", logoutUser);
    }

}


// ============================================
// GLOBAL SEARCH
// ============================================

let searchData = [];

let searchTimeout = null;


function initializeGlobalSearch() {

    const searchInput = document.getElementById("globalSearch");

    const resultsContainer = document.getElementById("searchResults");

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        const query = searchInput.value.trim().toLowerCase();

        if (query.length < 2) {

            resultsContainer.style.display = "none";

            return;

        }

        searchTimeout = setTimeout(() => {

            performGlobalSearch(query);

        }, 300);

    });


    document.addEventListener("click", event => {

        if (
            !event.target.closest(".global-search-wrapper")
        ) {

            resultsContainer.style.display = "none";

        }

    });

}


async function performGlobalSearch(query) {

    const resultsContainer = document.getElementById("searchResults");

    resultsContainer.style.display = "block";

    resultsContainer.innerHTML = `
        <div class="search-loading">
            <span class="spinner-border spinner-border-sm"></span>
            Searching...
        </div>
    `;

    try {

        const [products, categories, suppliers] = await Promise.all([

            API.get("/products/"),

            API.get("/categories/"),

            API.get("/suppliers/")

        ]);

        const results = [];

        // PRODUCTS

        (Array.isArray(products) ? products : []).forEach(item => {

            const name = item.name || item.product_name || "";

            if (name.toLowerCase().includes(query)) {

                results.push({

                    title: name,

                    subtitle: "Product",

                    icon: "bi-box-seam",

                    url: "/products"

                });

            }

        });


        // CATEGORIES

        (Array.isArray(categories) ? categories : []).forEach(item => {

            if (
                (item.name || "").toLowerCase().includes(query)
            ) {

                results.push({

                    title: item.name,

                    subtitle: "Category",

                    icon: "bi-tags",

                    url: "/categories-page"

                });

            }

        });


        // SUPPLIERS

        (Array.isArray(suppliers) ? suppliers : []).forEach(item => {

            const name = item.name || "";

            if (
                name.toLowerCase().includes(query) ||
                (item.email || "").toLowerCase().includes(query)
            ) {

                results.push({

                    title: name,

                    subtitle: "Supplier",

                    icon: "bi-truck",

                    url: "/suppliers-page"

                });

            }

        });


        displaySearchResults(results);

    } catch (error) {

        console.error("Global search error:", error);

        resultsContainer.innerHTML = `
            <div class="search-empty">
                Unable to search. Please try again.
            </div>
        `;

    }

}


function displaySearchResults(results) {

    const container = document.getElementById("searchResults");

    if (!results.length) {

        container.innerHTML = `
            <div class="search-empty">
                <i class="bi bi-search"></i>
                No matching results found.
            </div>
        `;

        return;

    }

    container.innerHTML = results.slice(0, 10).map(item => `

        <a href="${item.url}" class="search-result-item">

            <div class="search-result-icon">
                <i class="bi ${item.icon}"></i>
            </div>

            <div>
                <strong>${escapeHTML(item.title)}</strong>
                <small>${item.subtitle}</small>
            </div>

            <i class="bi bi-arrow-up-right ms-auto"></i>

        </a>

    `).join("");

}


// ============================================
// NOTIFICATIONS
// ============================================

function initializeNotifications() {

    const refreshButton = document.getElementById("refreshNotifications");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadNotifications
        );

    }

    loadNotifications();

}


async function loadNotifications() {

    const container = document.getElementById("notificationList");

    if (!container) return;

    container.innerHTML = `
        <div class="notification-empty">
            Loading notifications...
        </div>
    `;

    const notifications = [];

    const settings = getSettings();

    try {

        const requests = [];

        if (settings.lowStock) {

            requests.push(

                API.get("/inventory/low-stock")
                    .then(data => {

                        (Array.isArray(data) ? data : []).forEach(item => {

                            const quantity = item.quantity ?? item.current_stock ?? 0;

                            notifications.push({

                                title: "Low Stock Alert",

                                message: `${item.product_name || item.name || "Product"} has only ${quantity} units remaining.`,

                                icon: "bi-exclamation-triangle",

                                type: "warning",

                                url: "/inventory-page"

                            });

                        });

                    })

            );

        }


        if (settings.expiry) {

            requests.push(

                API.get("/expiry/?days=30")
                    .then(data => {

                        (Array.isArray(data) ? data : []).forEach(item => {

                            notifications.push({

                                title: item.status === "EXPIRED"
                                    ? "Expired Product"
                                    : "Expiry Alert",

                                message: `${item.product_name || "Product"} - ${item.batch_number || "Batch"} (${item.days_remaining} days remaining).`,

                                icon: "bi-calendar-x",

                                type: item.status === "EXPIRED" ? "danger" : "warning",

                                url: "/expiry-page"

                            });

                        });

                    })

            );

        }


        if (settings.reorder) {

            requests.push(

                API.get("/reorder/recommendations")
                    .then(data => {

                        (Array.isArray(data) ? data : []).forEach(item => {

                            if (item.priority === "CRITICAL") {

                                notifications.push({

                                    title: "Critical Reorder Alert",

                                    message: `${item.product_name} needs ${item.recommended_quantity} units.`,

                                    icon: "bi-arrow-repeat",

                                    type: "danger",

                                    url: "/reorder-page"

                                });

                            }

                        });

                    })

            );

        }


        const results = await Promise.allSettled(requests);

        results.forEach(result => {

            if (result.status === "rejected") {

                console.error(
                    "Notification source error:",
                    result.reason
                );

            }

        });


        displayNotifications(notifications);

    } catch (error) {

        console.error("Notification error:", error);

        container.innerHTML = `
            <div class="notification-empty">
                Unable to load notifications.
            </div>
        `;

    }

}


function displayNotifications(notifications) {

    const container = document.getElementById("notificationList");

    const count = notifications.length;

    setText("notificationCount", count);

    const dot = document.getElementById("notificationDot");

    if (dot) {
        dot.style.display = count > 0 ? "block" : "none";
    }

    if (!count) {

        container.innerHTML = `
            <div class="notification-empty">
                <i class="bi bi-check-circle"></i>
                <p>You're all caught up!</p>
                <small>No new alerts.</small>
            </div>
        `;

        return;

    }


    container.innerHTML = notifications.slice(0, 20).map(item => `

        <a href="${item.url}" class="notification-item">

            <div class="notification-icon ${item.type}">
                <i class="bi ${item.icon}"></i>
            </div>

            <div class="notification-content">

                <strong>${escapeHTML(item.title)}</strong>

                <p>${escapeHTML(item.message)}</p>

            </div>

        </a>

    `).join("");

}


// ============================================
// USER PROFILE
// ============================================

function initializeProfile() {

    const button = document.getElementById("viewProfileBtn");

    if (!button) return;

    button.addEventListener("click", () => {

        const modal = new bootstrap.Modal(
            document.getElementById("profileModal")
        );

        modal.show();

    });

}


// ============================================
// SETTINGS
// ============================================

function getSettings() {

    const defaults = {

        lowStock: true,

        expiry: true,

        reorder: true

    };

    try {

        return {

            ...defaults,

            ...JSON.parse(
                localStorage.getItem("inventra_settings") || "{}"
            )

        };

    } catch {

        return defaults;

    }

}


function initializeSettings() {

    const button = document.getElementById("openSettingsBtn");

    const saveButton = document.getElementById("saveSettingsBtn");

    if (!button || !saveButton) return;


    button.addEventListener("click", () => {

        const settings = getSettings();

        document.getElementById("lowStockPreference").checked =
            settings.lowStock;

        document.getElementById("expiryPreference").checked =
            settings.expiry;

        document.getElementById("reorderPreference").checked =
            settings.reorder;

        new bootstrap.Modal(
            document.getElementById("settingsModal")
        ).show();

    });


    saveButton.addEventListener("click", () => {

        const settings = {

            lowStock: document.getElementById("lowStockPreference").checked,

            expiry: document.getElementById("expiryPreference").checked,

            reorder: document.getElementById("reorderPreference").checked

        };

        localStorage.setItem(
            "inventra_settings",
            JSON.stringify(settings)
        );

        bootstrap.Modal.getInstance(
            document.getElementById("settingsModal")
        ).hide();

        loadNotifications();

        showToast("Settings saved successfully!");

    });

}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

    })[character]);

}


// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = "success") {

    const container = document.getElementById("toastContainer");

    if (!container) {

        alert(message);

        return;

    }

    const el = document.createElement("div");

    el.className =
        `toast align-items-center text-bg-${type === "success" ? "success" : "danger"} border-0`;

    el.role = "alert";

    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body"></div>
            <button
                type="button"
                class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast">
            </button>
        </div>
    `;

    el.querySelector(".toast-body").textContent = message;

    container.appendChild(el);

    const toast = new bootstrap.Toast(el, { delay: 3000 });

    toast.show();

    el.addEventListener("hidden.bs.toast", () => el.remove());

}