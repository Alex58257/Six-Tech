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

    const availableProducts = product.filter(function(product) {
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
function getCarTotal () {
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
                        data-remove-id=${escapeHTML(item.id)}">
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




