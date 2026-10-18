const formulario = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("password").value;

    if (usuario.trim() !== "" && contrasena.trim() !== "") {
        window.location.href = "dashboard.html";
    } else {
        mensaje.textContent = "Complete todos los campos";
    }
})