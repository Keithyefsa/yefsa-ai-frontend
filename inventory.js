
/* ==========================================
   BMY INVENTORY MANAGEMENT
   Backend-connected product catalogue
========================================== */

(function () {
    "use strict";

    const form = document.getElementById("inventoryProductForm");
    const table = document.getElementById("inventoryProducts");
    const search = document.getElementById("inventorySearch");
    const refreshButton = document.getElementById("inventoryRefresh");

    if (!form || !table) {
        console.error("BMY Inventory: Required HTML elements not found.");
        return;
    }

    let products = [];
    let lowStockProducts = [];
    let loading = false;

    function selectedBusiness() {
        return typeof bmyGetSelectedBusiness === "function"
            ? bmyGetSelectedBusiness()
            : null;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function money(value) {
        return "UGX " + Number(value || 0).toLocaleString();
    }

    function showMessage(message) {
        if (typeof toast === "function") {
            toast(message);
        } else {
            alert(message);
        }
    }

    function renderProducts() {
        const query = (search?.value || "").trim().toLowerCase();

        const filtered = products.filter(product =>
            String(product.product_name || "").toLowerCase().includes(query) ||
            String(product.sku || "").toLowerCase().includes(query)
        );

        if (!filtered.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        ${products.length
                            ? "No products match your search."
                            : "No products registered yet."}
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = filtered.map(product => {
            const quantity = Number(product.quantity_in_stock || 0);
            const reorder = Number(product.reorder_level || 0);
            const isLow = quantity <= reorder;

            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(product.product_name)}</strong>
                    </td>

                    <td>${escapeHTML(product.sku || "—")}</td>

                    <td>${money(product.selling_price)}</td>

                    <td>${quantity}</td>

                    <td>
                        ${reorder}
                        <br>
                        <small style="color:${isLow ? "#ff8585" : "#75d9a2"}">
                            ${isLow ? "Low stock" : "In stock"}
                        </small>
                    </td>

                    <td>—</td>
                </tr>
            `;
        }).join("");
    }

    function renderStatistics() {
        const productCount =
            document.getElementById("inventoryProductCount");

        const lowStockCount =
            document.getElementById("inventoryLowStockCount");

        const summary =
            document.getElementById("inventoryLowStockSummary");

        if (productCount) {
            productCount.textContent = products.length;
        }

        if (lowStockCount) {
            lowStockCount.textContent = lowStockProducts.length;
        }

        if (summary) {
            summary.textContent = lowStockProducts.length
                ? `${lowStockProducts.length} products need attention`
                : "No low-stock products";
        }
    }

    async function loadInventory() {
        const business = selectedBusiness();

        if (!business || !business.business_id) {
            products = [];
            lowStockProducts = [];
            renderStatistics();
            renderProducts();

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Select a business to view its products.
                    </td>
                </tr>
            `;
            return;
        }

        if (loading) return;

        loading = true;

        products = [];
        lowStockProducts = [];
        renderStatistics();

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Loading products...
                </td>
            </tr>
        `;

        const businessId = business.business_id;

        try {
            const [productResult, lowStockResult] = await Promise.all([
                bmyRequest(
                    `/bmy/business/${businessId}/products`
                ),
                bmyRequest(
                    `/bmy/business/${businessId}/products/low-stock`
                )
            ]);

            const currentBusiness = selectedBusiness();

            if (
                !currentBusiness ||
                String(currentBusiness.business_id) !== String(businessId)
            ) {
                return;
            }

            products = Array.isArray(productResult.products)
                ? productResult.products
                : [];

            lowStockProducts = Array.isArray(
                lowStockResult.low_stock_products
            )
                ? lowStockResult.low_stock_products
                : [];

            renderStatistics();
            renderProducts();

        } catch (error) {
            console.error("BMY Inventory loading error:", error);

            products = [];
            lowStockProducts = [];
            renderStatistics();

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        ${escapeHTML(error.message || "Products could not be loaded.")}
                    </td>
                </tr>
            `;

            showMessage("Could not load inventory from the server.");

        } finally {
            loading = false;
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const business = selectedBusiness();

        if (!business || !business.business_id) {
            showMessage("Select a business before registering products.");
            return;
        }

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        const productName =
            document.getElementById("inventoryProductName").value.trim();

        const sellingPrice =
            document.getElementById("inventorySellingPrice").value;

        const purchasePrice =
            document.getElementById("inventoryPurchasePrice").value;

        const quantity =
            document.getElementById("inventoryQuantity").value;

        const reorderLevel =
            document.getElementById("inventoryReorderLevel").value;

        if (!productName || sellingPrice === "") {
            showMessage("Product name and selling price are required.");
            return;
        }

        if (
            !Number.isFinite(Number(sellingPrice)) ||
            Number(sellingPrice) < 0
        ) {
            showMessage("Enter a valid selling price.");
            return;
        }

        if (
            purchasePrice !== "" &&
            (
                !Number.isFinite(Number(purchasePrice)) ||
                Number(purchasePrice) < 0
            )
        ) {
            showMessage("Enter a valid purchase price.");
            return;
        }

        if (
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0 ||
            !Number.isInteger(Number(reorderLevel)) ||
            Number(reorderLevel) < 0
        ) {
            showMessage("Stock quantity and reorder level must be whole numbers.");
            return;
        }

        const payload = {
            product_name: productName,
            selling_price: Number(sellingPrice),
            quantity_in_stock: Number(quantity),
            reorder_level: Number(reorderLevel)
        };

        const sku =
            document.getElementById("inventorySku").value.trim();

        const description =
            document.getElementById("inventoryDescription").value.trim();

        if (sku) payload.sku = sku;
        if (description) payload.description = description;

        if (purchasePrice !== "") {
            payload.purchase_price = Number(purchasePrice);
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Registering...";
        }

        try {
            await bmyRequest(
                `/bmy/business/${business.business_id}/products`,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            form.reset();

            document.getElementById("inventoryQuantity").value = "0";
            document.getElementById("inventoryReorderLevel").value = "0";

            showMessage("Product registered successfully.");

            await loadInventory();

        } catch (error) {
            console.error("BMY Product registration error:", error);

            showMessage(
                error.message || "Product could not be registered."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "+ Register product";
            }
        }
    });

    if (search) {
        search.addEventListener("input", renderProducts);
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", loadInventory);
    }

    document.querySelectorAll(
        '.nav[data-page="inventory"]'
    ).forEach(button => {
        button.addEventListener("click", loadInventory);
    });

    console.log("BMY Inventory module initialized.");

})();
