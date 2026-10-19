/* PARA CONFIGURAR EL ALMACENAMIENTO */
const STORAGE_KEY = "sixtech_products";

/* ALGUNOS EJEMPLOS DE PRODUCTOS */
const exampleProducts = [
    {
        id: "P001",
        code: "CEL-001",
        name: "Samsung Galaxy S25",
        category: "Celulares",
        price: 13000,
        stock: 6,
        minStock: 2
    },

    {
        id: "P002",
        code: "ACC-001",
        name: "Airpods 4 ANC",
        category: "Accesorios",
        price: 3000,
        stock: 4,
        minStock: 1
    },
    {
        id: "P003",
        code: "CEL-002",
        name: "iPhone 18 Pro Max",
        category: "Celulares",
        price: 32000,
        stock: 7,
        minStock: 2
    },
];

/* Se muestra los elementos del HTML */
const productForm = document.getElementById("productForm");
const productFormSection = document.getElementById("productFormSection");
const productsTableBody = document.getElementById("productsTableBody");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");
const formMessage = document.getElementById("formMessage");
const pageMessage = document.getElementById("pageMessage");

const newProductButton = document.getElementById("newProductButton");
const cancelButton = document.getElementById("cancelButton");

const productId = document.getElementById("productId");
const productCode = document.getElementById("productCode");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productMinStock = document.getElementById("productMinStock");

const formTitle = document.getElementById("formTitle");

function loadProducts() {
    try {
        const savedProducts = localStorage.getItem(STORAGE_KEY);

        if (savedProducts === null) {
            localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(exampleProducts)
            );

            return [...exampleProducts];
        }

        const products = JSON.parse(savedProducts);

        if (!Array.isArray(products)) {
            throw new Error("Invalid product data");
        }

        return products;
    }   catch (error) {
            console.error("Error al cargar los productos:", error)
            pageMessage.textContent =
                "No se pudieron cargar los productos guardados. Revisa el almacenamiento del navegador";

            return [];
    }
}

let products = loadProducts();

/* PARA GUARDAR PRODUCTOS */
function savedProducts() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        return true;
    }   catch (error) {
        console.error("Error al guardar productos:", error);
        pageMessage.textContent =
            "No se pudieron guardar los cambios. Revisa el almacenamiento disponible del navegador";
        return false;
    }
}

/* El formato será en precio mexicano */
function formatPrice(price) {
    return Number(price).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });
}

/* Escapar el texto antes de insertarlo en HTML */ 
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

/* DETERMINAR EL ESTATUS DEL ALMACÉN */
function getStockStatus(product) {
    if (product.stock ===0) {
        return {
            label: "Agotado",
            className: "stock-out"
        };
    }

    if (product.stock <= product.minStock) {
        return {
            label: "Stock bajo",
            className: "stock-low"
        };
    }

    return {
        label: "Disponible",
        className: "stock-ok"
    };
}

/* Renderizar la tabla de productos y las estadísticas */

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(function(product) {
        return (
            product.name.toLowerCase().includes(searchTerm) ||
            product.code.toLowerCase().includes(searchTerm)
        );
    });

    productsTableBody.innerHTML = filteredProducts.map(function(product) {
        const status = getStockStatus(product);

        return `
            <tr>
                <td>${escapeHTML(product.code)}</td>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${escapeHTML(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="stock-badge ${status.className}">
                        ${status.label}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button
                            type="button"
                            class="action-button edit-button"
                            data-action="edit"
                            data-id="${escapeHTML(product.id)}">
                            Editar
                        </button>

                        <button
                            type="button"
                            class="action-button delete-button"
                            data-action="delete"
                            data-id="${escapeHTML(product.id)}">
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;      
    }).join("");

    emptyMessage.hidden = filteredProducts.length !==0;

    document.getElementById("totalProducts").textContent = 
        products.length;

    document.getElementById("totalUnits").textContent =
        products.reduce(function(total, product) {
            return total + product.stock;
        }, 0);
    
    document.getElementById("lowStock").textContent =
        products.filter(function(product) {
            return product.stock <= product.minStock;
        }).length;
}

/* Mostrar un formulario limpio */
function resetProductForm() {
    productForm.reset();
    productId.value = "";
    productMinStock.value = "5";
    formTitle.textContent = "Registrar producto";
    formMessage.textContent = "";
}

/* Abrir formulario para un nuevo producto */
newProductButton.addEventListener("click", function() {
    resetProductForm();
    productFormSection.hidden = false;
    productCode.focus();

    productFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

/* Cancelar formulario */
cancelButton.addEventListener("click", function() {
    productFormSection.hidden = true;
    resetProductForm();
});

/* Registrar o acutalizar un producto */
productForm.addEventListener("submit", function(event) {
    event.preventDefault();
    formMessage.textContent = "";
    pageMessage.textContent = "";

    const id = productId.value;
    const code = productCode.value.trim();
    const name = productName.value.trim();
    const category = productCategory.value;
    const price = Number(productPrice.value);
    const stock = Number(productStock.value);
    const minStock = Number(productMinStock.value);

    if (
        !code ||
        !name ||
        !["Celulares", "Accesorios"].includes(category) ||
        productPrice.value.trim() === "" ||
        productStock.value.trim() === "" ||
        productMinStock.value.trim() === "" ||
        !Number.isFinite(price) ||
        !Number.isFinite(stock) ||
        !Number.isFinite(minStock) ||
        price <= 0 ||
        stock < 0 ||
        minStock < 0 ||
        !Number.isInteger(stock) ||
        !Number.isInteger(minStock)
    ) {
        formMessage.textContent =
            "Revisa los campos. El precio debe ser mayor que cero y las existencias deben ser números enteros no negativos.";
        
            return;
    }
    const duplicateCode = products.some(function(product) {
        return (
            product.code.toLowerCase() === code.toLowerCase() &&
            product.id !== id
        );
    });

    if (duplicateCode) {
        formMessage.textContent = "Ya existe un producto con ese código";

        return;
    }

    const productData = {
        id: id || (
            "P" + Date.now() + Math.random().toString(36).slice(2, 7)
        ),
        code: code,
        name: name,
        category: category,
        price: price,
        stock: stock,
        minStock: minStock
    };

    let updatedProducts;

    if (id) {
        updatedProducts = products.map(function(product) {
            return product.id === id ? productData : product;
        });
    } else {
        updatedProducts = [...products, productData];
    }

    const previousProducts = products;
    products = updatedProducts;

    if (!savedProducts( )) {
        products = previousProducts;
        return;
    }

    renderProducts();
    productFormSection.hidden = true;
    resetProductForm();

    pageMessage.textContent = id
        ? "Producto actualizado correctamente."
        : "Producto registrado correctamente";
});

/* Editar o borrar productos */
productsTableBody.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) {
        return;
    }

    if (action === "edit") {
        productId.value = product.id;
        productCode.value = product.code;
        productName.value = product.name;
        productCategory.value = product.category;
        productPrice.value = product.price;
        productStock.value = product.stock;
        productMinStock.value = product.minStock;

        formTitle.textContent = "Editar producto";
        formMessage.textContent = "";
        pageMessage.textContent = "";
        productFormSection.hidden = false;

        productFormSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        productCode.focus();
    }

    if (action === "delete") {
        const confirmed = window.confirm(
            '¿Deseas eliminar el producto "' + product.name + '"?'
        );

        if (!confirmed) {
            return;
        }

        const previousProducts = products;

        products = products.filter(function(item) {
            return item.id !== id;
        });

        if (!savedProducts()) {
            products = previousProducts;
            return;
        }

        renderProducts();
        pageMessage.textContent = "Producto eliminado correctamente.";

        if (productId.value === id) {
            resetProductForm();
            productFormSection.hidden = true;
        }
    }
});

/* BUSCAR PRODUCTOS */
searchInput.addEventListener("input", renderProducts);

renderProducts();