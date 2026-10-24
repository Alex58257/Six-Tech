const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");
const botonLogin = loginForm.querySelector('button[type="submit"]');

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("password").value;

    mensaje.textContent = "";
    botonLogin.disabled = true;
    botonLogin.textContent = "Verificando...";

    try {
        // Verificación de correo y contraseña con supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: usuario,
            password: contrasena
        });
    
    if (error) {
        throw new Error("Correo electrónico o contraseña incorrectos.");
    } 

    // Hace la consulta del perfil y el rol del usuario
    const {data: perfil, error:errorPerfil } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", data.user.id)
        .single();

    if (errorPerfil || !perfil) {
        await supabaseClient.auth.signOut();
        throw new Error (
            "Su cuenta no tiene el perfil configurado. Contacte al administrador"
        );
    }

    //Se guarda el perfil para utilizarlo en la interfaz
    sessionStorage.setItem("sixtech_user", JSON.stringify({
        id:perfil.id,
        fullName: perfil.full_name,
        role: perfil.role
    }));

    //Entra al panel principal, que es el dashboard
    window.location.href = "dashboard.html";

}   catch (error) {
        mensaje.textContent = error.message;
        botonLogin.disabled = false;
        botonLogin.textContent = "Iniciar sesión";
}
});