
"use strict";

/* ==========================================
   BMY - BUSINESS MANAGEMENT BY YEFSATECH
   Frontend application
========================================== */


/* ==========================================
   1. LOCAL STORAGE AND DEFAULT DATA
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
        const saved = JSON.parse(localStorage.getItem(KEY) || "null") || {};

        return {
            ...defaults,
            ...saved,
            customers: saved.customers || [],
            employees: saved.employees || [],
            sales: saved.sales || [],
            expenses: saved.expenses || [],
            settings: {
                ...defaults.settings,
                ...(saved.settings || {})
            }
        };
    } catch (error) {
        console.error("BMY storage error:", error);
        return JSON.parse(JSON.stringify(defaults));
    }
}

let data = read();


/* ==========================================
   2. GENERAL HELPERS
========================================== */

function $(id) {
    return document.getElementById(id);
}

function persist() {
    localStorage.setItem(KEY, JSON.stringify(data));
    render();
}

function fmt(amount) {
    return `${data.settings.currency} ${Number(amount || 0).toLocaleString()}`;
}

function date() {
    return new Date().toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
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
   3. NAVIGATION
========================================== */

function go(id) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    $("page-" + id)?.classList.add("active");

    document.querySelectorAll(".nav").forEach(nav => {
        nav.classList.toggle("active", nav.dataset.page === id);
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
    nav.onclick = () => go(nav.dataset.page);
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.onclick = () => go(button.dataset.go);
});

$("menu").onclick = () => {
    $("sidebar").classList.toggle("open");
};


/* ==========================================
   4. CUSTOMER MANAGEMENT
========================================== */

$("customerForm").onsubmit = event => {
    event.preventDefault();

    data.customers.unshift({
        id: crypto.randomUUID(),
        name: $("customerName").value.trim(),
        phone: $("customerPhone").value.trim(),
        email: $("customerEmail").value.trim(),
        date: date()
    });

    event.target.reset();

    persist();

    toast("Customer added.");
};


/* ==========================================
   5. EMPLOYEE MANAGEMENT
========================================== */

$("employeeForm").onsubmit = event => {
    event.preventDefault();

    data.employees.unshift({
        id: crypto.randomUUID(),
        name: $("employeeName").value.trim(),
        role: $("employeeRole").value.trim(),
        phone: $("employeePhone").value.trim(),
        date: date()
    });

    event.target.reset();

    persist();

    toast("Employee added.");
};


/* ==========================================
   6. SALES MANAGEMENT
========================================== */

$("saleForm").onsubmit = event => {
    event.preventDefault();

    const amount = Number($("saleAmount").value);

    if (amount <= 0) {
        return toast("Enter a valid amount.");
    }

    data.sales.unshift({
        id: crypto.randomUUID(),
        description: $("saleDescription").value.trim(),
        customer: $("saleCustomer").value.trim() || "Walk-in customer",
        amount,
        method: $("saleMethod").value,
        date: date(),
        time: Date.now()
    });

    event.target.reset();

    persist();

    toast("Sale recorded.");
};


/* ==========================================
   7. EXPENSE MANAGEMENT
========================================== */

$("expenseForm").onsubmit = event => {
    event.preventDefault();

    const amount = Number($("expenseAmount").value);

    if (amount <= 0) {
        return toast("Enter a valid amount.");
    }

    data.expenses.unshift({
        id: crypto.randomUUID(),
        description: $("expenseDescription").value.trim(),
        amount,
        category: $("expenseCategory").value,
        date: date(),
        time: Date.now()
    });

    event.target.reset();

    persist();

    toast("Expense recorded.");
};


/* ==========================================
   8. RECEIPT GENERATION
========================================== */

$("receiptForm").onsubmit = event => {
    event.preventDefault();

    const amount = Number($("receiptAmount").value);

    if (amount <= 0) {
        return toast("Enter a valid amount.");
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
};


/* ==========================================
   9. BUSINESS SETTINGS
========================================== */

$("settingsForm").onsubmit = event => {
    event.preventDefault();

    data.settings = {
        name: $("businessName").value.trim() || "My Business",
        email: $("businessEmail").value.trim(),
        phone: $("businessPhone").value.trim(),
        currency: $("currency").value
    };

    persist();

    toast("Workspace details saved.");
};


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

    link.click();

    URL.revokeObjectURL(url);
}

$("export").onclick = exportBackup;
$("backup").onclick = exportBackup;


/* ==========================================
   12. SEARCH
========================================== */

$("search").onkeydown = event => {
    if (event.key !== "Enter") return;

    const query = event.target.value.toLowerCase().trim();

    if (!query) return;

    if (data.customers.some(record =>
        (record.name + record.phone + record.email)
            .toLowerCase()
            .includes(query)
    )) {
        go("customers");

    } else if (data.employees.some(record =>
        (record.name + record.role + record.phone)
            .toLowerCase()
            .includes(query)
    )) {
        go("hr");

    } else if (data.sales.some(record =>
        (record.description + record.customer)
            .toLowerCase()
            .includes(query)
    )) {
        go("sales");

    } else {
        toast("No matching saved record found.");
    }
};


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

    $("revenue").textContent = fmt(incomeTotal);

    $("expenses").textContent = fmt(expenseTotalValue);

    $("customerCount").textContent = data.customers.length;

    // FINANCE TOTALS

    $("income").textContent = fmt(incomeTotal);

    $("expenseTotal").textContent = fmt(expenseTotalValue);

    $("balance").textContent = fmt(
        incomeTotal - expenseTotalValue
    );


    // CUSTOMER DIRECTORY

    $("customerTotal").textContent =
        data.customers.length + " records";

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


    // EMPLOYEE DIRECTORY

    $("employeeTotal").textContent =
        data.employees.length + " records";

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


    // SALES HISTORY

    $("saleTotal").textContent =
        data.sales.length + " records";

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


    // FINANCE TABLE

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


    // SETTINGS VALUES

    $("businessName").value = data.settings.name;

    $("businessEmail").value = data.settings.email;

    $("businessPhone").value = data.settings.phone;

    $("currency").value = data.settings.currency;
}


/* ==========================================
   14. INITIALIZE FRONTEND
========================================== */

$("year").textContent = new Date().getFullYear();

render();

/* ==========================================
   15. BACKEND AUTHENTICATION
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
    bmyAuthScreen.hidden = true;
    bmyBusinessScreen.hidden = true;

    if (bmySuperAdminScreen) {
        bmySuperAdminScreen.hidden = true;
    }

    bmySidebar.hidden = true;
    bmyMain.hidden = true;
}


function bmyShowLogin() {
    bmyHideAllScreens();

    bmyAuthScreen.hidden = false;

    const panel = $("bmyPasswordChangePanel");

    if (panel) {
        panel.hidden = true;
    }

    $("loginForm").hidden = false;
    $("registerForm").hidden = true;

    if ($("authSwitchButton")) {
        $("authSwitchButton").hidden = true;
    }

    if ($("authSwitchText")) {
        $("authSwitchText").hidden = true;
    }

    $("authTitle").textContent = "Welcome back";

    $("authDescription").textContent =
        "Sign in to manage your business.";

    $("authError").hidden = true;
}


/* ==========================================
   17. SHOW PASSWORD CHANGE SCREEN
========================================== */

function bmyShowPasswordChange() {
    bmyHideAllScreens();

    bmyAuthScreen.hidden = false;

    $("loginForm").hidden = true;
    $("registerForm").hidden = true;

    if ($("authSwitchButton")) {
        $("authSwitchButton").hidden = true;
    }

    if ($("authSwitchText")) {
        $("authSwitchText").hidden = true;
    }

    $("authTitle").textContent = "Change your password";

    $("authDescription").textContent =
        "Your account uses a temporary password. Create a new password to continue.";

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
    const token = sessionStorage.getItem(BMY_TOKEN_KEY);

    const response = await fetch(BMY_API + path, {
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

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            "The server returned an invalid response."
        );
    }

    if (!response.ok) {
        const error = new Error(
            result.error || "Request could not be completed."
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
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true";

    const isSuperAdmin =
        sessionStorage.getItem(BMY_SUPER_ADMIN_KEY) === "true";

    if (mustChangePassword) {
        bmyShowPasswordChange();
        return;
    }

    if (isSuperAdmin) {
        bmyShowSuperAdmin();
        return;
    }

    const businesses = JSON.parse(
        sessionStorage.getItem(BMY_BUSINESSES_KEY) || "[]"
    );

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

    const currentPassword = $("bmyCurrentPassword").value;
    const newPassword = $("bmyNewPassword").value;
    const confirmPassword = $("bmyConfirmPassword").value;

    const button = $("bmyPasswordChangeButton");
    const errorBox = $("bmyPasswordChangeError");

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
        await bmyRequest("/bmy/account/change-password", {
            method: "POST",

            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });

        sessionStorage.removeItem(BMY_PASSWORD_CHANGE_KEY);

        $("bmyPasswordChangeForm").reset();

        toast("Password changed successfully.");

        // Super Admins must continue to the admin dashboard.
        // Ordinary users continue to business selection.

        bmyContinueAfterLogin();

    } catch (error) {
        console.error("BMY password change error:", error);

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
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }

    bmyHideAllScreens();

    bmyBusinessScreen.hidden = false;

    const list = $("businessList");

    if (!Array.isArray(businesses) || !businesses.length) {
        list.innerHTML = "<p>No active businesses found.</p>";
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

    list.querySelectorAll("[data-business-index]").forEach(button => {
        button.addEventListener("click", () => {
            const business = businesses[
                Number(button.dataset.businessIndex)
            ];

            bmySelectBusiness(business);
        });
    });
}


/* ==========================================
   22. SHOW SUPER ADMIN DASHBOARD
========================================== */

function bmyShowSuperAdmin() {
    if (
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true"
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
    const refreshButton = $("superAdminRefresh");

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

        $("superAdminBusinessCount").textContent =
            dashboard.total_businesses ?? 0;

        $("superAdminUserCount").textContent =
            dashboard.total_users ?? 0;

        $("superAdminAdminCount").textContent =
            dashboard.total_super_admins ?? 0;

        console.log("BMY Super Admin dashboard loaded.");

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
            error.message || "Could not load Super Admin dashboard."
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

    const form = $("superAdminBusinessForm");
    const button = $("superAdminCreateButton");
    const errorBox = $("superAdminError");
    const resultBox = $("superAdminResult");
    const resultDetails = $("superAdminResultDetails");

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

    if (!businessName || !ownerName || !ownerEmail) {
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
                    currency
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

        // Business creation succeeded.
        // Display the returned information.

        form.reset();

        resultBox.hidden = false;

        const heading = document.createElement("h3");
        heading.textContent = "Business created successfully";

        const message = document.createElement("p");
        message.textContent =
            result.message ||
            "Business and owner account created successfully.";

        const businessInfo = document.createElement("p");
        businessInfo.textContent =
            `Business: ${result.business.business_name} (ID: ${result.business.business_id})`;

        const ownerInfo = document.createElement("p");
        ownerInfo.textContent =
            `Owner: ${result.owner.full_name} (${result.owner.email})`;

        const statusInfo = document.createElement("p");
        statusInfo.textContent =
            `Account status: ${result.owner.account_status || "active"}`;

        resultDetails.append(
            heading,
            message,
            businessInfo,
            ownerInfo,
            statusInfo
        );

        // =================================
        // TEMPORARY OWNER CREDENTIALS
        // =================================

        const credentials = result.credentials;

        const credentialsHeading = document.createElement("h4");
        credentialsHeading.textContent =
            "Owner login credentials";

        resultDetails.appendChild(credentialsHeading);

        if (
            credentials &&
            credentials.temporary_password
        ) {
            const credentialsEmail = document.createElement("p");

            credentialsEmail.textContent =
                `Login email: ${credentials.email || result.owner.email}`;

            const passwordLabel = document.createElement("p");
            passwordLabel.textContent =
                "Temporary password:";

            const passwordValue = document.createElement("code");
            passwordValue.textContent =
                credentials.temporary_password;

            passwordValue.style.display = "block";
            passwordValue.style.padding = "12px";
            passwordValue.style.margin = "8px 0";
            passwordValue.style.overflowWrap = "anywhere";

            const instruction = document.createElement("p");

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
            const warning = document.createElement("p");

            warning.textContent =
                "The business was created, but the server did not return the temporary password. Do not retry business creation. Check the server response before proceeding.";

            resultDetails.appendChild(warning);
        }

        toast("Business created successfully.");

        // Refresh platform statistics.

        await bmyLoadSuperAdminDashboard();

    } catch (error) {
        console.error(
            "BMY business creation error:",
            error
        );

        errorBox.textContent =
            error.message || "Business creation failed.";

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

const authSwitchButton = $("authSwitchButton");
const authSwitchText = $("authSwitchText");

let authMode = "login";


function bmySetAuthMode(mode) {
    authMode = mode;

    $("loginForm").hidden = false;
    $("registerForm").hidden = true;

    $("authTitle").textContent = "Welcome back";

    $("authDescription").textContent =
        "Sign in to manage your business.";

    if (authSwitchButton) {
        authSwitchButton.hidden = true;
    }

    if (authSwitchText) {
        authSwitchText.hidden = true;
    }

    $("authError").hidden = true;
    $("registerError").hidden = true;
}


// Remove public registration from the interface.

$("registerForm").hidden = true;

if (authSwitchButton) {
    authSwitchButton.hidden = true;
}

if (authSwitchText) {
    authSwitchText.hidden = true;
}


// Save authentication and account information.

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
        response.is_super_admin === true ? "true" : "false"
    );

    sessionStorage.removeItem(BMY_SELECTED_KEY);

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


// LOGIN

$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("loginButton");
    const errorBox = $("authError");

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

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
        console.error("BMY login error:", error);

        errorBox.textContent = error.message;
        errorBox.hidden = false;

    } finally {
        button.disabled = false;
        button.textContent = "Sign in";
    }
});


/* ==========================================
   27. SELECT BUSINESS
========================================== */

async function bmySelectBusiness(business) {
    if (
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }

    const list = $("businessList");

    list.querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

    try {
        await bmyRequest(
            `/bmy/account/business/${business.business_id}/access`
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

        if (error.code === "password_change_required") {
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

            bmyShowBusinesses(
                JSON.parse(
                    sessionStorage.getItem(BMY_BUSINESSES_KEY) || "[]"
                )
            );
        }
    }
}


/* ==========================================
   28. LOAD LIVE BUSINESS DASHBOARD
========================================== */

async function bmyLoadDashboard() {
    const business = JSON.parse(
        sessionStorage.getItem(BMY_SELECTED_KEY) || "null"
    );

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

        $("revenue").textContent =
            money(result.sales.collected_revenue);

        $("expenses").textContent =
            money(result.expenses.total_expenses);

        $("customerCount").textContent =
            result.customers.count ?? 0;

        $("productCount").textContent =
            result.products.count ?? 0;

        $("lowStockCount").textContent =
            `${result.products.low_stock_count ?? 0} items low on stock`;


        // FINANCE SUMMARY

        $("income").textContent =
            money(result.sales.collected_revenue);

        $("expenseTotal").textContent =
            money(result.expenses.total_expenses);

        $("balance").textContent =
            money(result.cash_movement_estimate);


        // RECENT SALES

        const recentSales = Array.isArray(result.recent_sales)
            ? result.recent_sales
            : [];

        if (recentSales.length) {
            $("recent").innerHTML = recentSales.map(sale => {
                const saleDate = new Date(sale.sale_date);

                const formattedDate = isNaN(saleDate.getTime())
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

        console.log(
            "BMY business dashboard loaded from backend."
        );

    } catch (error) {
        console.error(
            "BMY business dashboard error:",
            error
        );

        if (error.code === "password_change_required") {
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

        toast("Could not load live dashboard data.");
    }
}


/* ==========================================
   29. OPEN BUSINESS WORKSPACE
========================================== */

function bmyOpenWorkspace(business) {
    if (
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }

    bmyHideAllScreens();

    bmySidebar.hidden = false;
    bmyMain.hidden = false;

    const workspace = document.querySelector(".workspace");

    if (workspace) {
        const nameElement = workspace.querySelector("strong");
        const typeElement = workspace.querySelector("small");

        if (nameElement) {
            nameElement.textContent =
                business.business_name;
        }

        if (typeElement) {
            typeElement.textContent =
                business.business_type || "Business account";
        }
    }

    const logoutButton = $("bmyLogout");

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

    $("loginPassword").value = "";

    if ($("bmyPasswordChangeForm")) {
        $("bmyPasswordChangeForm").reset();
    }

    bmyShowLogin();
}


/* ==========================================
   31. CREATE BUSINESS WORKSPACE LOGOUT
========================================== */

const bmyLogoutButton = document.createElement("button");

bmyLogoutButton.id = "bmyLogout";
bmyLogoutButton.className = "nav";
bmyLogoutButton.type = "button";
bmyLogoutButton.textContent = "↪ Sign out";

bmyLogoutButton.addEventListener(
    "click",
    bmyLogout
);

const sideBottom = document.querySelector(".side-bottom");

if (sideBottom) {
    sideBottom.appendChild(bmyLogoutButton);
}


/* ==========================================
   32. RESTORE EXISTING SESSION
========================================== */

async function bmyRestoreSession() {
    const token = sessionStorage.getItem(BMY_TOKEN_KEY);

    if (!token) {
        bmyShowLogin();
        return;
    }

    // Password change always takes priority.

    if (
        sessionStorage.getItem(BMY_PASSWORD_CHANGE_KEY) === "true"
    ) {
        bmyShowPasswordChange();
        return;
    }

    // Restore Super Admin directly to the admin dashboard.

    if (
        sessionStorage.getItem(BMY_SUPER_ADMIN_KEY) === "true"
    ) {
        bmyShowSuperAdmin();
        return;
    }

    // Restore an already selected business.

    const selected = sessionStorage.getItem(BMY_SELECTED_KEY);

    if (selected) {
        try {
            const business = JSON.parse(selected);

            await bmyRequest(
                `/bmy/account/business/${business.business_id}/access`
            );

            bmyOpenWorkspace(business);
            return;

        } catch (error) {
            console.error(
                "BMY session verification error:",
                error
            );

            if (error.code === "password_change_required") {
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

    // Otherwise show the user's available businesses.

    const businesses = JSON.parse(
        sessionStorage.getItem(BMY_BUSINESSES_KEY) || "[]"
    );

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