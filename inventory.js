
/* ==========================================
   BMY INVENTORY MANAGEMENT
   Backend-connected product catalogue
   Product editing and deletion
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

    const fields = {
        name: document.getElementById("inventoryProductName"),
        sku: document.getElementById("inventorySku"),
        purchasePrice: document.getElementById("inventoryPurchasePrice"),
        sellingPrice: document.getElementById("inventorySellingPrice"),
        quantity: document.getElementById("inventoryQuantity"),
        reorderLevel: document.getElementById("inventoryReorderLevel"),
        description: document.getElementById("inventoryDescription")
    };

    const submitButton = form.querySelector('button[type="submit"]');

    let products = [];
    let lowStockProducts = [];
    let loading = false;
    let saving = false;
    let editingProduct = null;

    // Add cancel button without modifying HTML.
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "secondary wide";
    cancelButton.textContent = "Cancel editing";
    cancelButton.hidden = true;
    form.appendChild(cancelButton);

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

    function setFormMode(isEditing) {
        if (submitButton) {
            submitButton.textContent = isEditing
                ? "Save product changes"
                : "+ Register product";
        }

        cancelButton.hidden = !isEditing;

        const quantityLabel = form.querySelector(
            'label[for="inventoryQuantity"]'
        );

        if (quantityLabel) {
            quantityLabel.textContent = isEditing
                ? "Current stock quantity (preserved)"
                : "Opening stock quantity";
        }

        if (fields.quantity) {
            fields.quantity.readOnly = isEditing;
            fields.quantity.title = isEditing
                ? "Stock quantity is preserved during product edits."
                : "";
        }
    }

    function resetEditor() {
        editingProduct = null;
        form.reset();

        if (fields.quantity) fields.quantity.value = "0";
        if (fields.reorderLevel) fields.reorderLevel.value = "0";

        setFormMode(false);
    }

    function beginEdit(product) {
        if (!product || product.product_id == null) {
            showMessage(
                "This product is missing its product ID and cannot be edited."
            );
            return;
        }

        editingProduct = product;

        fields.name.value = product.product_name ?? "";
        fields.sku.value = product.sku ?? "";
        fields.purchasePrice.value = product.purchase_price ?? "";
        fields.sellingPrice.value = product.selling_price ?? "";
        fields.quantity.value = Number(
            product.quantity_in_stock || 0
        );
        fields.reorderLevel.value = Number(
            product.reorder_level || 0
        );
        fields.description.value = product.description ?? "";

        setFormMode(true);

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        fields.name.focus();
    }


    // Stock adjustment and audit-history dialog.
    let stockDialog = null;
    let stockDialogProduct = null;
    let stockDialogMode = "adjust";

    function ensureStockDialog() {
        if (stockDialog) return stockDialog;

        const dialog = document.createElement("dialog");
        dialog.id = "bmyStockDialog";
        dialog.style.cssText = [
            "width:min(560px,calc(100% - 28px))",
            "max-height:85vh",
            "overflow:auto",
            "border:1px solid #303c60",
            "border-radius:16px",
            "padding:0",
            "background:#11172b",
            "color:#f3f5ff",
            "box-shadow:0 24px 80px rgba(0,0,0,.55)"
        ].join(";");

        dialog.innerHTML = `
            <div style="padding:20px;border-bottom:1px solid #252e49;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                <div>
                    <small style="color:#b18cff;letter-spacing:1.4px;font-weight:700">INVENTORY CONTROL</small>
                    <h2 id="bmyStockDialogTitle" style="font-size:19px;margin:7px 0 4px">Adjust stock</h2>
                    <p id="bmyStockDialogProduct" style="margin:0;color:#929bb5;font-size:12px"></p>
                </div>
                <button type="button" data-stock-close aria-label="Close" class="secondary" style="padding:7px 11px">✕</button>
            </div>
            <div id="bmyStockDialogBody" style="padding:20px"></div>
        `;

        dialog.addEventListener("click", event => {
            if (event.target === dialog) dialog.close();
            if (event.target.closest("[data-stock-close]")) dialog.close();
        });

        document.body.appendChild(dialog);
        stockDialog = dialog;
        return dialog;
    }

    function openStockDialog(product, mode) {
        if (!product || product.product_id == null) {
            showMessage("This product is missing its product ID.");
            return;
        }

        const business = selectedBusiness();
        if (!business || !business.business_id) {
            showMessage("Select a business first.");
            return;
        }

        stockDialogProduct = product;
        stockDialogMode = mode;

        const dialog = ensureStockDialog();
        const title = dialog.querySelector("#bmyStockDialogTitle");
        const productLabel = dialog.querySelector("#bmyStockDialogProduct");
        const body = dialog.querySelector("#bmyStockDialogBody");

        productLabel.textContent =
            `${product.product_name} · Current stock: ${Number(product.quantity_in_stock || 0)}`;

        if (mode === "history") {
            title.textContent = "Stock adjustment history";
            body.innerHTML = `
                <div id="bmyStockHistory" style="color:#929bb5;text-align:center;padding:20px">Loading adjustment history...</div>
            `;
            if (!dialog.open) dialog.showModal();
            loadStockHistory(product, business.business_id);
            return;
        }

        title.textContent = "Adjust stock";
        body.innerHTML = `
            <form id="bmyStockAdjustmentForm" style="display:grid;gap:14px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <label style="display:grid;gap:6px;font-size:12px;color:#aeb7d0">
                        Adjustment type
                        <select id="bmyStockType" required style="width:100%;padding:11px;border-radius:8px;background:#0a1020;border:1px solid #303c60;color:#fff">
                            <option value="increase">Increase stock</option>
                            <option value="decrease">Decrease stock</option>
                        </select>
                    </label>
                    <label style="display:grid;gap:6px;font-size:12px;color:#aeb7d0">
                        Quantity
                        <input id="bmyStockQuantity" type="number" min="1" step="1" required placeholder="e.g. 3" style="width:100%;padding:11px;border-radius:8px;background:#0a1020;border:1px solid #303c60;color:#fff">
                    </label>
                </div>
                <label style="display:grid;gap:6px;font-size:12px;color:#aeb7d0">
                    Reason
                    <input id="bmyStockReason" type="text" maxlength="2000" required placeholder="Why is the stock changing?" style="width:100%;padding:11px;border-radius:8px;background:#0a1020;border:1px solid #303c60;color:#fff">
                </label>
                <label style="display:grid;gap:6px;font-size:12px;color:#aeb7d0">
                    Notes (optional)
                    <textarea id="bmyStockNotes" rows="3" maxlength="5000" placeholder="Additional details..." style="width:100%;padding:11px;border-radius:8px;background:#0a1020;border:1px solid #303c60;color:#fff;resize:vertical"></textarea>
                </label>
                <p id="bmyStockAdjustmentError" role="alert" style="display:none;margin:0;color:#ff8585;font-size:12px"></p>
                <div style="display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap">
                    <button type="button" data-stock-close class="secondary">Cancel</button>
                    <button id="bmyStockSubmit" type="submit" class="primary">Save adjustment</button>
                </div>
            </form>
        `;

        if (!dialog.open) dialog.showModal();

        const adjustmentForm = body.querySelector("#bmyStockAdjustmentForm");
        adjustmentForm.addEventListener("submit", submitStockAdjustment);
    }

    async function submitStockAdjustment(event) {
        event.preventDefault();

        const product = stockDialogProduct;
        const business = selectedBusiness();
        if (!product || !business || !business.business_id) {
            showMessage("Select a business and product before adjusting stock.");
            return;
        }

        const type = document.getElementById("bmyStockType").value;
        const quantity = Number(document.getElementById("bmyStockQuantity").value);
        const reason = document.getElementById("bmyStockReason").value.trim();
        const notes = document.getElementById("bmyStockNotes").value.trim();
        const errorBox = document.getElementById("bmyStockAdjustmentError");
        const submit = document.getElementById("bmyStockSubmit");

        if (!Number.isInteger(quantity) || quantity <= 0) {
            errorBox.textContent = "Enter a whole-number quantity greater than zero.";
            errorBox.style.display = "block";
            return;
        }

        if (!reason) {
            errorBox.textContent = "Please provide a reason for this adjustment.";
            errorBox.style.display = "block";
            return;
        }

        const businessId = business.business_id;
        const productId = product.product_id;
        const currentQuantity = Number(product.quantity_in_stock || 0);
        const projectedQuantity = type === "increase"
            ? currentQuantity + quantity
            : currentQuantity - quantity;

        const confirmation = type === "increase"
            ? `Increase ${product.product_name} stock by ${quantity} units?`
            : `Decrease ${product.product_name} stock by ${quantity} units?`;

        if (!confirm(confirmation)) return;

        submit.disabled = true;
        submit.textContent = "Saving...";

        try {
            const currentBusiness = selectedBusiness();
            if (
                !currentBusiness ||
                String(currentBusiness.business_id) !== String(businessId)
            ) {
                throw new Error("The selected business changed. Please try again.");
            }

            const result = await bmyRequest(
                `/bmy/business/${businessId}/stock-adjustments`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        product_id: productId,
                        adjustment_type: type,
                        quantity_changed: quantity,
                        reason,
                        notes
                    })
                }
            );

            stockDialog.close();
            showMessage(
                result.message ||
                `Stock adjusted successfully. New quantity: ${result.current_quantity ?? projectedQuantity}.`
            );
            await loadInventory();

        } catch (error) {
            console.error("BMY Stock adjustment error:", error);
            errorBox.textContent = error.message || "Stock adjustment failed.";
            errorBox.style.display = "block";
            submit.disabled = false;
            submit.textContent = "Save adjustment";
        }
    }

    async function loadStockHistory(product, businessId) {
        const historyContainer = document.getElementById("bmyStockHistory");
        if (!historyContainer) return;

        try {
            const result = await bmyRequest(
                `/bmy/business/${businessId}/stock-adjustments?product_id=${encodeURIComponent(product.product_id)}`
            );

            if (
                !stockDialog ||
                !stockDialog.open ||
                stockDialogMode !== "history" ||
                !stockDialogProduct ||
                String(stockDialogProduct.product_id) !== String(product.product_id)
            ) return;

            const records = Array.isArray(result.adjustments)
                ? result.adjustments
                : [];

            if (!records.length) {
                historyContainer.innerHTML = `
                    <p style="text-align:center;padding:20px;color:#929bb5">No stock adjustments recorded for this product yet.</p>
                `;
                return;
            }

            historyContainer.innerHTML = `
                <div style="display:grid;gap:10px">
                    ${records.map(record => {
                        const increase = record.adjustment_type === "increase";
                        const changed = Number(record.quantity_changed || 0);
                        const when = record.created_at
                            ? new Date(record.created_at).toLocaleString()
                            : "Date unavailable";

                        return `
                            <article style="padding:13px;border:1px solid #252e49;border-radius:11px;background:#0c1223">
                                <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
                                    <strong style="color:${increase ? "#75d9a2" : "#ff8585"}">
                                        ${increase ? "+" : "−"}${changed} units · ${increase ? "Stock increased" : "Stock decreased"}
                                    </strong>
                                    <small style="color:#929bb5">#${escapeHTML(record.adjustment_id)}</small>
                                </div>
                                <p style="margin:9px 0 5px;color:#e1e6f5;font-size:12px">
                                    ${Number(record.previous_quantity)} → ${Number(record.new_quantity)}
                                </p>
                                <p style="margin:5px 0;color:#c0c9df;font-size:12px">
                                    ${escapeHTML(record.reason || "No reason supplied")}
                                </p>
                                ${record.notes ? `<p style="margin:5px 0;color:#929bb5;font-size:11px">${escapeHTML(record.notes)}</p>` : ""}
                                <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:9px;color:#929bb5;font-size:10px">
                                    <span>By ${escapeHTML(record.performed_by_name || "Unknown user")}</span>
                                    <span>${escapeHTML(when)}</span>
                                </div>
                            </article>
                        `;
                    }).join("")}
                </div>
            `;

        } catch (error) {
            console.error("BMY Stock history error:", error);
            historyContainer.textContent =
                error.message || "Could not load stock adjustment history.";
        }
    }

    function renderProducts() {
        const query = (search?.value || "").trim().toLowerCase();

        const filtered = products.filter(product =>
            String(product.product_name || "")
                .toLowerCase().includes(query) ||
            String(product.sku || "")
                .toLowerCase().includes(query)
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
            const quantity = Number(
                product.quantity_in_stock || 0
            );

            const reorder = Number(
                product.reorder_level || 0
            );

            const isLow = quantity <= reorder;

            const productId = escapeHTML(product.product_id);

            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeHTML(product.product_name)}
                        </strong>
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

                    <td>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">

                            <button
                                type="button"
                                class="secondary"
                                data-inventory-action="adjust"
                                data-product-id="${productId}">
                                Adjust stock
                            </button>

                            <button
                                type="button"
                                class="secondary"
                                data-inventory-action="history"
                                data-product-id="${productId}">
                                History
                            </button>

                            <button
                                type="button"
                                class="secondary"
                                data-inventory-action="edit"
                                data-product-id="${productId}">
                                Edit
                            </button>

                            <button
                                type="button"
                                class="secondary"
                                data-inventory-action="delete"
                                data-product-id="${productId}"
                                style="color:#dc5555">
                                Delete
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function renderStatistics() {
        const productCount = document.getElementById(
            "inventoryProductCount"
        );

        const lowStockCount = document.getElementById(
            "inventoryLowStockCount"
        );

        const summary = document.getElementById(
            "inventoryLowStockSummary"
        );

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

            resetEditor();
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
            const [productResult, lowStockResult] =
                await Promise.all([

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
                String(currentBusiness.business_id) !==
                String(businessId)
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

            if (editingProduct) {
                const refreshedProduct = products.find(product =>
                    String(product.product_id) ===
                    String(editingProduct.product_id)
                );

                if (refreshedProduct) {
                    editingProduct = refreshedProduct;

                    fields.quantity.value = Number(
                        refreshedProduct.quantity_in_stock || 0
                    );
                } else {
                    resetEditor();
                }
            }

            renderStatistics();
            renderProducts();

        } catch (error) {
            console.error(
                "BMY Inventory loading error:",
                error
            );

            products = [];
            lowStockProducts = [];

            renderStatistics();

            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        ${escapeHTML(
                            error.message ||
                            "Products could not be loaded."
                        )}
                    </td>
                </tr>
            `;

            showMessage(
                "Could not load inventory from the server."
            );

        } finally {
            loading = false;
        }
    }

    function readAndValidateForm() {
        const productName = fields.name.value.trim();
        const sellingPrice = fields.sellingPrice.value;
        const purchasePrice = fields.purchasePrice.value;
        const reorderLevel = fields.reorderLevel.value;

        if (!productName || sellingPrice === "") {
            showMessage(
                "Product name and selling price are required."
            );
            return null;
        }

        if (
            !Number.isFinite(Number(sellingPrice)) ||
            Number(sellingPrice) < 0
        ) {
            showMessage("Enter a valid selling price.");
            return null;
        }

        if (
            purchasePrice !== "" &&
            (
                !Number.isFinite(Number(purchasePrice)) ||
                Number(purchasePrice) < 0
            )
        ) {
            showMessage("Enter a valid purchase price.");
            return null;
        }

        if (
            !Number.isInteger(Number(reorderLevel)) ||
            Number(reorderLevel) < 0
        ) {
            showMessage(
                "Reorder level must be a whole number."
            );
            return null;
        }

        const payload = {
            product_name: productName,
            selling_price: Number(sellingPrice),
            reorder_level: Number(reorderLevel),
            sku: fields.sku.value.trim(),
            description: fields.description.value.trim()
        };

        if (purchasePrice !== "") {
            payload.purchase_price = Number(purchasePrice);
        }

        // Opening stock is included only when registering.
        // During editing, quantity_in_stock is deliberately omitted.
        if (!editingProduct) {
            const quantity = fields.quantity.value;

            if (
                !Number.isInteger(Number(quantity)) ||
                Number(quantity) < 0
            ) {
                showMessage(
                    "Opening stock quantity must be a whole number."
                );
                return null;
            }

            payload.quantity_in_stock = Number(quantity);
        }

        return payload;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (saving) return;

        const business = selectedBusiness();

        if (!business || !business.business_id) {
            showMessage(
                "Select a business before registering products."
            );
            return;
        }

        const payload = readAndValidateForm();

        if (!payload) return;

        const isEditing = Boolean(editingProduct);

        const productId = isEditing
            ? editingProduct.product_id
            : null;

        const businessId = business.business_id;

        saving = true;

        if (submitButton) {
            submitButton.disabled = true;

            submitButton.textContent = isEditing
                ? "Saving changes..."
                : "Registering...";
        }

        try {
            const currentBusiness = selectedBusiness();

            if (
                !currentBusiness ||
                String(currentBusiness.business_id) !==
                String(businessId)
            ) {
                throw new Error(
                    "The selected business changed. Please try again."
                );
            }

            if (isEditing) {

                await bmyRequest(
                    `/bmy/business/${businessId}/products/${productId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    }
                );

                showMessage(
                    "Product updated successfully. Existing stock quantity was left unchanged."
                );

            } else {

                await bmyRequest(
                    `/bmy/business/${businessId}/products`,
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

                showMessage(
                    "Product registered successfully."
                );
            }

            resetEditor();

            await loadInventory();

        } catch (error) {
            console.error(
                "BMY Product save error:",
                error
            );

            showMessage(
                error.message ||
                "Product could not be saved."
            );

        } finally {
            saving = false;

            if (submitButton) {
                submitButton.disabled = false;
            }

            setFormMode(Boolean(editingProduct));
        }
    });

    // EDIT AND DELETE ACTIONS
    table.addEventListener("click", async event => {

        const button = event.target.closest(
            "button[data-inventory-action]"
        );

        if (!button) return;

        const action = button.dataset.inventoryAction;
        const productId = button.dataset.productId;

        const product = products.find(item =>
            String(item.product_id) === String(productId)
        );

        if (!product) {
            showMessage(
                "Product not found. Refresh the inventory and try again."
            );
            return;
        }

        if (action === "adjust") {
            openStockDialog(product, "adjust");
            return;
        }

        if (action === "history") {
            openStockDialog(product, "history");
            return;
        }

        if (action === "edit") {
            beginEdit(product);
            return;
        }

        if (action !== "delete") return;

        const business = selectedBusiness();

        if (!business || !business.business_id) {
            showMessage(
                "Select a business before deleting a product."
            );
            return;
        }

        const confirmed = confirm(
            `Delete "${product.product_name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        button.disabled = true;
        button.textContent = "Deleting...";

        try {

            await bmyRequest(
                `/bmy/business/${business.business_id}/products/${product.product_id}`,
                {
                    method: "DELETE"
                }
            );

            if (
                editingProduct &&
                String(editingProduct.product_id) ===
                String(product.product_id)
            ) {
                resetEditor();
            }

            showMessage(
                "Product deleted successfully."
            );

            await loadInventory();

        } catch (error) {

            console.error(
                "BMY Product deletion error:",
                error
            );

            showMessage(
                error.message ||
                "Product could not be deleted."
            );

            button.disabled = false;
            button.textContent = "Delete";
        }
    });

    cancelButton.addEventListener(
        "click",
        resetEditor
    );

    if (search) {
        search.addEventListener(
            "input",
            renderProducts
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadInventory
        );
    }

    document.querySelectorAll(
        '.nav[data-page="inventory"]'
    ).forEach(button => {
        button.addEventListener(
            "click",
            loadInventory
        );
    });

    console.log(
        "BMY Inventory module initialized."
    );

})();
