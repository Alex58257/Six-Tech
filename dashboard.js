function cerrarSesion() {
    window.location.href = "index.html";
}

const botones = document.querySelectorAll("[data-modulo]");
const mensaje = document.getElementById("mensaje");

botones.forEach(function(boton) {
    boton.addEventListener("click", function() {
        const modulo = boton.dataset.modulo;

        mensaje.textContent = "El módulo de " + modulo + " se hará después";

    });
});

 const menuButton = document.getElementById("menuButton");
 const menuDropdown = document.getElementById("menuDropdown");

 menuButton.addEventListener("click", function() {
    const estaAbierto = 
        menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute("aria-expanded", String(!estaAbierto));
    menuDropdown.hidden = estaAbierto;
 });

 document.addEventListener("click", function(event){
    if(!event.target.closest(".user-menu")) {
        menuDropdown.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
    }
 });

document.addEventListener("keydown", function(event){
    if (event.key === "Escape") {
        menuDropdown.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.focus();
    }
});
