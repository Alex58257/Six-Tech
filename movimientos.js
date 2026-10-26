const MOVEMENTS_TABLE = "movements";
const PRODUCTS_TABLE = "products";

let products = [];
let movements = [];
let showingArchived = false;

const productSelect = document.getElementById("movementProduct");
const movementForm = document.getElementById("movementForm");
const pageMessage = document.getElementById("movementsMessage");

const movementFormPanel = document.getElementById("movementFormPanel");
const newMovementButton= document.getElementById("newMovementButton");
const cancelMovementButton= document.getElementById("cancelMovementButton");

let allMovements = [];
const searchMovement = document.getElementById("searchMovement");
const movementTypeFilter =  document.getElementById("movementType");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const clearFiltersButton = document.getElementById("clearFiltersButton");

//Abrir el formulario
newMovementButton.addEventListener("click" ,() => {
    movementFormPanel.hidden = false;
    movementFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    movementForm.reset();
});

// Cerrar el formulario 
cancelMovementButton.addEventListener("click", () => {
    movementForm.reset();
    movementFormPanel.hidden = true;
    document.querySelector(".panel-heading").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// registro el movimiento
movementForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const productId = productSelect.value;
    const type = document.getElementById("newMovementType").value;
    const quantity = Number(
        document.getElementById("movementQuantity").value
    );
    const notes = document.getElementById("movementNotes").value.trim();

    if (!productId || !type || !Number .isInteger(quantity) || quantity <0) {
        pageMessage.textContent = "Verifica los datos de movimiento";
        return;
    }

    if (type !== "Ajuste" && quantity <1) {
        pageMessage.textContent =
            "Las entradas y salidas deben tener una cantidad mayor a cero."
        return;
    }
    const submitButton = movementForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    pageMessage.textContent = "Registrando movimiento...";

    try {
        const { data, error } = await supabaseClient.rpc(
            "register_movement",
            {
                p_product_id: productId,
                p_type: type,
                p_quantity: quantity,
                p_notes: notes || null
            }
        );

        if (error) {
            console.error("Error al registrar movimiento:", error);
            pageMessage.textContent =
                "No se pudo registrar el movimiento: " + error.message;
            return;
        }

        console.log("Resultado del movimiento:", data);

        movementForm.reset();
        movementFormPanel.hidden = true;

        await loadProducts();
        await loadMovements();

        pageMessage.textContent = "Movimiento registrado correctamente.";

        movementForm.reset();
        movementFormPanel.hidden = true;

        document.querySelector(".panel-heading").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        
    } catch (error) {
        console.error("Error inesperado:", error);
        pageMessage.textContent =
            "Ocurrió un error al registrar el movimiento.";
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
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



async function loadProducts() {
    const { data, error } = await supabaseClient
        .from(PRODUCTS_TABLE)
        .select("id, name, code, stock")
        .order("name", { ascending: true});

    if (error) {
        console.error("Error al cargar los productos", error);
        pageMessage.textContent = "No se pudieron cargar los productos";
        return false;
    }

    products = data || [];

    productSelect.innerHTML =
      '<option value="">Selecciona un producto</option>';

    products.forEach(function(product) {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent =
            `${product.name} (${product.code}) - Stock: ${product.stock}`;
        productSelect.appendChild(option);
    });

    return true;
}

async function loadMovements() {
    const {data, error} = await supabaseClient
        .from(MOVEMENTS_TABLE)
        .select(`
            id,
            product_id,
            type,
            quantity,
            previous_stock,
            resulting_stock,
            notes,
            date,
            archived_at,
            products (
                name,
                code
            )
        `)
        .is("archived_at", null);
    
    if (error) {
        console.error("Error al cargar movimientos:", error);
        pageMessage.textContent =
            "No se pudo cargar el historial de movimientos";
        return false;
    }

    allMovements = data || [];
    showingArchived = false;
    applyFilters();
    pageMessage.textContent = "";
}

async function loadArchiveMovements() {
    pageMessage.textContent = "Cargando movimientos archivados...";

    const { data, error } = await supabaseClient
        .from(MOVEMENTS_TABLE)
        .select(`
            id,
            product_id,
            type,
            quantity,
            previous_stock,
            resulting_stock,
            notes,
            date,
            archived_at,
            products (
                name,
                code
            )
        `)
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

    if (error) {
        console.error("Error al cargar archivados:", error);
        pageMessage.textContent =
            "No se pudieron cargar los movimientos archivados.";
        return;
    }

    allMovements = data || [];
    showingArchived = true;
    applyFilters();

    pageMessage.textContent = "Mostrando movimientos archivados.";
}

function renderMovements() {
    const tableBody = document.getElementById("movementsTableBody");
    const emptyMessage = document.getElementById("movementsEmpty");

    tableBody.innerHTML = movements.map(function(movement) {
       const product = movement.products || {};
       const date = movement.date
            ? new Date(movement.date).toLocaleDateString("es-Mx")
            : "Sin fecha";    
    return `
        <tr>
            <td>${escapeHTML(String(movement.id))}</td>
            <td>${escapeHTML(date)}</td>
            <td>${escapeHTML(product.name || "Producto no disponible")}</td>
            <td>${escapeHTML(product.code || "—")}</td>
            <td>${escapeHTML(movement.type || "")}</td>
            <td>${Number(movement.quantity || 0)}</td>
            <td>${Number(movement.resulting_stock || 0)}</td>
            <td>${escapeHTML(movement.notes || "—")}</td>
            <td>
                <button
                    type="button"
                    class="archive-button"
                    data-archive-id="${escapeHTML(String(movement.id))}">
                    ${showingArchived ? "Restaurar" :"Archivar"}
                </button>
            </td>
        </tr>
    `;
    }).join("");

    emptyMessage.hidden = movements.length > 0;
    if (movements.length === 0) {
        emptyMessage.textContent = allMovements.length === 0
            ? "No hay movimientos registrados."
            : "No se encontraron movimientos con los filtros seleccionados.";
    } else {
        emptyMessage.textContent = "No hay movimientos registrados.";
    }

    document.getElementById("totalMovements").textContent =
        movements.length;

    document.getElementById("totalEntries").textContent =
        movements.filter(function(movement) {
            return movement.type === "Entrada";
        }).length; 

    document.getElementById("totalExits").textContent =
        movements.filter(function(movement) {
            return movement.type === "Salida";
        }).length; 
    
    document.getElementById("totalAdjustments").textContent=
        movements.filter(function(movement) {
            return movement.type === "Ajuste";
        }).length;
}

function applyFilters() {
    const searchText = searchMovement.value.trim().toLowerCase();
    const selectedType = movementTypeFilter.value;
    const fromDate = startDate.value;
    const toDate = endDate.value;

    movements = allMovements.filter(function(movement) {
        const product = movement.products || {};

        const name = String(product.name || "").toLowerCase();
        const code = String(product.code || "").toLowerCase();

        const matchesSearch =
            !searchText ||
            name.includes(searchText) ||
            code.includes(searchText);
        const matchesType =
            !selectedType || movement.type === selectedType;
        
        let movementDate = "";

        if (movement.date) {
            const dateText = String(movement.date);

            if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
                movementDate = dateText.slice(0, 10);
            } else {
                const date = new Date(movement.date);

                if (!Number.isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");

                    movementDate = `${year}-${month}-${day}`;
                }
            }
        }

        const matchesStartDate =
            !fromDate || (movementDate && movementDate >= fromDate);
        
        const matchesEndDate =
            !toDate || (movementDate && movementDate <= toDate);

        return (
            matchesSearch &&
            matchesType &&
            matchesStartDate &&
            matchesEndDate
        );
    });

    renderMovements();
}

// Busca por nombre o código
searchMovement.addEventListener("input", applyFilters);

//Filtrar por tipo y fechas
movementTypeFilter.addEventListener("change", applyFilters);
startDate.addEventListener("change", applyFilters);
endDate.addEventListener("change", applyFilters);

//Limpiar todos los filtros
clearFiltersButton.addEventListener("click", function() {
    searchMovement.value = "";
    movementTypeFilter.value = "";
    startDate.value = "";
    endDate.value = "";

    applyFilters();
});

async function archiveMovement(movementId) {
    const confirmed = confirm(
        "¿Quieres archivar este movimiento? Podrás consultarlo después?."
    );

    if (!confirmed) return;

    pageMessage.textContent = "Archivando movimiento...";

    try {
        const { data, error } = await supabaseClient.rpc("archive_movement", {
            p_movement_id: movementId
        });

        console.log("Resultado al archivar:", data)
        console.log("Error al archivar:", error);

        if (error) {
            console.error(error);
            pageMessage.textContent =
                "No se pudo archivar el movimiento";
            return;
        }

        if (data !== true) {
            pageMessage.textContent =
                "El movimiento no existe o ya estaba archivado.";
            return;
        }

        await loadMovements();
        pageMessage.textContent = "Movimiento archivado correctamente.";

    } catch (error) {
        console.error("Error inesperado al archivar:", error);
        pageMessage.textContent =
            "Ocurrió un error al archivar el movimiento.";
    }
}

async function restoreMovement(movementId) {
    const confirmed = confirm (
        "¿Deseas restaurar ese movimiento?"
    );

    if (!confirmed) return;

    pageMessage.textContent = "Restaurando movimiento...";

    try {
        const{ data, error} = await supabaseClient.rpc (
            "restore_movement",
            {
                p_movement_id: movementId
            }
        );

        if (error) {
            console.error("Error al restaurar:", error);
            pageMessage.textContent =
                "No se pudo restaurar el movimiento";
            return;
        }

        if (data !== true) {
            pageMessage.textContent =
                "El movimiento no existe o ya estaba activo.";
            return;
        }

        await loadArchiveMovements();

        pageMessage.textContent =
            "Movimiento restaurado correctamente.";
        
    } catch(error) {
        console.error(error);
        pageMessage.textContent =
            "Ocurrió un error al restaurar el movimiento";
    }
}

async function initializeMovements() {
    try {
        const { data, error} =
            await supabaseClient.auth.getSession();

            if (error || !data.session) {
                window.location.href = "index.html";
                return;
            }

            const productLoaded = await loadProducts();

            if (!productLoaded) {
                return;
            }

            await loadMovements();
    } catch (error) {
        console.error("Error al iniciar Movimientos", error);
        pageMessage.textContent =
            "Ocurrió un error al abrir el módulo.";
    }
}

document
    .getElementById("movementsTableBody")
    .addEventListener("click", function(event) {
        const button  = event.target.closest("[data-archive-id]");

        if  (!button) return;        
        const movementId = button.dataset.archiveId;

        if(showingArchived) {
            restoreMovement(movementId);
        } else {
            archiveMovement(movementId);
        }
    
});

document
    .getElementById("viewArchivedButton")
    .addEventListener("click", async function(){
        await loadArchiveMovements();
    });

document 
    .getElementById("viewAllMovementsButton")
    .addEventListener("click", async function(){
        await loadMovements();
    });
initializeMovements();