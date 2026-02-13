/**
 * Helper function para buscar serviços/produtos do banco de dados
 * Tenta buscar da tabela 'services' primeiro, e se não existir, usa 'products' como fallback
 * Isso permite que o código funcione antes e depois da migration
 */

export async function getServicesTable(supabase: any): Promise<string> {
  try {
    // Tenta verificar se a tabela 'services' existe fazendo uma query simples
    const { error: servicesError } = await supabase
      .from("services")
      .select("id")
      .limit(0) // Não retorna dados, só verifica se a tabela existe

    // Se não houver erro, a tabela existe
    if (!servicesError) {
      return "services"
    }

    // Se o erro for "table not found", usa products como fallback
    const errorMessage = servicesError?.message || ""
    const errorCode = servicesError?.code || ""
    
    if (errorMessage.includes("Could not find the table") || 
        errorMessage.includes("schema cache") ||
        errorCode === "PGRST116" ||
        errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      console.log("[getServicesTable] Tabela 'services' não encontrada, usando 'products' como fallback")
      return "products"
    }

    // Para outros erros (permissão, etc), tenta services mesmo assim
    console.warn("[getServicesTable] Erro ao verificar tabela 'services':", servicesError)
    return "services"
  } catch (error: any) {
    // Em caso de exceção, usa products como fallback seguro
    console.warn("[getServicesTable] Exceção ao verificar tabela, usando 'products':", error)
    return "products"
  }
}

/**
 * Busca serviços do banco de dados, usando fallback automático
 */
export async function fetchServices(supabase: any, userId: string, options: {
  stock_status?: boolean
  orderBy?: string
} = {}) {
  const tableName = await getServicesTable(supabase)
  
  let query = supabase
    .from(tableName)
    .select("*")
    .eq("user_id", userId)

  if (options.stock_status !== undefined) {
    query = query.eq("stock_status", options.stock_status)
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: true })
  }

  return await query
}
