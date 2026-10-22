/* PARA CONFIGURAR EL ALMACENAMIENTO */

const PRODUCTS_KEY = "sixtech_products";
const SALES_KEY = "sixtech_sales";

/*Elemento del HTML*/
const productSelect = document.getElementById("productSelect");
const quantityInput = document.getElementById("quantityInput");
const addProductButton = document.getElementById("addProductButton");
const cartTableBody = document.getElementById("cartTableBody");
const cartEmpty = document.getElementById("cartEmpty");
const saleTotal = document.getElementById("saleTotal");

const paymentMethod = document.getElementById("paymentMethod");
const amountReceived = document.getElementById("amountReceived");
const cashGroup = document.getElementById("cashGroup");
const changeMessage = document.getElementById("changeMessage");
const paymentNotice = document.getElementById("paymentNotice");
const completeSaleButton = document.getElementById("completeSaleButton");

const productMessage = document.getElementById("productMessage");
const saleMessage = document.getElementById("saleMessage");
const salesTableBody = document.getElementById("salesTableBody");
const salesEmpty = document.getElementById("salesEmpty");

/*DATOS */
let products = [];
let sales = [];
let cart = [];

/* Se hará que se muestre mensajes de manera temporal */
let messageTimer;

function showProductMessage(message, type= "success") {
    productMessage.textContent = message;
    productMessage.className = "message " + type;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(function() {
        productMessage.textContent = "";
        productMessage.className = "message";
    }, 2500);
}

/*FORMATO DE MONEDA */
function formatPrice(value) {
    return Number(value).toLocaleString("es-Mx", {
        style: "currency",
        currency: "MXN"
    });
}

/* Se protege los textos al mostrarlos en HTML */
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character];
    });    
}

/* Cargar los productos y ventas */
function loadData() {
    try {
        const savedProducts = localStorage.getItem(PRODUCTS_KEY);
        const savedSales = localStorage.getItem(SALES_KEY);
        
        products = savedProducts === null
            ? []
            : JSON.parse(savedProducts);

        sales = savedSales === null
            ? []
            : JSON.parse(savedSales);

        if (!Array.isArray(products) || !Array.isArray(sales)) {
            throw new Error("Los datos almacenados no tienen el formato esperado.");
        }
    }   catch (error) {
            console.error("Error al cargar los datos:", error);
            products = [];
            sales = [];
            saleMessage.textContent =
                "No se pudieron leer los datos. Revisa el almacenamiento del navegador";
    }
}

/* MOSTRAR LOS PRODUCTOS DISPONIBLES */
function renderProductsOptions () {
    const previousSelection = productSelect.value;

    const availableProducts = products.filter(function(product) {
        return Number.isInteger(Number(product.stock)) && 
            Number(product.stock) > 0 &&
            Number.isFinite(Number(product.price)) &&
            Number(product.price) > 0;
    });

    productSelect.innerHTML =
        '<option value="">Selecciona un producto</option>' +
        availableProducts.map(function(product) {
            return `
                <option value="${escapeHTML(product.id)}">
                    ${escapeHTML(product.name)} - ${formatPrice(product.price)}
                    (Existencias: ${product.stock})
                </option>
            `;
        }).join("");
    
    if (availableProducts.some(function(product) {
        return product.id === previousSelection;
    })) {
        productSelect.value = previousSelection;
    }
}

/*Obtener total del carrito */
function getCartTotal () {
    return cart.reduce(function(total, item) {
        return total + item.price * item.quantity;
    }, 0);
}

/* El dibujo del carrito */
function renderCart() {
    cartTableBody.innerHTML = cart.map(function(item) {
        return `
            <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price * item.quantity)}</td>
                <td>
                    <button type="button"
                        class="remove-button"
                        data-remove-id="${escapeHTML(item.id)}">
                        Quitar
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    cartEmpty.hidden = cart.length !==0;
    saleTotal.textContent = formatPrice(getCartTotal());

    updatePayment();
}

/* Agregar un producto al carrito */
addProductButton.addEventListener("click", function() {
    productMessage.textContent = "";
    saleMessage.textContent = "";

    const id= productSelect.value;
    const quantity = Number(quantityInput.value);

    if (!id) {
        productMessage.textContent = "Selecciona un producto";
        return;
    }

    if (!Number.isInteger(quantity) || quantity <1) {
        productMessage.textContent =
            "La cantidad debe ser un número entero mayor que cero.";
        return;
    }

    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) {
        productMessage.textContent =
            "El producto ya no existe. Actualiza la página";
        return;
    }

    const existingItem = cart.find(function(item) {
        return item.id === id;
    });

    const quantityInCart = existingItem ? existingItem.quantity : 0;

    if (quantityInCart + quantity > Number(product.stock)) {
        productMessage.textContent =
            "No hay existencias suficientes para esa cantidad", "error";
        return;
    }

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: Number(product.price),
            quantity: quantity
        });
    }

    quantityInput.value = "1";
    showProductMessage("Producto agregado al carrito", "success");
    renderCart();
});

/* Quitar producto del carrito */
cartTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("[data-remove-id]");

    if(!button) {
        return;
    }

    const id = button.dataset.removeId;

    cart = cart.filter(function(item) {
        return String(item.id) !== String(id);
    });

    showProductMessage("Producto eliminado del carrito", "error")
    renderCart();
});

/*Actualizar los campos del pago */
function updatePayment() {
    const isCash = paymentMethod.value === "Efectivo";
    const total = getCartTotal();
    const received = Number(amountReceived.value);

    cashGroup.hidden = !isCash;
    paymentNotice.hidden = isCash;

    if (!isCash) {
        paymentNotice.textContent =
            paymentMethod.value === "Tarjeta"
            ? "El prototipo registra el pago con tarjeta, pero no procesa el cobro real."
            : "El prototipo registra la transferencia; verifica el abono en tu cuenta antes de confirmar";
    }

    if (isCash) {
        const difference = received - total;

        if (amountReceived.value.trim() === "" || difference <0) {
            changeMessage.textContent = total > 0
            ? "El importe recibido es insuficiente"
            : "Cambio: $0.00";
        } else {
            changeMessage.textContent =
                "Cambio: " + formatPrice(difference);
        }
    }

    completeSaleButton.disabled =
        cart.length === 0 ||
        (isCash && (
            amountReceived.value.trim() === "" ||
            !Number.isFinite(received) ||
            received < total
        ));
}

paymentMethod.addEventListener("change", updatePayment);
amountReceived.addEventListener("input", updatePayment);

/* DIBUJAR EL HISTORIAL Y ESTADÍSTICAS */
function renderSales() {
    salesTableBody.innerHTML = sales.map(function(sale) {
        const itemCount = sale.items.reduce(function(total, item) {
            return total + item.quantity;
        }, 0);

        return `
            <tr>
                <td>${escapeHTML(sale.id)}</td>
                <td>${escapeHTML(sale.date)}</td>
                <td>${itemCount} unidad(es)</td>
                <td>${escapeHTML(sale.paymentMethod)}</td>
                <td>${formatPrice(sale.total)}</td>
            </tr>
        `;
    }).join("");

    salesEmpty.hidden = sales.length !== 0;

    document.getElementById("totalSales").textContent = sales.length;

    const revenue = sales.reduce(function(total, sale) {
        return total + Number(sale.total);
    }, 0);

    document.getElementById("totalRevenue").textContent =
        formatPrice(revenue);
}

/* CONFIRMAR VENTA */
completeSaleButton.addEventListener("click", function() {
    saleMessage.textContent = "";
    productMessage.textContent = "";

    if (cart.length === 0) {
        saleMessage.textContent = "Agrega al menos un producto";
        return;
    }

    const total = getCartTotal();
    const method = paymentMethod.value;
    const received = Number(amountReceived.value);

    if (method === "Efectivo" && (
        amountReceived.value.trim() === "" ||
        !Number.isFinite(received) ||
        received < total
    )) {
        saleMessage.textContent =
            "El importe recibido no cubre el total de venta";
            return;
    }

    if (!["Efectivo", "Tarjeta", "Transferencia"].includes(method)) {
        saleMessage.textContent = "Selecciona un método de pago válido";
        return;
    }

    /* Hay que verificar las existencias antes de guardar */
    for (const item of cart) {
        const product = products.find(function(product) {
            return product.id === item.id;
        });

        if (!product || !Number.isInteger(Number(product.stock)) ||
            Number(product.stock) < item.quantity) {
            saleMessage.textContent =
                    'No hay existencias suficientes de "' + item.name + '". La venta no se registró. ';
                    renderProductsOptions();
                return;
                }
        }

        const previousProducts = products;
        const previousSales = sales;

        /* Preparar el inventario actualizado */
        const updatedProducts = products.map(function(product) {
            const soldItem = cart.find(function(item) {
                return item.id === product.id;
            });

            if (!soldItem) {
                return product;
            }

            return {
                ...product,
                stock: Number(product.stock) - soldItem.quantity
            };
        });

        const sale = {
            id: "V-" + Date.now(),
            date: new Date().toLocaleString("es-MX"),
            items: cart.map(function(item) {
                return {
                    id: item.id,
                    code: item.code,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                };
            }),
            total: total,
            paymentMethod: method,
            amountReceived: method === "Efectivo" ? received : total,
            change: method === "Efectivo" ? received - total : 0
        };

        /* GUARDAR VENTA E INVENTARIO */
        try {
            const originalProductsStorage =
                localStorage.getItem(PRODUCTS_KEY);
            const originalSalesStorage =
                localStorage.getItem(SALES_KEY);

            try {
                localStorage.setItem(
                    PRODUCTS_KEY,
                    JSON.stringify(updatedProducts)
                );

                localStorage.setItem(
                    SALES_KEY,
                    JSON.stringify([...sales, sale])
                );
            } catch (error) {
                /* INTENTAR EL RESTAURO DE AMBOS REGISTROS */
                try {
                    if (originalProductsStorage === null) {
                        localStorage.removeItem(PRODUCTS_KEY);
                    } else {
                        localStorage.setItem(
                            PRODUCTS_KEY, originalProductsStorage
                        );
                    }

                    if (originalSalesStorage === null) {
                        localStorage.removeItem(SALES_KEY);
                    } else {
                        localStorage.setItem(
                            SALES_KEY, originalSalesStorage
                        );
                    }
                } catch (restoreError) {
                    console.error("No se pudieron restaurar los datos", restoreError);
                }

                throw error;
            }

            products = updatedProducts;
            sales = [...sales, sale];
            cart = [];

            amountReceived.value = "";
            productSelect.value = "";
            quantityInput.value = "1";

            renderProductsOptions();
            renderCart();
            renderSales();

            saleMessage.textContent =
                "Venta" + sale.id + " registrada correctamente.";

        } catch (error) {
            console.error("Error al registrar la venta", error);
            products = previousProducts;
            sales = previousSales;

            saleMessage.textContent =
                "No se pudo guardar la venta. Revisa el almacenamiento del navegador.";
        }
});

/* PARA INICIAR EL MÓDUÑP */
loadData();
renderProductsOptions();
renderCart();
renderSales();