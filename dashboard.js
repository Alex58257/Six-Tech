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