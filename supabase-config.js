const SUPABASE_URL = "https://ujnumnqltahrcieoadzl.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ORMdhS-t_KjbWgYeoavzOg_sZjihLUo"

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Cliente de supabase", supabaseClient);

(async function testSupabaseConnection() {
    const { data, error } = await supabaseClient
    .from("products")
    .select("id")
    .limit(1);

    if (error) {
        console.error("Error al consultar Supabase", error);
    } else{
        console.log("Consulta a supabase correcta", data);
    }
})();
