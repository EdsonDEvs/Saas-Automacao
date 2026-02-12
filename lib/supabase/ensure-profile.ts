import { createClient } from "@/lib/supabase/client"

/**
 * Garante que o perfil do usuário existe.
 * Se não existir, cria automaticamente.
 */
export async function ensureUserProfile() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Usuário não autenticado")
  }

  // Verifica se o perfil existe
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  // Se não existir, cria o perfil
  if (profileError || !profile) {
    const businessName = user.user_metadata?.business_name || "Minha Empresa"
    
    // Cria o perfil
    const { error: insertProfileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        business_name: businessName,
        phone_number: null,
      })

    if (insertProfileError) {
      throw new Error(`Erro ao criar perfil: ${insertProfileError.message}`)
    }

    // Cria a configuração do agente se não existir
    const { data: agentConfig } = await supabase
      .from("agent_configs")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!agentConfig) {
      await supabase
        .from("agent_configs")
        .insert({
          user_id: user.id,
          agent_name: "Assistente",
          service_catalog: [],
        })
    }

    // Cria a API key se não existir
    const { data: apiKey } = await supabase
      .from("api_keys")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!apiKey) {
      // Gera um UUID simples (o banco também tem DEFAULT, mas vamos garantir)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }
      
      await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          key: generateUUID(),
          is_active: true,
        })
    }
  }

  return user
}
