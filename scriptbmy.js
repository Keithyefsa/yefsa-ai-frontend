/* BMY frontend prototype. Local browser storage only. Backend/auth integration comes later. */
const KEY="yefsatech_bmy_v1";
const defaults={customers:[],employees:[],sales:[],expenses:[],settings:{name:"My Business",email:"",phone:"",currency:"UGX"}};
let data=read();
function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)),settings:{...defaults.settings,...(JSON.parse(localStorage.getItem(KEY))?.settings||{})}}}catch{return structuredClone(defaults)}}
function persist(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function fmt(n){return `${data.settings.currency} ${Number(n||0).toLocaleString()}`}
function date(){return new Date().toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){let t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2300)}
function go(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.getElementById("page-"+id)?.classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));let n=document.querySelector(`.nav[data-page="${id}"]`);document.getElementById("crumb").textContent=n?n.textContent.trim():"Dashboard";document.getElementById("sidebar").classList.remove("open");scrollTo(0,0)}
document.querySelectorAll(".nav[data-page]").forEach(n=>n.onclick=()=>go(n.dataset.page));
document.querySelectorAll("[data-go]").forEach(n=>n.onclick=()=>go(n.dataset.go));
document.getElementById("menu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("customerForm").onsubmit=e=>{e.preventDefault();data.customers.unshift({id:crypto.randomUUID(),name:customerName.value.trim(),phone:customerPhone.value.trim(),email:customerEmail.value.trim(),date:date()});e.target.reset();persist();toast("Customer added.")};
document.getElementById("employeeForm").onsubmit=e=>{e.preventDefault();data.employees.unshift({id:crypto.randomUUID(),name:employeeName.value.trim(),role:employeeRole.value.trim(),phone:employeePhone.value.trim(),date:date()});e.target.reset();persist();toast("Employee added.")};
document.getElementById("saleForm").onsubmit=e=>{e.preventDefault();let amount=Number(saleAmount.value);if(amount<=0)return toast("Enter a valid amount.");data.sales.unshift({id:crypto.randomUUID(),description:saleDescription.value.trim(),customer:saleCustomer.value.trim()||"Walk-in customer",amount,method:saleMethod.value,date:date(),time:Date.now()});e.target.reset();persist();toast("Sale recorded.")};
document.getElementById("expenseForm").onsubmit=e=>{e.preventDefault();let amount=Number(expenseAmount.value);if(amount<=0)return toast("Enter a valid amount.");data.expenses.unshift({id:crypto.randomUUID(),description:expenseDescription.value.trim(),amount,category:expenseCategory.value,date:date(),time:Date.now()});e.target.reset();persist();toast("Expense recorded.")};
document.getElementById("receiptForm").onsubmit=e=>{e.preventDefault();let amount=Number(receiptAmount.value);if(amount<=0)return toast("Enter a valid amount.");let no="BMY-"+Date.now();receiptPreview.innerHTML=`<div class="receipt"><h2>BMY | BY YEFSATECH</h2><p>PAYMENT RECEIPT<br>Receipt number: ${safe(no)}<br>Date: ${safe(date())}<br>Received from: ${safe(receiptCustomer.value)}<br>Phone: ${safe(receiptPhone.value||"Not provided")}<br>Description: ${safe(receiptNote.value||"Payment received")}<br>Method: ${safe(receiptMethod.value)}</p><strong>${safe(fmt(amount))}</strong><p>Thank you for your payment.</p><button class="primary" onclick="window.print()">Print receipt</button></div>`;toast("Receipt generated.")};
document.getElementById("settingsForm").onsubmit=e=>{e.preventDefault();data.settings={name:businessName.value.trim()||"My Business",email:businessEmail.value.trim(),phone:businessPhone.value.trim(),currency:currency.value};persist();toast("Workspace details saved.")};
document.addEventListener("click",e=>{let b=e.target.closest("[data-remove]");if(!b)return;let type=b.dataset.remove;data[type]=data[type].filter(x=>x.id!==b.dataset.id);persist();toast("Record removed.")});
function exportBackup(){let blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),...data},null,2)],{type:"application/json"});let u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="bmy-workspace-backup.json";a.click();URL.revokeObjectURL(u)}
document.getElementById("export").onclick=exportBackup;document.getElementById("backup").onclick=exportBackup;
document.getElementById("search").onkeydown=e=>{if(e.key!=="Enter")return;let q=e.target.value.toLowerCase().trim();if(!q)return;if(data.customers.some(x=>(x.name+x.phone+x.email).toLowerCase().includes(q)))go("customers");else if(data.employees.some(x=>(x.name+x.role+x.phone).toLowerCase().includes(q)))go("hr");else if(data.sales.some(x=>(x.description+x.customer).toLowerCase().includes(q)))go("sales");else toast("No matching saved record found.")};
function render(){let income=data.sales.reduce((s,x)=>s+x.amount,0),cost=data.expenses.reduce((s,x)=>s+x.amount,0);
revenue.textContent=fmt(income);expenses.textContent=fmt(cost);customerCount.textContent=data.customers.length;employeeCount.textContent=data.employees.length;income.textContent=fmt(income);expenseTotal.textContent=fmt(cost);balance.textContent=fmt(income-cost);
customerTotal.textContent=data.customers.length+" records";customers.innerHTML=data.customers.length?data.customers.map(x=>`<tr><td>${safe(x.name)}</td><td>${safe(x.phone||"—")}</td><td>${safe(x.email||"—")}</td><td>${safe(x.date)}</td><td><button class="delete" data-remove="customers" data-id="${x.id}">Remove</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty">No customers saved yet.</td></tr>';
employeeTotal.textContent=data.employees.length+" records";employees.innerHTML=data.employees.length?data.employees.map(x=>`<tr><td>${safe(x.name)}</td><td>${safe(x.role)}</td><td>${safe(x.phone||"—")}</td><td>${safe(x.date)}</td><td><button class="delete" data-remove="employees" data-id="${x.id}">Remove</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty">No employees saved yet.</td></tr>';
saleTotal.textContent=data.sales.length+" records";sales.innerHTML=data.sales.length?data.sales.map(x=>`<tr><td>${safe(x.description)}</td><td>${safe(x.customer)}</td><td>${safe(x.date)}</td><td>${safe(x.method)}</td><td>${safe(fmt(x.amount))}</td></tr>`).join(""):'<tr><td colspan="5" class="empty">No sales recorded yet.</td></tr>';
let activity=[...data.sales.map(x=>({...x,type:"Income"})),...data.expenses.map(x=>({...x,type:"Expense"}))].sort((a,b)=>(b.time||0)-(a.time||0));
recent.innerHTML=activity.length?activity.slice(0,5).map(x=>`<tr><td>${safe(x.description)}</td><td>${safe(x.date)}</td><td>${x.type}</td><td>${safe(fmt(x.amount))}</td></tr>`).join(""):'<tr><td colspan="4" class="empty">No transactions yet.</td></tr>';
financeRows.innerHTML=activity.length?activity.map(x=>`<tr><td>${safe(x.description)}</td><td>${safe(x.date)}</td><td>${x.type}</td><td>${safe(fmt(x.amount))}</td></tr>`).join(""):'<tr><td colspan="4" class="empty">No finance activity yet.</td></tr>';
businessName.value=data.settings.name;businessEmail.value=data.settings.email;businessPhone.value=data.settings.phone;currency.value=data.settings.currency}
document.getElementById("year").textContent=new Date().getFullYear();render();

/* ==========================================
   BMY AUTHENTICATION & BUSINESS ACCESS
========================================== */

const BMY_API = "https://yefsa-ai-backend.onrender.com";

const bmyAuthScreen = document.getElementById("authScreen");
const bmyBusinessScreen = document.getElementById("businessScreen");
const bmySidebar = document.getElementById("sidebar");
const bmyMain = document.querySelector("main");

const BMY_TOKEN_KEY = "bmy_auth_token";
const BMY_BUSINESSES_KEY = "bmy_businesses";
const BMY_SELECTED_KEY = "bmy_selected_business";

function bmyShowLogin() {
    bmyAuthScreen.hidden = false;
    bmyBusinessScreen.hidden = true;
    bmySidebar.hidden = true;
    bmyMain.hidden = true;
}

function bmyShowBusinesses(businesses) {
    bmyAuthScreen.hidden = true;
    bmyBusinessScreen.hidden = false;
    bmySidebar.hidden = true;
    bmyMain.hidden = true;

    const list = document.getElementById("businessList");

    if (!businesses.length) {
        list.innerHTML = "<p>No active businesses found.</p>";
        return;
    }

    list.innerHTML = businesses.map((business, index) => `
        <button class="business-option"
            type="button"
            data-business-index="${index}">
            <span>
                <strong>${safe(business.business_name)}</strong>
                <small>${safe(business.business_type || "Business")} · ${safe(business.role || "Member")}</small>
            </span>
            <span>›</span>
        </button>
    `).join("");

    list.querySelectorAll("[data-business-index]").forEach(button => {
        button.addEventListener("click", () => {
            const business = businesses[Number(button.dataset.businessIndex)];
            bmySelectBusiness(business);
        });
    });
}

async function bmyRequest(path, options = {}) {
    const token = sessionStorage.getItem(BMY_TOKEN_KEY);

    const response = await fetch(BMY_API + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? {
                "Authorization": "Bearer " + token
            } : {}),
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        const error = new Error(
            result.error || "Request could not be completed."
        );
        error.status = response.status;
        throw error;
    }

    return result;
}

document.getElementById("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = document.getElementById("loginButton");
    const errorBox = document.getElementById("authError");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    errorBox.hidden = true;
    button.disabled = true;
    button.textContent = "Signing in...";

    try {
        const response = await bmyRequest("/bmy/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (
            response.status !== "success" ||
            !response.token ||
            !Array.isArray(response.businesses)
        ) {
            throw new Error("Unexpected login response from server.");
        }

        sessionStorage.setItem(BMY_TOKEN_KEY, response.token);
        sessionStorage.setItem(
            BMY_BUSINESSES_KEY,
            JSON.stringify(response.businesses)
        );

        sessionStorage.removeItem(BMY_SELECTED_KEY);

        document.getElementById("loginPassword").value = "";

        bmyShowBusinesses(response.businesses);

    } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
    } finally {
        button.disabled = false;
        button.textContent = "Sign in";
    }
});

async function bmySelectBusiness(business) {
    const list = document.getElementById("businessList");

    list.querySelectorAll("button").forEach(button => {
        button.disabled = true;
    });

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
        if (error.status === 401 || error.status === 403) {
            bmyLogout();
        } else {
            toast(error.message);
            bmyShowBusinesses(
                JSON.parse(sessionStorage.getItem(BMY_BUSINESSES_KEY) || "[]")
            );
        }
    }
}

async function bmyLoadDashboard() {
    const business = JSON.parse(
        sessionStorage.getItem(BMY_SELECTED_KEY) || "null"
    );

    if (!business) return;

    try {
        const result = await bmyRequest(
            `/bmy/business/${business.business_id}/dashboard`
        );

        if (result.status !== "success") {
            throw new Error("Could not load dashboard data.");
        }

        const currency = result.business.currency || "UGX";

        function money(amount) {
            return `${currency} ${Number(amount || 0).toLocaleString()}`;
        }

        // BUSINESS TOTALS
        document.getElementById("revenue").textContent =
            money(result.sales.collected_revenue);

        document.getElementById("expenses").textContent =
            money(result.expenses.total_expenses);

        document.getElementById("customerCount").textContent =
            result.customers.count;

        document.getElementById("productCount").textContent =
            result.products.count;

        document.getElementById("lowStockCount").textContent =
            `${result.products.low_stock_count} items low on stock`;

        // FINANCE SUMMARY
        document.getElementById("income").textContent =
            money(result.sales.collected_revenue);

        document.getElementById("expenseTotal").textContent =
            money(result.expenses.total_expenses);

        document.getElementById("balance").textContent =
            money(result.cash_movement_estimate);

        // RECENT SALES
        const recent = document.getElementById("recent");

        if (result.recent_sales.length) {
            recent.innerHTML = result.recent_sales.map(sale => {
                const saleDate = new Date(sale.sale_date);

                return `
                    <tr>
                        <td>Sale #${safe(sale.sale_id)}</td>
                        <td>${safe(
                            isNaN(saleDate.getTime())
                                ? sale.sale_date
                                : saleDate.toLocaleDateString()
                        )}</td>
                        <td>${safe(sale.payment_status || "Sale")}</td>
                        <td>${safe(money(sale.total_amount))}</td>
                    </tr>
                `;
            }).join("");
        } else {
            recent.innerHTML =
                '<tr><td colspan="4" class="empty">No transactions yet.</td></tr>';
        }

        console.log("BMY dashboard loaded from backend.");

    } catch (error) {
        console.error("BMY dashboard error:", error);
        toast("Could not load live dashboard data.");
    }
}

function bmyOpenWorkspace(business) {
    bmyAuthScreen.hidden = true;
    bmyBusinessScreen.hidden = true;
    bmySidebar.hidden = false;
    bmyMain.hidden = false;

    const workspace = document.querySelector(".workspace");

    if (workspace) {
        workspace.querySelector("strong").textContent =
            business.business_name;

        workspace.querySelector("small").textContent =
            business.business_type || "Business account";
    }

    const logoutButton = document.getElementById("bmyLogout");

    if (logoutButton) logoutButton.hidden = false;

    go("dashboard");
}

function bmyLogout() {
    sessionStorage.removeItem(BMY_TOKEN_KEY);
    sessionStorage.removeItem(BMY_BUSINESSES_KEY);
    sessionStorage.removeItem(BMY_SELECTED_KEY);

    document.getElementById("loginPassword").value = "";

    bmyShowLogin();
}

const bmyLogoutButton = document.createElement("button");

bmyLogoutButton.id = "bmyLogout";
bmyLogoutButton.className = "nav";
bmyLogoutButton.type = "button";
bmyLogoutButton.textContent = "↪ Sign out";
bmyLogoutButton.addEventListener("click", bmyLogout);

document.querySelector(".side-bottom").appendChild(bmyLogoutButton);

async function bmyRestoreSession() {
    const token = sessionStorage.getItem(BMY_TOKEN_KEY);

    if (!token) {
        bmyShowLogin();
        return;
    }

    const selected = sessionStorage.getItem(BMY_SELECTED_KEY);

    if (selected) {
        try {
            const business = JSON.parse(selected);

            await bmyRequest(
                `/bmy/business/${business.business_id}/access`
            );

            bmyOpenWorkspace(business);
            return;

        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                bmyLogout();
                return;
            }

            toast("Could not verify your session. Please try again.");
            bmyShowLogin();
            return;
        }
    }

    const businesses = JSON.parse(
        sessionStorage.getItem(BMY_BUSINESSES_KEY) || "[]"
    );

    if (businesses.length) {
        bmyShowBusinesses(businesses);
    } else {
        bmyLogout();
    }
}

bmyRestoreSession();

