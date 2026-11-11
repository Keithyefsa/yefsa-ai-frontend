
"use strict";

/* ==========================================
   BMY - BUSINESS MANAGEMENT BY YEFSATECH
   Complete frontend application
========================================== */


/* ==========================================
   1. GENERAL HELPERS
========================================== */

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function makeId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

function date() {
    return new Date().toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function toast(message) {
    const element = $("toast");

    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 2300);
}


/* ==========================================
   2. LOCAL BUSINESS DATA
========================================== */

const KEY = "yefsatech_bmy_v1";

const defaults = {
    customers: [],
    employees: [],
    sales: [],
    expenses: [],

    settings: {
        name: "My Business",
        email: "",
        phone: "",
        currency: "UGX"
    }
};

function read() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(KEY) || "null"
        ) || {};

        return {
            ...defaults,
            ...saved,

            customers: Array.isArray(saved.customers)
                ? saved.customers
                : [],

            employees: Array.isArray(saved.employees)
                ? saved.employees
                : [],

            sales: Array.isArray(saved.sales)
                ? saved.sales
                : [],

            expenses: Array.isArray(saved.expenses)
                ? saved.expenses
                : [],

            settings: {
                ...defaults.settings,
                ...(saved.settings || {})
            }
        };

    } catch (error) {
        console.error("BMY storage error:", error);

        return JSON.parse(
            JSON.stringify(defaults)
        );
    }
}

let data = read();

function persist() {
    try {
        localStorage.setItem(
            KEY,
            JSON.stringify(data)
        );

        render();

    } catch (error) {
        console.error("BMY save error:", error);
        toast("Could not save your changes.");
    }
}

function fmt(amount) {
    return `${data.settings.currency} ${Number(amount || 0).toLocaleString()}`;
}


/* ==========================================
   3. NAVIGATION
========================================== */

function go(id) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    $("page-" + id)?.classList.add("active");

    document.querySelectorAll(".nav").forEach(nav => {
        nav.classList.toggle(
            "active",
            nav.dataset.page === id
        );
    });

    const navItem = document.querySelector(
        `.nav[data-page="${id}"]`
    );

    if ($("crumb")) {
        $("crumb").textContent = navItem
            ? navItem.textContent.trim()
            : "Dashboard";
    }

    $("sidebar")?.classList.remove("open");

    window.scrollTo(0, 0);
}

document.querySelectorAll(".nav[data-page]").forEach(nav => {
    nav.addEventListener("click", () => {
        go(nav.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        go(button.dataset.go);
    });
});

if ($("menu")) {
    $("menu").addEventListener("click", () => {
        $("sidebar")?.classList.toggle("open");
    });
}


/* ==========================================
   4. CUSTOMER MANAGEMENT
========================================== */

if ($("customerForm")) {
    $("customerForm").addEventListener("submit", event => {
        event.preventDefault();

        data.customers.unshift({
            id: makeId(),
            name: $("customerName").value.trim(),
            phone: $("customerPhone").value.trim(),
            email: $("customerEmail").value.trim(),
            date: date()
        });

        event.target.reset();

        persist();

        toast("Customer added.");
    });
}


/* ==========================================
   5. EMPLOYEE MANAGEMENT
========================================== */

if ($("employeeForm")) {
    $("employeeForm").addEventListener("submit", event => {
        event.preventDefault();

        data.employees.unshift({
            id: makeId(),
            name: $("employeeName").value.trim(),
            role: $("employeeRole").value.trim(),
            phone: $("employeePhone").value.trim(),
            date: date()
        });

        event.target.reset();

        persist();

        toast("Employee added.");
    });
}


/* ==========================================
   6. SALES MANAGEMENT
========================================== */

if ($("saleForm")) {
    $("saleForm").addEventListener("submit", event => {
        event.preventDefault();

        const amount = Number($("saleAmount").value);

        if (!Number.isFinite(amount) || amount <= 0) {
            toast("Enter a valid amount.");
            return;
        }

        data.sales.unshift({
            id: makeId(),
            description: $("saleDescription").value.trim(),
            customer: $("saleCustomer").value.trim() ||
                "Walk-in customer",
            amount,
            method: $("saleMethod").value,
            date: date(),
            time: Date.now()
        });

        event.target.reset();

        persist();

        toast("Sale recorded.");
    });
}


/* ==========================================
   7. EXPENSE MANAGEMENT
========================================== */

if ($("expenseForm")) {
    $("expenseForm").addEventListener("submit", event => {
        event.preventDefault();

        const amount = Number($("expenseAmount").value);

        if (!Number.isFinite(amount) || amount <= 0) {
            toast("Enter a valid amount.");
            return;
        }

        data.expenses.unshift({
            id: makeId(),
            description: $("expenseDescription").value.trim(),
            amount,
            category: $("expenseCategory").value,
            date: date(),
            time: Date.now()
        });

        event.target.reset();

        persist();

        toast("Expense recorded.");
    });
}


/* ==========================================
   8. RECEIPT GENERATION
========================================== */

if ($("receiptForm")) {
    $("receiptForm").addEventListener("submit", event => {
        event.preventDefault();

        const amount = Number($("receiptAmount").value);

        if (!Number.isFinite(amount) || amount <= 0) {
            toast("Enter a valid amount.");
            return;
        }

        const receiptNumber = "BMY-" + Date.now();

        $("receiptPreview").innerHTML = `
            <div class="receipt">
                <h2>BMY | BY YEFSATECH</h2>

                <p>
                    PAYMENT RECEIPT<br>
                    Receipt number: ${safe(receiptNumber)}<br>
                    Date: ${safe(date())}<br>
                    Received from: ${safe($("receiptCustomer").value)}<br>
                    Phone: ${safe($("receiptPhone").value || "Not provided")}<br>
                    Description: ${safe($("receiptNote").value || "Payment received")}<br>
                    Method: ${safe($("receiptMethod").value)}
                </p>

                <strong>${safe(fmt(amount))}</strong>

                <p>Thank you for your payment.</p>

                <button class="primary" onclick="window.print()">
                    Print receipt
                </button>
            </div>
        `;

        toast("Receipt generated.");
    });
}


/* ==========================================
   9. BUSINESS SETTINGS
========================================== */

if ($("settingsForm")) {
    $("settingsForm").addEventListener("submit", event => {
        event.preventDefault();

        data.settings = {
            name: $("businessName").value.trim() ||
                "My Business",

            email: $("businessEmail").value.trim(),

            phone: $("businessPhone").value.trim(),

            currency: $("currency").value
        };

        persist();

        toast("Workspace details saved.");
    });
}


/* ==========================================
   10. DELETE RECORDS
========================================== */

document.addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");

    if (!button) return;

    const type = button.dataset.remove;

    if (!Array.isArray(data[type])) return;

    data[type] = data[type].filter(record => {
        return record.id !== button.dataset.id;
    });

    persist();

    toast("Record removed.");
});


/* ==========================================
   11. BACKUP AND EXPORT
========================================== */

function exportBackup() {
    const blob = new Blob(
        [
            JSON.stringify({
                exportedAt: new Date().toISOString(),
                ...data
            }, null, 2)
        ],
        {
            type: "application/json"
        }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "bmy-workspace-backup.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

if ($("export")) {
    $("export").addEventListener("click", exportBackup);
}

if ($("backup")) {
    $("backup").addEventListener("click", exportBackup);
}


/* ==========================================
   12. SEARCH
========================================== */

if ($("search")) {
    $("search").addEventListener("keydown", event => {
        if (event.key !== "Enter") return;

        const query = event.target.value
            .toLowerCase()
            .trim();

        if (!query) return;

        if (data.customers.some(record =>
            (
                record.name +
                record.phone +
                record.email
            ).toLowerCase().includes(query)
        )) {
            go("customers");

        } else if (data.employees.some(record =>
            (
                record.name +
                record.role +
                record.phone
            ).toLowerCase().includes(query)
        )) {
            go("hr");

        } else if (data.sales.some(record =>
            (
                record.description +
                record.customer
            ).toLowerCase().includes(query)
        )) {
            go("sales");

        } else {
            toast("No matching saved record found.");
        }
    });
}


/* ==========================================
   13. RENDER LOCAL BUSINESS DATA
========================================== */

function render() {

    const incomeTotal = data.sales.reduce(
        (sum, sale) => sum + Number(sale.amount || 0),
        0
    );

    const expenseTotalValue = data.expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );


    // DASHBOARD TOTALS

    setText("revenue", fmt(incomeTotal));

    setText("expenses", fmt(expenseTotalValue));

    setText("customerCount", data.customers.length);


    // FINANCE TOTALS

    setText("income", fmt(incomeTotal));

    setText("expenseTotal", fmt(expenseTotalValue));

    setText(
        "balance",
        fmt(incomeTotal - expenseTotalValue)
    );


    // CUSTOMER DIRECTORY

    setText(
        "customerTotal",
        data.customers.length + " records"
    );

    if ($("customers")) {
        $("customers").innerHTML = data.customers.length

            ? data.customers.map(record => `
                <tr>
                    <td>${safe(record.name)}</td>
                    <td>${safe(record.phone || "—")}</td>
                    <td>${safe(record.email || "—")}</td>
                    <td>${safe(record.date)}</td>
                    <td>
                        <button
                            class="delete"
                            data-remove="customers"
                            data-id="${safe(record.id)}">
                            Remove
                        </button>
                    </td>
                </tr>
            `).join("")

            : '<tr><td colspan="5" class="empty">No customers saved yet.</td></tr>';
    }


    // EMPLOYEE DIRECTORY

    setText(
        "employeeTotal",
        data.employees.length + " records"
    );

    if ($("employees")) {
        $("employees").innerHTML = data.employees.length

            ? data.employees.map(record => `
                <tr>
                    <td>${safe(record.name)}</td>
                    <td>${safe(record.role)}</td>
                    <td>${safe(record.phone || "—")}</td>
                    <td>${safe(record.date)}</td>
                    <td>
                        <button
                            class="delete"
                            data-remove="employees"
                            data-id="${safe(record.id)}">
                            Remove
                        </button>
                    </td>
                </tr>
            `).join("")

            : '<tr><td colspan="5" class="empty">No employees saved yet.</td></tr>';
    }


    // SALES HISTORY

    setText(
        "saleTotal",
        data.sales.length + " records"
    );

    if ($("sales")) {
        $("sales").innerHTML = data.sales.length

            ? data.sales.map(record => `
                <tr>
                    <td>${safe(record.description)}</td>
                    <td>${safe(record.customer)}</td>
                    <td>${safe(record.date)}</td>
                    <td>${safe(record.method)}</td>
                    <td>${safe(fmt(record.amount))}</td>
                </tr>
            `).join("")

            : '<tr><td colspan="5" class="empty">No sales recorded yet.</td></tr>';
    }


    // FINANCE ACTIVITY

    const activity = [
        ...data.sales.map(record => ({
            ...record,
            type: "Income"
        })),

        ...data.expenses.map(record => ({
            ...record,
            type: "Expense"
        }))

    ].sort((a, b) => (b.time || 0) - (a.time || 0));


    // RECENT TRANSACTIONS

    if ($("recent")) {
        $("recent").innerHTML = activity.length

            ? activity.slice(0, 5).map(record => `
                <tr>
                    <td>${safe(record.description)}</td>
                    <td>${safe(record.date)}</td>
                    <td>${safe(record.type)}</td>
                    <td>${safe(fmt(record.amount))}</td>
                </tr>
            `).join("")

            : '<tr><td colspan="4" class="empty">No transactions yet.</td></tr>';
    }


    // FINANCE TABLE

    if ($("financeRows")) {
        $("financeRows").innerHTML = activity.length

            ? activity.map(record => `
                <tr>
                    <td>${safe(record.description)}</td>
                    <td>${safe(record.date)}</td>
                    <td>${safe(record.type)}</td>
                    <td>${safe(fmt(record.amount))}</td>
                </tr>
            `).join("")

            : '<tr><td colspan="4" class="empty">No finance activity yet.</td></tr>';
    }


    // SETTINGS VALUES

    if ($("businessName")) {
        $("businessName").value = data.settings.name;
    }

    if ($("businessEmail")) {
        $("businessEmail").value = data.settings.email;
    }

    if ($("businessPhone")) {
        $("businessPhone").value = data.settings.phone;
    }

    if ($("currency")) {
        $("currency").value = data.settings.currency;
    }
}


/* ==========================================
   14. INITIALIZE FRONTEND
========================================== */

setText("year", new Date().getFullYear());

render();


/* ==========================================
   15. BACKEND AUTHENTICATION CONFIGURATION
========================================== */

const BMY_API = "https://yefsa-ai-backend.onrender.com";

const bmyAuthScreen = $("authScreen");
const bmyBusinessScreen = $("businessScreen");
const bmySuperAdminScreen = $("superAdminScreen");

const bmySidebar = $("sidebar");
const bmyMain = document.querySelector("main");

const BMY_TOKEN_KEY = "bmy_auth_token";
const BMY_BUSINESSES_KEY = "bmy_businesses";
const BMY_SELECTED_KEY = "bmy_selected_business";
const BMY_PASSWORD_CHANGE_KEY = "bmy_must_change_password";
const BMY_SUPER_ADMIN_KEY = "bmy_is_super_admin";


/* ==========================================
   16. SCREEN NAVIGATION
========================================== */

function bmyHideAllScreens() {

    if (bmyAuthScreen) {
        bmyAuthScreen.hidden = true;
    }

    if (bmyBusinessScreen) {
        bmyBusinessScreen.hidden = true;
    }

    if (bmySuperAdminScreen) {
        bmySuperAdminScreen.hidden = true;
    }

    if (bmySidebar) {
        bmySidebar.hidden = true;
    }

    if (bmyMain) {
        bmyMain.hidden = true;
    }
}


function bmyShowLogin() {

    bmyHideAllScreens();

    if (bmyAuthScreen) {
        bmyAuthScreen.hidden = false;
    }

    const panel = $("bmyPasswordChangePanel");

    if (panel) {
        panel.hidden = true;
    }

    if ($("loginForm")) {
        $("loginForm").hidden = false;
    }

    if ($("registerForm")) {
        $("registerForm").hidden = true;
    }

    if ($("authSwitchButton")) {
        $("authSwitchButton").hidden = true;
    }

    if ($("authSwitchText")) {
        $("authSwitchText").hidden = true;
    }

    setText("authTitle", "Welcome back");

    setText(
        "authDescription",
        "Sign in to manage your business."
    );

    if ($("authError")) {
        $("authError").hidden = true;
    }
}


/* ==========================================
   17. PASSWORD CHANGE SCREEN
========================================== */

function bmyShowPasswordChange() {

    bmyHideAllScreens();

    if (bmyAuthScreen) {
        bmyAuthScreen.hidden = false;
    }

    if ($("loginForm")) {
        $("loginForm").hidden = true;
    }

    if ($("registerForm")) {
        $("registerForm").hidden = true;
    }

    if ($("authSwitchButton")) {
        $("authSwitchButton").hidden = true;
    }

    if ($("authSwitchText")) {
        $("authSwitchText").hidden = true;
    }

    setText("authTitle", "Change your password");

    setText(
        "authDescription",
        "Your account uses a temporary password. Create a new password to continue."
    );

    let panel = $("bmyPasswordChangePanel");

    if (!panel) {

        panel = document.createElement("div");

        panel.id = "bmyPasswordChangePanel";
        panel.className = "auth-card";

        panel.innerHTML = `
            <form id="bmyPasswordChangeForm">

                <div class="form-group">
                    <label for="bmyCurrentPassword">
                        Temporary password
                    </label>

                    <input
                        type="password"
                        id="bmyCurrentPassword"
                        placeholder="Enter your temporary password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="bmyNewPassword">
                        New password
                    </label>

                    <input
                        type="password"
                        id="bmyNewPassword"
                        placeholder="Create a new password"
                        autocomplete="new-password"
                        minlength="8"
                        maxlength="128"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="bmyConfirmPassword">
                        Confirm new password
                    </label>

                    <input
                        type="password"
                        id="bmyConfirmPassword"
                        placeholder="Confirm your new password"
                        autocomplete="new-password"
                        minlength="8"
                        maxlength="128"
                        required
                    >
                </div>

                <p
                    id="bmyPasswordChangeError"
                    class="error-message"
                    hidden
                ></p>

                <button
                    type="submit"
                    id="bmyPasswordChangeButton"
                    class="primary"
                >
                    Change password
                </button>

            </form>
        `;

        bmyAuthScreen.appendChild(panel);

        $("bmyPasswordChangeForm").addEventListener(
            "submit",
            bmyHandlePasswordChange
        );
    }

    panel.hidden = false;
}


/* ==========================================
   18. BACKEND REQUEST FUNCTION
========================================== */

async function bmyRequest(path, options = {}) {

    const token = sessionStorage.getItem(
        BMY_TOKEN_KEY
    );

    let response;

    try {

        response = await fetch(BMY_API + path, {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                        "Authorization": "Bearer " + token
                    }
                    : {}),

                ...(options.headers || {})
            }
        });

    } catch (networkError) {

        const error = new Error(
            "Could not connect to the BMY server. Check your internet connection and try again."
        );

        error.cause = networkError;

        throw error;
    }

    let result;

    try {
        result = await response.json();

    } catch {

        throw new Error(
            "The server returned an invalid response. HTTP " +
            response.status
        );
    }

    if (!response.ok) {

        const error = new Error(
            result.error ||
            "Request could not be completed. HTTP " +
            response.status
        );

        error.status = response.status;
        error.code = result.code;

        throw error;
    }

    return result;
}


/* ==========================================
   19. CONTINUE AFTER LOGIN
========================================== */

function bmyContinueAfterLogin() {

    const mustChangePassword =
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true";

    const isSuperAdmin =
        sessionStorage.getItem(
            BMY_SUPER_ADMIN_KEY
        ) === "true";


    if (mustChangePassword) {
        bmyShowPasswordChange();
        return;
    }


    if (isSuperAdmin) {
        bmyShowSuperAdmin();
        return;
    }


    let businesses = [];

    try {
        businesses = JSON.parse(
            sessionStorage.getItem(
                BMY_BUSINESSES_KEY
            ) || "[]"
        );

    } catch {
        businesses = [];
    }


    if (businesses.length) {

        bmyShowBusinesses(businesses);

    } else {

        toast("No active business account was found.");

        bmyLogout();
    }
}


/* ==========================================
   20. HANDLE PASSWORD CHANGE
========================================== */

async function bmyHandlePasswordChange(event) {

    event.preventDefault();

    const currentPassword =
        $("bmyCurrentPassword").value;

    const newPassword =
        $("bmyNewPassword").value;

    const confirmPassword =
        $("bmyConfirmPassword").value;

    const button =
        $("bmyPasswordChangeButton");

    const errorBox =
        $("bmyPasswordChangeError");

    errorBox.hidden = true;


    if (newPassword.length < 8) {

        errorBox.textContent =
            "Your new password must contain at least 8 characters.";

        errorBox.hidden = false;

        return;
    }


    if (newPassword.length > 128) {

        errorBox.textContent =
            "Your new password is too long.";

        errorBox.hidden = false;

        return;
    }


    if (newPassword !== confirmPassword) {

        errorBox.textContent =
            "The new passwords do not match.";

        errorBox.hidden = false;

        return;
    }


    if (currentPassword === newPassword) {

        errorBox.textContent =
            "Your new password must be different from the temporary password.";

        errorBox.hidden = false;

        return;
    }


    button.disabled = true;
    button.textContent = "Updating password...";


    try {

        await bmyRequest(
            "/bmy/change-password",
            {
                method: "POST",

                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            }
        );


        sessionStorage.removeItem(
            BMY_PASSWORD_CHANGE_KEY
        );

        $("bmyPasswordChangeForm").reset();

        toast("Password changed successfully.");

        bmyContinueAfterLogin();


    } catch (error) {

        console.error(
            "BMY password change error:",
            error
        );

        errorBox.textContent = error.message;

        errorBox.hidden = false;


    } finally {

        button.disabled = false;

        button.textContent = "Change password";
    }
}


/* ==========================================
   21. SHOW BUSINESS SELECTION
========================================== */

function bmyShowBusinesses(businesses) {

    if (
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }


    bmyHideAllScreens();

    if (bmyBusinessScreen) {
        bmyBusinessScreen.hidden = false;
    }

    const list = $("businessList");

    if (!list) return;


    if (
        !Array.isArray(businesses) ||
        !businesses.length
    ) {

        list.innerHTML =
            "<p>No active businesses found.</p>";

        return;
    }


    list.innerHTML = businesses.map((business, index) => `
        <button
            class="business-option"
            type="button"
            data-business-index="${index}">

            <span>
                <strong>${safe(business.business_name)}</strong>

                <small>
                    ${safe(business.business_type || "Business")}
                    ·
                    ${safe(business.role || "Member")}
                </small>
            </span>

            <span>›</span>

        </button>
    `).join("");


    list.querySelectorAll(
        "[data-business-index]"
    ).forEach(button => {

        button.addEventListener("click", () => {

            const business = businesses[
                Number(button.dataset.businessIndex)
            ];

            if (business) {
                bmySelectBusiness(business);
            }
        });
    });
}


/* ==========================================
   22. SHOW SUPER ADMIN DASHBOARD
========================================== */

function bmyShowSuperAdmin() {

    if (
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }


    if (!bmySuperAdminScreen) {

        console.error(
            "Super Admin screen is missing from indexbmy.html."
        );

        bmyShowLogin();

        toast(
            "Super Admin screen is missing. Check the HTML dashboard section."
        );

        return;
    }


    bmyHideAllScreens();

    bmySuperAdminScreen.hidden = false;

    bmyLoadSuperAdminDashboard();
}


/* ==========================================
   23. LOAD SUPER ADMIN DASHBOARD
========================================== */

async function bmyLoadSuperAdminDashboard() {

    const refreshButton =
        $("superAdminRefresh");

    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Refreshing...";
    }


    try {

        const result = await bmyRequest(
            "/bmy/admin/dashboard"
        );


        if (
            result.status !== "success" ||
            !result.dashboard
        ) {
            throw new Error(
                "The Super Admin dashboard response is incomplete."
            );
        }


        const dashboard = result.dashboard;


        setText(
            "superAdminBusinessCount",
            dashboard.total_businesses ?? 0
        );

        setText(
            "superAdminUserCount",
            dashboard.total_users ?? 0
        );

        setText(
            "superAdminAdminCount",
            dashboard.total_super_admins ?? 0
        );


        console.log(
            "BMY Super Admin dashboard loaded."
        );


    } catch (error) {

        console.error(
            "BMY Super Admin dashboard error:",
            error
        );


        if (
            error.code === "password_change_required"
        ) {

            sessionStorage.setItem(
                BMY_PASSWORD_CHANGE_KEY,
                "true"
            );

            bmyShowPasswordChange();

            return;
        }


        if (
            error.status === 401 ||
            error.status === 403
        ) {

            bmyLogout();

            return;
        }


        toast(
            error.message ||
            "Could not load Super Admin dashboard."
        );


    } finally {

        if (refreshButton) {

            refreshButton.disabled = false;

            refreshButton.textContent = "Refresh";
        }
    }
}


/* ==========================================
   24. CREATE BUSINESS
========================================== */

async function bmyCreateBusiness(event) {

    event.preventDefault();

    const form =
        $("superAdminBusinessForm");

    const button =
        $("superAdminCreateButton");

    const errorBox =
        $("superAdminError");

    const resultBox =
        $("superAdminResult");

    const resultDetails =
        $("superAdminResultDetails");


    errorBox.hidden = true;

    resultBox.hidden = true;

    resultDetails.replaceChildren();


    const businessName =
        $("superAdminBusinessName").value.trim();

    const businessType =
        $("superAdminBusinessType").value;

    const ownerName =
        $("superAdminOwnerName").value.trim();

    const ownerEmail =
        $("superAdminOwnerEmail").value.trim();

    const businessEmail =
        $("superAdminBusinessEmail").value.trim();

    const businessPhone =
        $("superAdminBusinessPhone").value.trim();

    const businessAddress =
        $("superAdminBusinessAddress").value.trim();

    const currency =
        $("superAdminCurrency").value;


    if (
        !businessName ||
        !ownerName ||
        !ownerEmail
    ) {

        errorBox.textContent =
            "Business name, owner name and owner email are required.";

        errorBox.hidden = false;

        return;
    }


    button.disabled = true;

    button.textContent = "Creating business...";


    try {

        const result = await bmyRequest(
            "/bmy/admin/businesses",
            {
                method: "POST",

                body: JSON.stringify({

                    business_name: businessName,

                    business_type: businessType,

                    owner_full_name: ownerName,

                    owner_email: ownerEmail,

                    business_email: businessEmail,

                    business_phone: businessPhone,

                    business_address: businessAddress,

                    currency: currency

                })
            }
        );


        if (
            result.status !== "success" ||
            !result.business ||
            !result.owner
        ) {

            throw new Error(
                result.error ||
                result.message ||
                "Business creation response was incomplete."
            );
        }


        // BUSINESS CREATION SUCCEEDED

        form.reset();

        resultBox.hidden = false;


        const heading =
            document.createElement("h3");

        heading.textContent =
            "Business created successfully";


        const message =
            document.createElement("p");

        message.textContent =
            result.message ||
            "Business and owner account created successfully.";


        const businessInfo =
            document.createElement("p");

        businessInfo.textContent =
            `Business: ${result.business.business_name} (ID: ${result.business.business_id})`;


        const ownerInfo =
            document.createElement("p");

        ownerInfo.textContent =
            `Owner: ${result.owner.full_name} (${result.owner.email})`;


        const statusInfo =
            document.createElement("p");

        statusInfo.textContent =
            `Account status: ${result.owner.account_status || "active"}`;


        resultDetails.append(
            heading,
            message,
            businessInfo,
            ownerInfo,
            statusInfo
        );


        // TEMPORARY OWNER CREDENTIALS

        const credentials =
            result.credentials;


        const credentialsHeading =
            document.createElement("h4");

        credentialsHeading.textContent =
            "Owner login credentials";

        resultDetails.appendChild(
            credentialsHeading
        );


        if (
            credentials &&
            credentials.temporary_password
        ) {

            const credentialsEmail =
                document.createElement("p");

            credentialsEmail.textContent =
                `Login email: ${credentials.email || result.owner.email}`;


            const passwordLabel =
                document.createElement("p");

            passwordLabel.textContent =
                "Temporary password:";


            const passwordValue =
                document.createElement("code");

            passwordValue.textContent =
                credentials.temporary_password;

            passwordValue.style.display = "block";

            passwordValue.style.padding = "12px";

            passwordValue.style.margin = "8px 0";

            passwordValue.style.overflowWrap = "anywhere";


            const instruction =
                document.createElement("p");

            instruction.textContent =
                credentials.instruction ||
                "Share these credentials securely with the business owner. They must change the temporary password when they first log in.";


            resultDetails.append(
                credentialsEmail,
                passwordLabel,
                passwordValue,
                instruction
            );


        } else {

            const warning =
                document.createElement("p");

            warning.textContent =
                "The business was created, but the server did not return the temporary password. Do not retry business creation. Check the server response before proceeding.";

            resultDetails.appendChild(warning);
        }


        toast("Business created successfully.");


        // REFRESH PLATFORM STATISTICS

        await bmyLoadSuperAdminDashboard();


    } catch (error) {

        console.error(
            "BMY business creation error:",
            error
        );


        errorBox.textContent =
            error.message ||
            "Business creation failed.";

        errorBox.hidden = false;


        if (
            error.code === "password_change_required"
        ) {

            sessionStorage.setItem(
                BMY_PASSWORD_CHANGE_KEY,
                "true"
            );

            bmyShowPasswordChange();


        } else if (
            error.status === 401 ||
            error.status === 403
        ) {

            bmyLogout();
        }


    } finally {

        button.disabled = false;

        button.textContent = "Create business";
    }
}


/* ==========================================
   25. SUPER ADMIN EVENT LISTENERS
========================================== */

if ($("superAdminRefresh")) {

    $("superAdminRefresh").addEventListener(
        "click",
        bmyLoadSuperAdminDashboard
    );
}


if ($("superAdminLogout")) {

    $("superAdminLogout").addEventListener(
        "click",
        bmyLogout
    );
}


if ($("superAdminBusinessForm")) {

    $("superAdminBusinessForm").addEventListener(
        "submit",
        bmyCreateBusiness
    );
}


/* ==========================================
   26. LOGIN AND AUTHENTICATION
========================================== */

// Public registration is disabled.
// Only the Super Admin can create BMY business accounts.

const authSwitchButton =
    $("authSwitchButton");

const authSwitchText =
    $("authSwitchText");


function bmySetAuthMode() {

    if ($("loginForm")) {
        $("loginForm").hidden = false;
    }

    if ($("registerForm")) {
        $("registerForm").hidden = true;
    }

    setText("authTitle", "Welcome back");

    setText(
        "authDescription",
        "Sign in to manage your business."
    );

    if (authSwitchButton) {
        authSwitchButton.hidden = true;
    }

    if (authSwitchText) {
        authSwitchText.hidden = true;
    }

    if ($("authError")) {
        $("authError").hidden = true;
    }

    if ($("registerError")) {
        $("registerError").hidden = true;
    }
}


// REMOVE PUBLIC REGISTRATION

if ($("registerForm")) {
    $("registerForm").hidden = true;
}

if (authSwitchButton) {
    authSwitchButton.hidden = true;
}

if (authSwitchText) {
    authSwitchText.hidden = true;
}


// SAVE AUTHENTICATION SESSION

function bmySaveAuthSession(response) {

    if (
        response.status !== "success" ||
        !response.token ||
        !Array.isArray(response.businesses)
    ) {

        console.error(
            "Unexpected BMY authentication response:",
            response
        );

        throw new Error(
            "Authentication response mismatch."
        );
    }


    sessionStorage.setItem(
        BMY_TOKEN_KEY,
        response.token
    );


    sessionStorage.setItem(
        BMY_BUSINESSES_KEY,
        JSON.stringify(response.businesses)
    );


    sessionStorage.setItem(
        BMY_SUPER_ADMIN_KEY,
        response.is_super_admin === true
            ? "true"
            : "false"
    );


    sessionStorage.removeItem(
        BMY_SELECTED_KEY
    );


    if (response.must_change_password === true) {

        sessionStorage.setItem(
            BMY_PASSWORD_CHANGE_KEY,
            "true"
        );

    } else {

        sessionStorage.removeItem(
            BMY_PASSWORD_CHANGE_KEY
        );
    }
}


// LOGIN FORM

if ($("loginForm")) {

    $("loginForm").addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const button =
                $("loginButton");

            const errorBox =
                $("authError");

            const email =
                $("loginEmail").value.trim();

            const password =
                $("loginPassword").value;


            errorBox.hidden = true;

            button.disabled = true;

            button.textContent = "Signing in...";


            try {

                const response = await bmyRequest(
                    "/bmy/auth/login",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );


                bmySaveAuthSession(response);

                $("loginPassword").value = "";

                bmyContinueAfterLogin();


            } catch (error) {

                console.error(
                    "BMY login error:",
                    error
                );

                errorBox.textContent =
                    error.message;

                errorBox.hidden = false;


            } finally {

                button.disabled = false;

                button.textContent = "Sign in";
            }
        }
    );
}


/* ==========================================
   27. SELECT BUSINESS
========================================== */

async function bmySelectBusiness(business) {

    if (
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true"
    ) {

        bmyShowPasswordChange();

        return;
    }


    const list =
        $("businessList");

    if (list) {

        list.querySelectorAll("button").forEach(button => {
            button.disabled = true;
        });
    }


    try {

        await bmyRequest(
            `/bmy/business/${business.business_id}/access`
        );


        sessionStorage.setItem(
            BMY_SELECTED_KEY,
            JSON.stringify(business)
        );


        bmyOpenWorkspace(business);


    } catch (error) {

        console.error(
            "BMY business selection error:",
            error
        );


        if (
            error.code === "password_change_required"
        ) {

            sessionStorage.setItem(
                BMY_PASSWORD_CHANGE_KEY,
                "true"
            );

            bmyShowPasswordChange();


        } else if (
            error.status === 401 ||
            error.status === 403
        ) {

            bmyLogout();


        } else {

            toast(error.message);

            let businesses = [];

            try {

                businesses = JSON.parse(
                    sessionStorage.getItem(
                        BMY_BUSINESSES_KEY
                    ) || "[]"
                );

            } catch {
                businesses = [];
            }

            bmyShowBusinesses(businesses);
        }
    }
}


/* ==========================================
   28. LOAD LIVE BUSINESS DASHBOARD
========================================== */

async function bmyLoadDashboard() {

    let business = null;

    try {

        business = JSON.parse(
            sessionStorage.getItem(
                BMY_SELECTED_KEY
            ) || "null"
        );

    } catch {
        business = null;
    }


    if (!business) return;


    try {

        const result = await bmyRequest(
            `/bmy/business/${business.business_id}/dashboard`
        );


        if (
            !result.business ||
            !result.sales ||
            !result.expenses ||
            !result.customers ||
            !result.products
        ) {

            throw new Error(
                "The dashboard response is incomplete."
            );
        }


        const currency =
            result.business.currency || "UGX";


        function money(amount) {
            return `${currency} ${Number(amount || 0).toLocaleString()}`;
        }


        // BUSINESS TOTALS

        setText(
            "revenue",
            money(result.sales.collected_revenue)
        );

        setText(
            "expenses",
            money(result.expenses.total_expenses)
        );

        setText(
            "customerCount",
            result.customers.count ?? 0
        );

        setText(
            "productCount",
            result.products.count ?? 0
        );

        setText(
            "lowStockCount",
            `${result.products.low_stock_count ?? 0} items low on stock`
        );


        // FINANCE SUMMARY

        setText(
            "income",
            money(result.sales.collected_revenue)
        );

        setText(
            "expenseTotal",
            money(result.expenses.total_expenses)
        );

        setText(
            "balance",
            money(result.cash_movement_estimate)
        );


        // RECENT SALES

        const recentSales =
            Array.isArray(result.recent_sales)
                ? result.recent_sales
                : [];


        if ($("recent")) {

            if (recentSales.length) {

                $("recent").innerHTML =
                    recentSales.map(sale => {

                        const saleDate =
                            new Date(sale.sale_date);

                        const formattedDate =
                            isNaN(saleDate.getTime())
                                ? sale.sale_date || "—"
                                : saleDate.toLocaleDateString();

                        return `
                            <tr>
                                <td>Sale #${safe(sale.sale_id)}</td>
                                <td>${safe(formattedDate)}</td>
                                <td>${safe(sale.payment_status || "Sale")}</td>
                                <td>${safe(money(sale.total_amount))}</td>
                            </tr>
                        `;

                    }).join("");


            } else {

                $("recent").innerHTML =
                    '<tr><td colspan="4" class="empty">No transactions yet.</td></tr>';
            }
        }


        console.log(
            "BMY business dashboard loaded from backend."
        );


    } catch (error) {

        console.error(
            "BMY business dashboard error:",
            error
        );


        if (
            error.code === "password_change_required"
        ) {

            sessionStorage.setItem(
                BMY_PASSWORD_CHANGE_KEY,
                "true"
            );

            bmyShowPasswordChange();

            return;
        }


        if (
            error.status === 401 ||
            error.status === 403
        ) {

            bmyLogout();

            return;
        }


        toast(
            error.message ||
            "Could not load live dashboard data."
        );
    }
}


/* ==========================================
   29. OPEN BUSINESS WORKSPACE
========================================== */

function bmyOpenWorkspace(business) {

    if (
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true"
    ) {

        bmyShowPasswordChange();

        return;
    }


    bmyHideAllScreens();


    if (bmySidebar) {
        bmySidebar.hidden = false;
    }

    if (bmyMain) {
        bmyMain.hidden = false;
    }


    const workspace =
        document.querySelector(".workspace");


    if (workspace) {

        const nameElement =
            workspace.querySelector("strong");

        const typeElement =
            workspace.querySelector("small");


        if (nameElement) {
            nameElement.textContent =
                business.business_name;
        }

        if (typeElement) {
            typeElement.textContent =
                business.business_type ||
                "Business account";
        }
    }


    const logoutButton =
        $("bmyLogout");

    if (logoutButton) {
        logoutButton.hidden = false;
    }


    go("dashboard");

    bmyLoadDashboard();
}


/* ==========================================
   30. LOGOUT
========================================== */

function bmyLogout() {

    sessionStorage.removeItem(BMY_TOKEN_KEY);

    sessionStorage.removeItem(BMY_BUSINESSES_KEY);

    sessionStorage.removeItem(BMY_SELECTED_KEY);

    sessionStorage.removeItem(BMY_PASSWORD_CHANGE_KEY);

    sessionStorage.removeItem(BMY_SUPER_ADMIN_KEY);


    if ($("loginPassword")) {
        $("loginPassword").value = "";
    }

    if ($("bmyPasswordChangeForm")) {
        $("bmyPasswordChangeForm").reset();
    }


    bmyShowLogin();
}


/* ==========================================
   31. BUSINESS WORKSPACE LOGOUT BUTTON
========================================== */

if (!$("bmyLogout")) {

    const bmyLogoutButton =
        document.createElement("button");

    bmyLogoutButton.id = "bmyLogout";

    bmyLogoutButton.className = "nav";

    bmyLogoutButton.type = "button";

    bmyLogoutButton.textContent = "↪ Sign out";


    bmyLogoutButton.addEventListener(
        "click",
        bmyLogout
    );


    const sideBottom =
        document.querySelector(".side-bottom");


    if (sideBottom) {

        sideBottom.appendChild(
            bmyLogoutButton
        );
    }
}


/* ==========================================
   32. RESTORE EXISTING SESSION
========================================== */

async function bmyRestoreSession() {

    const token =
        sessionStorage.getItem(BMY_TOKEN_KEY);


    if (!token) {

        bmyShowLogin();

        return;
    }


    // PASSWORD CHANGE ALWAYS TAKES PRIORITY

    if (
        sessionStorage.getItem(
            BMY_PASSWORD_CHANGE_KEY
        ) === "true"
    ) {

        bmyShowPasswordChange();

        return;
    }


    // RESTORE SUPER ADMIN

    if (
        sessionStorage.getItem(
            BMY_SUPER_ADMIN_KEY
        ) === "true"
    ) {

        bmyShowSuperAdmin();

        return;
    }


    // RESTORE SELECTED BUSINESS

    const selected =
        sessionStorage.getItem(
            BMY_SELECTED_KEY
        );


    if (selected) {

        try {

            const business =
                JSON.parse(selected);


            if (
                !business ||
                !business.business_id
            ) {
                throw new Error(
                    "Saved business information is invalid."
                );
            }


            await bmyRequest(
                `/bmy/business/${business.business_id}/access`
            );


            bmyOpenWorkspace(business);

            return;


        } catch (error) {

            console.error(
                "BMY session verification error:",
                error
            );


            if (
                error.code === "password_change_required"
            ) {

                sessionStorage.setItem(
                    BMY_PASSWORD_CHANGE_KEY,
                    "true"
                );

                bmyShowPasswordChange();

                return;
            }


            if (
                error.status === 401 ||
                error.status === 403
            ) {

                bmyLogout();

                return;
            }


            toast(
                "Could not verify your session. Please try again."
            );

            bmyShowLogin();

            return;
        }
    }


    // OTHERWISE SHOW AVAILABLE BUSINESSES

    let businesses = [];

    try {

        businesses = JSON.parse(
            sessionStorage.getItem(
                BMY_BUSINESSES_KEY
            ) || "[]"
        );

    } catch {
        businesses = [];
    }


    if (businesses.length) {

        bmyShowBusinesses(businesses);

    } else {

        bmyLogout();
    }
}


/* ==========================================
   33. START BMY APPLICATION
========================================== */

bmyRestoreSession();


/* ==========================================
   END OF BMY FRONTEND APPLICATION
========================================== */

/* ==========================================
   34. BMY AI ASSISTANT
========================================== */

// Conversation exists in memory while this page remains open.
// It is reset whenever a different business is selected.

let bmyAIHistory = [];

let bmyAIActiveBusinessId = null;

let bmyAISending = false;

let bmyAIReviewing = false;


/* ==========================================
   AI BUSINESS CONTEXT
========================================== */

function bmyAIGetBusiness() {

    try {

        return JSON.parse(
            sessionStorage.getItem(
                BMY_SELECTED_KEY
            ) || "null"
        );

    } catch {
        return null;
    }
}


function bmyAIGetBusinessId() {

    const business = bmyAIGetBusiness();

    if (!business || !business.business_id) {
        throw new Error(
            "Please select a business before using Yefsa AI."
        );
    }

    const businessId = Number(
        business.business_id
    );

    if (
        !Number.isSafeInteger(businessId) ||
        businessId <= 0
    ) {
        throw new Error(
            "The selected business information is invalid."
        );
    }

    return businessId;
}


/* ==========================================
   AI INITIALIZATION
========================================== */

function bmyAIInitialize(business) {

    if (!business) return;

    const businessId = Number(
        business.business_id
    );

    if (!businessId) return;


    // Prevent conversation history from crossing businesses.

    if (
        bmyAIActiveBusinessId !== businessId
    ) {

        bmyAIHistory = [];

        bmyAIActiveBusinessId = businessId;


        if ($("aiMessages")) {

            $("aiMessages").innerHTML = `
                <div class="ai-message assistant">
                    Hello! I'm Yefsa AI, your business assistant.

                    I can analyse your authorised business records,
                    answer questions about performance, and help
                    identify opportunities for improvement.

                    What would you like to know?
                </div>
            `;
        }


        if ($("aiReviewOutput")) {
            $("aiReviewOutput").textContent = "";
        }


        if ($("aiChatError")) {
            $("aiChatError").hidden = true;
        }


        if ($("aiReviewError")) {
            $("aiReviewError").hidden = true;
        }


        if ($("aiReviewStatus")) {
            $("aiReviewStatus").textContent = "";
        }
    }


    setText(
        "aiBusinessName",
        business.business_name || "Your business"
    );


    setText(
        "aiBusinessStatus",
        "Connected to your selected business"
    );


    // Add styling classes to the existing HTML elements.

    $("aiMessages")?.classList.add(
        "ai-messages"
    );

    $("aiChatForm")?.classList.add(
        "ai-chat-form"
    );

    $("aiChatInput")?.closest(
        ".ai-chat-input-wrap"
    )?.classList.add(
        "ai-chat-input-wrap"
    );

    $("aiReviewOutput")?.classList.add(
        "ai-review-output"
    );
}


/* ==========================================
   AI MESSAGE DISPLAY
========================================== */

function bmyAIRenderInline(text, parent) {

    const pattern =
        /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;

    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {

        if (match.index > lastIndex) {
            parent.appendChild(
                document.createTextNode(
                    text.slice(lastIndex, match.index)
                )
            );
        }

        const token = match[0];
        let element;

        if (
            token.startsWith("**") ||
            token.startsWith("__")
        ) {
            element = document.createElement("strong");
            element.textContent = token.slice(2, -2);

        } else if (token.startsWith("`")) {
            element = document.createElement("code");
            element.textContent = token.slice(1, -1);

        } else {
            element = document.createElement("em");
            element.textContent = token.slice(1, -1);
        }

        parent.appendChild(element);

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        parent.appendChild(
            document.createTextNode(
                text.slice(lastIndex)
            )
        );
    }
}


function bmyAIRenderMarkdown(content, container) {

    const lines = String(content || "").split("\n");

    let i = 0;

    while (i < lines.length) {

        const line = lines[i].trim();

        if (!line) {
            i++;
            continue;
        }

        // TABLES

        if (
            line.includes("|") &&
            i + 1 < lines.length &&
            /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(
                lines[i + 1].trim()
            )
        ) {

            const table = document.createElement("table");
            table.className = "ai-markdown-table";

            const headers = line
                .replace(/^\||\|$/g, "")
                .split("|")
                .map(value => value.trim());

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            headers.forEach(value => {
                const th = document.createElement("th");
                bmyAIRenderInline(value, th);
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            i += 2;

            const tbody = document.createElement("tbody");

            while (
                i < lines.length &&
                lines[i].includes("|") &&
                lines[i].trim()
            ) {

                const values = lines[i]
                    .trim()
                    .replace(/^\||\|$/g, "")
                    .split("|")
                    .map(value => value.trim());

                const row = document.createElement("tr");

                headers.forEach((_, index) => {

                    const td = document.createElement("td");

                    bmyAIRenderInline(
                        values[index] || "",
                        td
                    );

                    row.appendChild(td);
                });

                tbody.appendChild(row);
                i++;
            }

            table.appendChild(tbody);
            container.appendChild(table);

            continue;
        }

        // HEADINGS

        const heading = line.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {

            const level = heading[1].length;

            const element = document.createElement(
                "h" + level
            );

            bmyAIRenderInline(heading[2], element);

            container.appendChild(element);

            i++;
            continue;
        }

        // HORIZONTAL DIVIDER

        if (/^(-{3,}|\*{3,})$/.test(line)) {

            container.appendChild(
                document.createElement("hr")
            );

            i++;
            continue;
        }

        // BULLET LISTS

        if (/^[-*]\s+/.test(line)) {

            const list = document.createElement("ul");

            while (
                i < lines.length &&
                /^[-*]\s+/.test(lines[i].trim())
            ) {

                const item = document.createElement("li");

                bmyAIRenderInline(
                    lines[i].trim().replace(/^[-*]\s+/, ""),
                    item
                );

                list.appendChild(item);
                i++;
            }

            container.appendChild(list);
            continue;
        }

        // NUMBERED LISTS

        if (/^\d+\.\s+/.test(line)) {

            const list = document.createElement("ol");

            while (
                i < lines.length &&
                /^\d+\.\s+/.test(lines[i].trim())
            ) {

                const item = document.createElement("li");

                bmyAIRenderInline(
                    lines[i].trim().replace(/^\d+\.\s+/, ""),
                    item
                );

                list.appendChild(item);
                i++;
            }

            container.appendChild(list);
            continue;
        }

        // BLOCKQUOTES

        if (line.startsWith(">")) {

            const quote = document.createElement("blockquote");

            bmyAIRenderInline(
                line.replace(/^>\s?/, ""),
                quote
            );

            container.appendChild(quote);

            i++;
            continue;
        }

        // NORMAL PARAGRAPHS

        const paragraph = document.createElement("p");

        bmyAIRenderInline(line, paragraph);

        container.appendChild(paragraph);

        i++;
    }
}


function bmyAIAddMessage(role, content) {

    const messages = $("aiMessages");

    if (!messages) return null;

    const message = document.createElement("div");

    message.className =
        "ai-message " + (
            role === "user"
                ? "user"
                : "assistant"
        );

    if (role === "user") {

        message.textContent = String(content || "");

    } else {

        message.classList.add("ai-markdown");

        bmyAIRenderMarkdown(
            content,
            message
        );
    }

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

    return message;
}


/* ==========================================
   AI LOADING INDICATOR
========================================== */

function bmyAIShowTyping() {

    const messages = $("aiMessages");

    if (!messages) return null;


    const typing = document.createElement("div");

    typing.className =
        "ai-message assistant";


    typing.innerHTML = `
        <div class="ai-typing">
            Yefsa AI is analysing

            <span></span>
            <span></span>
            <span></span>
        </div>
    `;


    messages.appendChild(typing);

    messages.scrollTop =
        messages.scrollHeight;


    return typing;
}


/* ==========================================
   AI ERROR HANDLING
========================================== */

function bmyAIHandleError(error, errorElement) {

    console.error(
        "BMY AI error:",
        error
    );


    if (
        error.code === "password_change_required"
    ) {

        sessionStorage.setItem(
            BMY_PASSWORD_CHANGE_KEY,
            "true"
        );

        bmyShowPasswordChange();

        return;
    }


    if (
        error.status === 401 ||
        error.status === 403
    ) {

        bmyLogout();

        return;
    }


    if (errorElement) {

        errorElement.textContent =
            error.message ||
            "Yefsa AI could not complete your request.";

        errorElement.hidden = false;
    }
}


/* ==========================================
   AI CHAT SUBMISSION
========================================== */

async function bmyAISendMessage(message) {

    if (bmyAISending) return;


    const input = $("aiChatInput");

    const sendButton = $("aiSendButton");

    const errorBox = $("aiChatError");


    if (!message || !message.trim()) {
        return;
    }


    const cleanMessage = message.trim();


    if (cleanMessage.length > 5000) {

        if (errorBox) {

            errorBox.textContent =
                "Your message is too long. Please keep it below 5,000 characters.";

            errorBox.hidden = false;
        }

        return;
    }


    if (errorBox) {
        errorBox.hidden = true;
    }


    let businessId;

    try {

        businessId = bmyAIGetBusinessId();

    } catch (error) {

        if (errorBox) {

            errorBox.textContent = error.message;

            errorBox.hidden = false;
        }

        return;
    }


    if (
        bmyAIActiveBusinessId !== businessId
    ) {

        bmyAIInitialize(
            bmyAIGetBusiness()
        );
    }


    bmyAISending = true;


    if (sendButton) {

        sendButton.disabled = true;

        sendButton.textContent = "Sending...";
    }


    if (input) {
        input.disabled = true;
    }


    // Capture previous conversation before adding this message.

    const previousHistory =
        bmyAIHistory.slice(-12);


    // Display the user's message.

    bmyAIAddMessage(
        "user",
        cleanMessage
    );


    // Keep conversation history in memory.

    bmyAIHistory.push({
        role: "user",
        content: cleanMessage
    });


    const typing = bmyAIShowTyping();


    try {

        const result = await bmyRequest(
            `/bmy/business/${businessId}/ai/chat`,
            {
                method: "POST",

                body: JSON.stringify({

                    message: cleanMessage,

                    history: previousHistory

                })
            }
        );


        if (
            result.status !== "success" ||
            typeof result.reply !== "string" ||
            !result.reply.trim()
        ) {

            throw new Error(
                result.message ||
                "Yefsa AI returned an incomplete response."
            );
        }


        // Remove loading indicator.

        typing?.remove();


        // Display AI response.

        bmyAIAddMessage(
            "assistant",
            result.reply
        );


        // Store AI response for future conversation context.

        bmyAIHistory.push({
            role: "assistant",
            content: result.reply
        });


        // Keep browser-side history manageable.

        bmyAIHistory =
            bmyAIHistory.slice(-12);


    } catch (error) {

        typing?.remove();

        bmyAIHandleError(
            error,
            errorBox
        );


    } finally {

        bmyAISending = false;


        if (sendButton) {

            sendButton.disabled = false;

            sendButton.textContent = "Send";
        }


        if (input) {

            input.disabled = false;

            input.focus();
        }
    }
}


/* ==========================================
   AI CHAT FORM
========================================== */

if ($("aiChatForm")) {

    $("aiChatForm").addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const input = $("aiChatInput");

            if (!input) return;


            const message = input.value.trim();

            if (!message) return;


            input.value = "";


            bmyAISendMessage(message);
        }
    );
}


/* ==========================================
   AI SUGGESTED PROMPTS
========================================== */

document.addEventListener(
    "click",
    event => {

        const button = event.target.closest(
            "[data-ai-prompt]"
        );

        if (!button) return;


        const prompt =
            button.dataset.aiPrompt;


        if (!prompt) return;


        go("ai");


        const input = $("aiChatInput");

        if (input) {
            input.value = prompt;
        }


        bmyAISendMessage(prompt);
    }
);


/* ==========================================
   CLEAR AI CONVERSATION
========================================== */

if ($("aiClearChat")) {

    $("aiClearChat").addEventListener(
        "click",
        () => {

            if (bmyAISending) return;


            bmyAIHistory = [];


            if ($("aiMessages")) {

                $("aiMessages").innerHTML = `
                    <div class="ai-message assistant">
                        Conversation cleared.

                        I'm ready to help you analyse your business.
                        What would you like to know?
                    </div>
                `;
            }


            if ($("aiChatError")) {
                $("aiChatError").hidden = true;
            }


            toast("AI conversation cleared.");
        }
    );
}


/* ==========================================
   BUSINESS PERFORMANCE REVIEW
========================================== */

async function bmyAIRunReview() {

    if (bmyAIReviewing) return;


    const button =
        $("aiReviewButton");

    const status =
        $("aiReviewStatus");

    const errorBox =
        $("aiReviewError");

    const output =
        $("aiReviewOutput");


    if (errorBox) {
        errorBox.hidden = true;
    }


    if (output) {
        output.textContent = "";
    }


    let businessId;

    try {

        businessId = bmyAIGetBusinessId();

    } catch (error) {

        if (errorBox) {

            errorBox.textContent = error.message;

            errorBox.hidden = false;
        }

        return;
    }


    bmyAIReviewing = true;


    if (button) {

        button.disabled = true;

        button.textContent = "Analysing business...";
    }


    if (status) {

        status.textContent =
            "Yefsa AI is reviewing your business records...";
    }


    try {

        const result = await bmyRequest(
            `/bmy/business/${businessId}/ai/review`,
            {
                method: "POST"
            }
        );


        if (
            result.status !== "success" ||
            typeof result.reply !== "string" ||
            !result.reply.trim()
        ) {

            throw new Error(
                result.message ||
                "Yefsa AI could not generate your business review."
            );
        }


        if (output) {

            output.textContent =
                result.reply;

            output.style.whiteSpace =
                "pre-wrap";
        }


        if (status) {

            status.textContent =
                "Business review completed.";
        }


        toast("Business review completed.");


    } catch (error) {

        bmyAIHandleError(
            error,
            errorBox
        );


        if (status) {
            status.textContent = "";
        }


    } finally {

        bmyAIReviewing = false;


        if (button) {

            button.disabled = false;

            button.textContent =
                "Generate business review";
        }
    }
}


/* ==========================================
   AI REVIEW BUTTON
========================================== */

if ($("aiReviewButton")) {

    $("aiReviewButton").addEventListener(
        "click",
        bmyAIRunReview
    );
}


/* ==========================================
   AI NAVIGATION INITIALIZATION
========================================== */

document.querySelectorAll(
    '.nav[data-page="ai"]'
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            bmyAIInitialize(
                bmyAIGetBusiness()
            );
        }
    );
});


/* ==========================================
   AI WORKSPACE SESSION INITIALIZATION
========================================== */

// Initialize AI whenever a business workspace opens.

const bmyOriginalOpenWorkspace =
    bmyOpenWorkspace;


bmyOpenWorkspace = function(business) {

    bmyOriginalOpenWorkspace(business);

    bmyAIInitialize(business);
};


/* ==========================================
   END BMY AI INTEGRATION
========================================== */