let products = [];
let currentRole = null;

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

/* CARGA DE PRODUCTOS DESDE SUPABASE */
async function loadProducts() {
    pageMessage.textContent = "Cargando productos...";

    const {data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("name" , { ascending: true});

    if (error) {
        console.error("Error al cargar productos", error);
        pageMessage.textContent =
            "No se pudieron cargar los productos. Verifica tu sesión y la conexión";
        return false;
    }

    //Adaptar los nombre de las columnas de la bd
    products = data.map(function(product) {
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
    pageMessage.textContent = "";
    renderProducts();

    return true;
}

/* PERMISOS DE LA INTERFAZ */
async function initializeProducts() {
    try {
        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();
        
        if (sessionError || !sessionData.session) {
            window.location.href = "index.html";
            return;
        }

        const user = sessionData.session.user;

        const { data: profile, error: profileError} =
            await supabaseClient
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
        
        if (profileError || !profile) {
            pageMessage.textContent =
                "No se pudo verificar tu perfil. Contacta al administrador";
            return;
        }

        currentRole = profile.role;

        const isAdmin = currentRole === "admin";

        //SOLO EL ADMINISTRADOR PUEDE MODIFICAR PRODUCTOS
        newProductButton.hidden = !isAdmin;
        productFormSection.hidden = true;

        if(!isAdmin) {
            pageMessage.textContent =
                "Modo consulta: puedes revisar el inventario, pero no modificar productos";
        }

        await loadProducts();
    } catch (error) {
        console.error("Error al iniciar Productos:", error);
        pageMessage.textContent =
            "Ocurrió un error al abrir el módulo de productos";
    }
}


/* Renderizar la tabla de productos y las estadísticas */

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredProducts = products.filter(function(product) {
        const name = String(product.name ?? "").toLowerCase();
        const code = String(product.code ?? "").toLowerCase();
        return (
            name.includes(searchTerm) ||
            code.includes(searchTerm)
        );
    });

    productsTableBody.innerHTML = filteredProducts.map(function(product) {
        const status = getStockStatus(product);

        const actions = currentRole === "admin"
            ?  `
                <div class="action">
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
             `
             : "Solo consulta";
        return `
            <tr>
                <td>${escapeHTML(product.code)}</td>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${formatPrice(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="stock-badge ${status.className}">
                        ${status.label}
                    </span>
                </td>
                <td>${actions}</td>
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
    if (currentRole !== "admin") return;

    resetProductForm();
    productFormSection.hidden = false;

    productFormSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    productCode.focus();

});
/* Cancelar formulario */
cancelButton.addEventListener("click", function() {
    productFormSection.hidden = true;
    resetProductForm();
});

/* Registrar o acutalizar un producto */
productForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (currentRole !== "admin") {
        formMessage.textContent = 
            "No tienes permiso para modificar productos.";
        return;        
    }

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
        code: code,
        name: name,
        category: category,
        price: price,
        stock: stock,
        min_stock: minStock
    };

    const submitButton = productForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try{
        let error;
        if (id) {
            //Actualizar los productos existente
            ({error} = await supabaseClient
                .from("products")
                .update(productData)
                .eq("id", id)
            );
        } else {
            //Creación de un producto nuevo
            productData.id =
                "P" + Date.now() +
                Math.random().toString(36).slice(2,7);
            
            ({ error} = await supabaseClient
                .from("products")
                .insert(productData)
            );
        }

        if (error) {
            console.error("Error al guardar producto:", error);

            if (error.code ==="23505") {
                throw new Error(
                    "Ya existe un producto con ese código"
                );
            }

            throw new Error(
                "No se pudo guardar el producto. Verifica los permisos y vuelve a intentarlo."
            );
        }

        const wasEditing = Boolean(id);

        productFormSection.hidden = true;
        resetProductForm();

        await loadProducts();

        pageMessage.textContent = wasEditing
            ? "Producto actualizado correctamente"
            : "Producto registrado correctamente";
        
    } catch (error) {
        formMessage.textContent = error.message;
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
    
});

/* Editar o borrar productos */
productsTableBody.addEventListener("click", async function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || currentRole !== "admin") return; 

    const id = button.dataset.id;
    const action = button.dataset.action;

    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) return;
    
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

        if (!confirmed) return;

        const { error } = await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);
        if (error) {
            console.error("Error al eliminar el producto", error);
            pageMessage.textContent = 
                "No se pudo eliminar el producto. Puede estar relacionado con registros existentes";
            return;
        }

        if (productId.value === id) {
            resetProductForm();
            productFormSection.hidden = true;
        }

        await loadProducts();
        pageMessage.textContent = "Producto eliminado correctamente"            
    }
});
/* BUSCAR PRODUCTOS */
searchInput.addEventListener("input", renderProducts);

initializeProducts();