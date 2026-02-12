import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key não fornecida. Adicione o header 'x-api-key'." },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Validate API key and get user
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key", apiKey)
      .eq("is_active", true)
      .maybeSingle()

    if (apiKeyError) {
      console.error("[Context API] Erro ao buscar API key:", apiKeyError)
      return NextResponse.json(
        { error: "Erro ao validar API key.", details: apiKeyError.message },
        { status: 500 }
      )
    }

    if (!apiKeyData || !apiKeyData.user_id) {
      return NextResponse.json(
        { error: "API key inválida ou inativa." },
        { status: 401 }
      )
    }

    const userId = apiKeyData.user_id

    // Fetch agent config
    const { data: agentConfig, error: agentError } = await supabase
      .from("agent_configs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (agentError) {
      console.error("[Context API] Erro ao buscar agent config:", agentError)
      return NextResponse.json(
        { error: "Erro ao buscar configuração do agente.", details: agentError.message },
        { status: 500 }
      )
    }

    if (!agentConfig) {
      return NextResponse.json(
        { error: "Configuração do agente não encontrada." },
        { status: 404 }
      )
    }

    // Fetch active products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .eq("stock_status", true)
      .order("name", { ascending: true })

    if (productsError) {
      return NextResponse.json(
        { error: "Erro ao buscar produtos." },
        { status: 500 }
      )
    }

    // Format inventory text for LLM
    const inventoryText = products
      ?.map(
        (product) =>
          `- ${product.name} (R$ ${product.price.toFixed(2)}): ${product.description || "Sem descrição"}`
      )
      .join("\n") || "Nenhum produto disponível no momento."

    // Build response
    const response = {
      agent: {
        name: agentConfig.agent_name,
        persona: agentConfig.system_prompt,
        tone: agentConfig.tone,
        services: agentConfig.service_catalog || [],
      },
      context: agentConfig.system_prompt,
      inventory_text: inventoryText,
    }

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    )
  }
}
