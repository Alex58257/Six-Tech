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

/* Cargar los productos desde la BD */
async function loadProducts() {
    const {data, error} = await supabaseClient
        .from("products")
        .select("id, code, name, category, price, stock, min_stock")
        .order("name", {asceding: true});
    if (error) {
        console.error("Error al cargar productos", error);
        throw error;
    }
    products = data.map(function (product) {
        return {
            id: product.id,
            code: product.code,
            name: product.name,
            category: product.category,
            price: Number(product.price),
            stock: Number(product.stock),
            minStock: Number(product.min_stock)
        };
    });

    renderProductsOptions();
}

/* CARGAR EL HISTORIAL DESDE SUPABASE */
async function loadSales() {
    const { data: salesData, error: salesError } =
        await supabaseClient
            .from("sales")
            .select("*")
            .order("date" ,{ascending: false});
    
    if (salesError) {
        console.error("Error al consultar las ventas", salesError);
        throw salesError;
    }
    
    if (salesData.length === 0) {
        sales = [];
        renderSales();
        return;
    }

    const saleIds = salesData.map(function (sale) {
        return sale.id;
    });

    const {data: itemsData, error: itemsError} =
        await supabaseClient
            .from("sale_items")
            .select("*")
            .in("sale_id", saleIds);
    
    if (itemsError) {
        console.error("Error al consultar los detalles:", itemsError);
        throw itemsError;
    }

    sales = salesData.map(function (sale) {
        const items = itemsData
            .filter(function (item) {
                return String(item.sale_id) === String(sale.id);
            })
            .map(function (item) {
                return {
                    id: item.product_id,
                    code: item.product_code,
                    name: item.product_name,
                    price: Number(item.price),
                    quantity: Number(item.quantity),
                    subtotal: Number(item.subtotal),
                };
            });
        
        return {
            id: sale.id,
            date: sale.date,
            items: items,
            total: Number(sale.total),
            paymentMethod: sale.payment_method, 
            amountReceived: Number(sale.amount_received),
            change: Number(sale.change_amount)
        };
    });

    renderSales();
}

/* MOSTRAR PRODUCTOS DISPONIBLES */
function renderProductsOptions() {
    const previousSelection = productSelect.value;

    const availableProducts = products.filter(function (product) {
        return Number.isInteger(product.stock) &&
            product.stock > 0 &&
            Number.isFinite(product.price) &&
            product.price > 0;
    });

    productSelect.innerHTML =
        '<option value="">Selecciona un producto</option>' +
        availableProducts.map(function (product) {
            return `
                <option value ="${escapeHTML(product.id)}">
                    ${escapeHTML(product.name)} -
                    ${formatPrice(product.price)}
                    (Existencias: ${product.stock})
                </option>
            `;
        }).join("");
    
    if (availableProducts.some(function (product) {
        return String(product.id) === previousSelection;
    }))  {
        productSelect = previousSelection;
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
        showProductMessage("Seleccione un producto", "error");
        return;
    }

    if (!Number.isInteger(quantity) || quantity <1) {
        showProductMessage(
            "La cantidad debe ser un entero mayor que cero.", 
            "error"
        );
        return;
    }

    const product = products.find(function(item) {
        return String(item.id) === id;
    });

    if (!product) {
        showProductMessage(
            "No se encontró el producto. Actualiza los datos", 
            "error"
        );
        return;
    }

    const existingItem = cart.find(function(item) {
        return String(item.id) === id;
    });

    const quantityInCart = existingItem 
        ? existingItem.quantity 
        : 0;

    if (quantityInCart + quantity > product.stock) {
        showProductMessage(
            "No hay existencias suficientes para esa cantidad", "error");
        return;
    }

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
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
            : "Verifica el abono de la transferencia antes de confirmar";
        changeMessage.textContent="";
    } else {
        const difference = received - total;
    
        if (
            amountReceived.value.trim() === "" ||
            !Number.isFinite(received) ||
            difference <0
        ) {
            changeMessage.textContent = total > 0
            ? "El importe recibido es insuficiente"
            : "Cambio: " + formatPrice(0); 
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

        const date = sale.date 
            ? new Date(sale.date).toLocaleString("es-MX")
            : "";

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

/* REGISTRAR LAS VENTAS EN SUPABASE */
completeSaleButton.addEventListener("click", function() {
    saleMessage.textContent = "";
    productMessage.textContent = "";

    if (cart.length === 0) {
        saleMessage.textContent = "Agrega al menos un producto";
        return;
    }

    const method = paymentMethod.value;
    const total = getCartTotal();
    const received = Number(amountReceived.value);
    
    if (!["Efectivo", "Tarjeta", "Transferencia"].includes(method)) {
        saleMessage.textContent = "Selecciona un método de pago válido";
        return;
    }

    if (
        method === "Efectivo" && 
        (
            amountReceived.value.trim() === "" ||
            !Number.isFinite(received) ||
            received < total
        )
    ) 
      {
        saleMessage.textContent =
            "El importe recibido no cubre el total de la venta";
        return;
    }

    /* Comprobación previa; Supabase volverá a checar el stock */
    for (const item of cart) {
        const product = products.find(function(product) {
            return string(product.id) === item.id;
        });

        if (!product || product.stock <item.quantity) {
            saleMessage.textContent =
                `Existencias insuficientes para ${item.name}.`;
            return;
        }
    }

    completeSaleButton.disabled = true;
    completeSaleButton.textContent = "Registrando...";

    try {
        /*
        *La función SQL register_sale recibe:
        * p_items, p_payment_method y p_amount_received.
        * El servidor va a calcular el total y actualizará el inventario.*/

        const itemsForDataBase = cart.map(function (item) {
            return {
                product_id: item.id,
                quantity: item.quantity
            };
        });

        const { data, error } = await supabaseClient.rpc(
            "register_sale",
            {
                p_items: itemsForDataBase,
                p_payment_method: method,
                p_amount_received: method === "Efectivo"
                    ? received
                    : total
            }
        );

        if (error) {
            throw error;
        }

        /* La venta se registra en la bd
        * Volvemos a consultar el inventario y el historial
        */
       cart = [];
       amountReceived.value = "";
       quantityInput.value = "1";
       productSelect.value = "";

       await Promise.all([
            loadProducts(),
            loadSales()
       ]);

       renderCart();

       const saleId = typeof data === "string"
            ? data
            : data?.id ?? data?.sale_id;
        saleMessage.textContent = saleId
            ? `Venta ${saleId} registrada correctamente.`
            : "Venta registrada correctamente";
    } catch (error) {

    }
}
          