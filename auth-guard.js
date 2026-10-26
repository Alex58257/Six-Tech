(async function protectPage (){
    // Se oculta la página mientras se comprueba la sesión

    document.documentElement.style.visibility = "hidden";

    try {
        const { data : {user}, error} =
            await supabaseClient.auth.getUser();
        
        if (error || !user) {
            window.location.replace("index.html");
            return;
        }

        //Hay un usuario auntenticado: mostrar la página
        document.documentElement.style.visibility = "visible";
    } catch (error) {
        console.error("Error al verificar la sesión", error);
        window.location.replace("index.html");
    }
})();


